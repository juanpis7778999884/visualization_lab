'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { generateFighterQuestion } from '@/lib/fighter-questions'
import type { MathFunction } from '@/lib/types'
import {
  Swords,
  Crown,
  Medal,
  Target,
  Plus,
  Award,
  RefreshCw,
} from 'lucide-react'

interface Fighter {
  id: string
  name: string
  color: string
  wins: number
  losses: number
  total_points: number
}

interface Match {
  id: string
  player1_id: string
  player2_id: string | null
  player1_hp: number
  player2_hp: number
  status: 'waiting' | 'fighting' | 'finished'
  winner_id: string | null
  current_round: number
  function_expression: string
  function_domain: { xMin: number; xMax: number; yMin: number; yMax: number }
}

interface Move {
  id: string
  match_id: string
  player_id: string
  type: 'correct' | 'wrong' | 'timeout'
  damage: number
  created_at: string
}

interface MathFighterProps {
  currentFunction: MathFunction
  onWin?: () => void
}

const COLORS = ['#00f0ff', '#7c3aed', '#ec4899', '#fbbf24', '#10b981', '#fb7185']
// Cuánto dura visible el feedback de "fallaste" antes de dejarte reintentar.
const WRONG_ANSWER_RETRY_DELAY_MS = 1200

export function MathFighter({ currentFunction, onWin }: MathFighterProps) {
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [showCreateFighter, setShowCreateFighter] = useState(false)
  const [newFighterName, setNewFighterName] = useState('')
  const [newFighterColor, setNewFighterColor] = useState('#00f0ff')
  const [gameMessage, setGameMessage] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [winner, setWinner] = useState<Fighter | null>(null)
  const [answeredThisRound, setAnsweredThisRound] = useState(false)
  const [pickedIndex, setPickedIndex] = useState<number | null>(null)
  const [lastWasWrong, setLastWasWrong] = useState(false)

  const retryTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentMatchRef = useRef<Match | null>(null)
  const answeredRef = useRef(false)
  currentMatchRef.current = currentMatch

  const isPlaying = currentMatch?.status === 'fighting'

  // La pregunta se calcula localmente a partir de match.id + ronda actual:
  // ambos celulares llegan al MISMO resultado sin escribirlo en la base de datos.
  // Como ahora la ronda solo cambia cuando alguien ACIERTA, esta misma pregunta
  // se mantiene visible para ambos jugadores mientras nadie la resuelva bien,
  // sin importar cuántos minutos tarden.
  const question = useMemo(() => {
    if (!currentMatch || currentMatch.status !== 'fighting') return null
    return generateFighterQuestion(
      currentMatch.id,
      currentMatch.current_round,
      currentMatch.function_expression,
      currentMatch.function_domain
    )
  }, [currentMatch?.id, currentMatch?.current_round, currentMatch?.status])

  // Reiniciar estado de la ronda cada vez que cambia (nueva pregunta,
  // es decir: alguien acertó y se pasó de ronda).
  useEffect(() => {
    setAnsweredThisRound(false)
    answeredRef.current = false
    setPickedIndex(null)
    setLastWasWrong(false)
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
  }, [currentMatch?.current_round, currentMatch?.id])

  // Cargar luchadores + realtime del ranking
  useEffect(() => {
    const loadFighters = async () => {
      const { data } = await supabase
        .from('fighters')
        .select('*')
        .order('total_points', { ascending: false })
      if (data) setFighters(data)
    }
    loadFighters()

    const channel = supabase
      .channel('fighters_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fighters' }, loadFighters)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Suscripción a la partida activa: esto es lo que sincroniza a los dos jugadores
  useEffect(() => {
    if (!selectedFighter) return

    const channel = supabase
      .channel(`match_channel_${selectedFighter}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        (payload) => {
          const match = payload.new as Match
          if (match.player1_id === selectedFighter || match.player2_id === selectedFighter) {
            setCurrentMatch(match)
            setWaitingForOpponent(false)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          const match = payload.new as Match
          if (match.id !== currentMatchRef.current?.id) return

          setCurrentMatch(match)

          if (match.status === 'finished' && match.winner_id) {
            setFighters((prev) => {
              const winnerFighter = prev.find((f) => f.id === match.winner_id) || null
              setWinner(winnerFighter)
              return prev
            })
            setShowResult(true)
            if (match.winner_id === selectedFighter && onWin) onWin()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moves' },
        (payload) => {
          const move = payload.new as Move
          if (move.match_id !== currentMatchRef.current?.id) return
          setMoveHistory((prev) => [...prev, move])
          setFighters((prev) => {
            const fighter = prev.find((f) => f.id === move.player_id)
            const label = fighter?.name || 'Jugador'
            setGameMessage(
              move.type === 'correct'
                ? `🥊 ¡${label} acertó y golpea! (-${move.damage} HP)`
                : `💥 ¡${label} falló y se lastima! (-${move.damage} HP)`
            )
            setTimeout(() => setGameMessage(''), 2000)
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedFighter, onWin])

  // Limpiar el timer de reintento si el componente se desmonta.
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  // Enviar respuesta: la corrección se valida contra la pregunta calculada
  // localmente, y el golpe se aplica en el servidor de forma atómica.
  //
  // Ya no hay límite de tiempo. Si fallas, ves brevemente el error y
  // puedes volver a intentar la MISMA pregunta (te llevas el golpe de
  // penalización cada vez que fallas). La ronda solo avanza cuando
  // alguno de los dos acierta primero — el RPC del servidor es quien
  // decide eso de forma atómica, así que no importa la latencia de red.
  const handleAnswer = async (optionIndex: number) => {
    if (!currentMatch || !selectedFighter || !question) return
    if (answeredRef.current) return
    answeredRef.current = true
    setAnsweredThisRound(true)
    setPickedIndex(optionIndex)

    const correct = optionIndex === question.correctIndex
    setLastWasWrong(!correct)

    await supabase.rpc('fighter_submit_answer', {
      p_match_id: currentMatch.id,
      p_player_id: selectedFighter,
      p_round: currentMatch.current_round,
      p_correct: correct,
    })

    if (!correct) {
      // Si acertaste, current_round cambia por realtime y el useEffect de
      // arriba resetea todo solo. Si fallaste, la ronda sigue igual, así
      // que hay que volver a habilitar las opciones manualmente.
      retryTimerRef.current = setTimeout(() => {
        answeredRef.current = false
        setAnsweredThisRound(false)
        setPickedIndex(null)
        setLastWasWrong(false)
      }, WRONG_ANSWER_RETRY_DELAY_MS)
    }
  }

  const createFighter = async () => {
    if (!newFighterName.trim()) return
    const { data, error } = await supabase
      .from('fighters')
      .insert({ name: newFighterName, color: newFighterColor })
      .select()

    if (!error && data) {
      setFighters((prev) => [...prev, data[0]])
      setSelectedFighter(data[0].id)
      setNewFighterName('')
      setShowCreateFighter(false)
    }
  }

  // Buscar partida: la función/dominio activos quedan "congelados" en el
  // match para que los dos jugadores peleen sobre la misma superficie.
  const findMatch = async () => {
    if (!selectedFighter) return
    setWaitingForOpponent(true)

    const { data: waitingMatch } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'waiting')
      .neq('player1_id', selectedFighter)
      .limit(1)

    if (waitingMatch && waitingMatch.length > 0) {
      const { data: updated } = await supabase
        .from('matches')
        .update({ player2_id: selectedFighter, status: 'fighting' })
        .eq('id', waitingMatch[0].id)
        .select()

      if (updated && updated[0]) {
        setCurrentMatch(updated[0])
      }
      setWaitingForOpponent(false)
    } else {
      const { data: newMatch } = await supabase
        .from('matches')
        .insert({
          player1_id: selectedFighter,
          status: 'waiting',
          function_expression: currentFunction.expression,
          function_domain: currentFunction.domain,
        })
        .select()

      if (newMatch) setCurrentMatch(newMatch[0])
    }
  }

  // "Reiniciar" (fuera de combate): solo limpia partidas en 'waiting' que
  // nadie más se unió a jugar todavía, así que no hay historial que perder
  // y sí es seguro un DELETE real aquí. Una partida ya 'finished' NO se
  // borra (se conserva el historial); solo se limpia del estado local.
  const resetMatch = async () => {
    if (currentMatch && currentMatch.status === 'waiting') {
      await supabase.from('matches').delete().eq('id', currentMatch.id)
    }
    setCurrentMatch(null)
    setWaitingForOpponent(false)
    setShowResult(false)
    setWinner(null)
    setMoveHistory([])
  }

  // "Rendirse" (en pleno combate): ya NO borra la partida (eso era lo que
  // daba 409 y además perdía el historial de golpes). En vez de eso llama
  // al RPC fighter_give_up, que declara ganador al oponente y actualiza
  // las estadísticas de ambos luchadores de forma atómica.
  const giveUp = async () => {
    if (!currentMatch || !selectedFighter) return
    await supabase.rpc('fighter_give_up', {
      p_match_id: currentMatch.id,
      p_player_id: selectedFighter,
    })
    // No hace falta actualizar estado local a mano: el UPDATE de `matches`
    // llega por realtime (arriba) y dispara el modal de resultado solo.
  }

  const renderHealthBar = (hp: number, maxHp = 100) => {
    const percentage = (hp / maxHp) * 100
    const color = percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
    return (
      <div className="w-full h-4 bg-black/30 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    )
  }

  const sortedFighters = [...fighters].sort((a, b) => b.total_points - a.total_points)
  const me = fighters.find((f) => f.id === selectedFighter)
  const p1 = fighters.find((f) => f.id === currentMatch?.player1_id)
  const p2 = fighters.find((f) => f.id === currentMatch?.player2_id)

  return (
    <motion.div
      className="glass rounded-2xl p-6 space-y-6 border border-yellow-400/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Swords className="size-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-foreground">⚔️ MATH FIGHTER</h2>
        </div>
        {isPlaying && <span className="text-xs text-cyan-400 animate-pulse">⚔️ En combate</span>}
      </div>

      {!selectedFighter ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Crea o selecciona tu luchador para empezar
          </p>

          {!showCreateFighter ? (
            <div className="space-y-3">
              {sortedFighters.map((fighter) => (
                <motion.button
                  key={fighter.id}
                  onClick={() => setSelectedFighter(fighter.id)}
                  className="w-full glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-4 rounded-full" style={{ backgroundColor: fighter.color }} />
                    <span className="font-medium text-foreground">{fighter.name}</span>
                    <span className="text-xs text-muted-foreground">🏆 {fighter.total_points} pts</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">✅ {fighter.wins}</span>
                    <span className="text-red-400">❌ {fighter.losses}</span>
                  </div>
                </motion.button>
              ))}

              <motion.button
                onClick={() => setShowCreateFighter(true)}
                className="w-full glass p-4 rounded-xl flex items-center justify-center gap-2 text-cyan-400 hover:bg-white/5 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={18} />
                <span>Crear nuevo luchador</span>
              </motion.button>
            </div>
          ) : (
            <div className="glass-light rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Nuevo Luchador</h3>
              <input
                type="text"
                value={newFighterName}
                onChange={(e) => setNewFighterName(e.target.value)}
                placeholder="Nombre del luchador"
                className="w-full bg-black/30 border border-cyan-400/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-cyan-400"
              />
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewFighterColor(color)}
                    className={`size-8 rounded-full border-2 transition-all ${
                      newFighterColor === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createFighter}
                  className="flex-1 py-2 bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
                >
                  Crear
                </button>
                <button
                  onClick={() => setShowCreateFighter(false)}
                  className="px-4 py-2 glass text-muted-foreground rounded-lg hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : !isPlaying ? (
        <div className="space-y-4">
          <div className="glass-light rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-4 rounded-full" style={{ backgroundColor: me?.color }} />
              <span className="font-medium text-foreground">{me?.name}</span>
              <span className="text-xs text-muted-foreground">🏆 {me?.total_points || 0} pts</span>
            </div>
            <button
              onClick={() => setSelectedFighter(null)}
              className="text-xs text-muted-foreground hover:text-cyan-400 transition-colors"
            >
              Cambiar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={findMatch}
              className="glass p-4 rounded-xl text-center hover:bg-white/5 transition-all border border-cyan-400/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Target size={24} className="mx-auto text-cyan-400 mb-2" />
              <p className="text-sm font-medium text-foreground">Buscar oponente</p>
              <p className="text-xs text-muted-foreground">Matchmaking</p>
            </motion.button>

            <motion.button
              onClick={resetMatch}
              className="glass p-4 rounded-xl text-center hover:bg-white/5 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Reiniciar</p>
              <p className="text-xs text-muted-foreground">Limpiar partida</p>
            </motion.button>
          </div>

          {waitingForOpponent && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-cyan-400 border-t-transparent mb-2" />
              <p className="text-sm text-cyan-400">Buscando oponente...</p>
            </div>
          )}

          {currentMatch && currentMatch.status === 'waiting' && (
            <div className="text-center py-4 text-yellow-400">
              ⏳ Esperando a que otro jugador se una...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: p1?.color }} />
                <span className="font-bold text-sm text-foreground">{p1?.name || '?'}</span>
              </div>
              <div className="mt-2">{renderHealthBar(currentMatch?.player1_hp ?? 100)}</div>
              <div className="text-xs text-muted-foreground mt-1">❤️ {currentMatch?.player1_hp ?? 100} HP</div>
            </div>

            <div className="text-center">
              <Swords className="size-8 text-yellow-400 mx-auto animate-pulse" />
              <div className="text-xs text-muted-foreground mt-1">⚔️ VS</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-sm text-foreground">{p2?.name || '?'}</span>
                <div className="size-3 rounded-full" style={{ backgroundColor: p2?.color }} />
              </div>
              <div className="mt-2">{renderHealthBar(currentMatch?.player2_hp ?? 100)}</div>
              <div className="text-xs text-muted-foreground mt-1">❤️ {currentMatch?.player2_hp ?? 100} HP</div>
            </div>
          </div>

          {question && (
            <div className="glass-light rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-400">🎯 Ronda {(currentMatch?.current_round ?? 0) + 1}</span>
                <span className="text-xs text-muted-foreground">
                  🏁 Gana el primero en acertar
                </span>
              </div>
              <p className="text-sm text-foreground text-center font-medium">{question.prompt}</p>

              <div className="grid grid-cols-1 gap-2">
                {question.options.map((opt, i) => {
                  const isPicked = pickedIndex === i
                  const revealWrong = answeredThisRound && isPicked && lastWasWrong
                  return (
                    <button
                      key={i}
                      disabled={answeredThisRound}
                      onClick={() => handleAnswer(i)}
                      className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-left transition-all border ${
                        revealWrong
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : answeredThisRound
                          ? 'bg-white/5 border-white/10 text-muted-foreground'
                          : 'bg-black/30 border-cyan-400/20 text-foreground hover:border-cyan-400/60 hover:bg-white/5'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>

              {answeredThisRound && (
                <p className="text-xs text-muted-foreground text-center">
                  {lastWasWrong
                    ? `${question.detail} · fallaste, puedes volver a intentar en un momento...`
                    : `${question.detail} · esperando el resultado de la ronda...`}
                </p>
              )}
            </div>
          )}

          {gameMessage && (
            <motion.div
              className="text-center text-sm font-bold text-yellow-400"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {gameMessage}
            </motion.div>
          )}

          {moveHistory.length > 0 && (
            <div className="glass-light rounded-lg p-3 max-h-20 overflow-y-auto">
              <div className="flex items-center gap-2 flex-wrap">
                {moveHistory.slice(-5).map((move, i) => (
                  <span
                    key={move.id || i}
                    className={`text-xs px-2 py-1 rounded ${
                      move.type === 'correct' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {move.type === 'correct' ? '🥊' : '💥'}
                    {move.damage > 0 && ` -${move.damage}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={giveUp}
            className="w-full py-2 text-xs text-muted-foreground hover:text-red-400 transition-colors"
          >
            🏳️ Rendirse
          </button>
        </div>
      )}

      {showResult && winner && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="glass rounded-3xl p-8 max-w-md w-full text-center border border-yellow-400/50 shadow-2xl shadow-yellow-400/20"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
          >
            <Crown className="size-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground">🏆 ¡{winner.name} GANA!</h2>
            <div className="size-12 rounded-full mx-auto my-4" style={{ backgroundColor: winner.color }} />
            <p className="text-sm text-muted-foreground">
              ¡Excelente combate! {winner.name} demostró su dominio matemático.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={resetMatch}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
              >
                🔄 Nueva pelea
              </button>
              <button
                onClick={() => {
                  setShowResult(false)
                  setWinner(null)
                  resetMatch()
                }}
                className="flex-1 py-3 glass text-muted-foreground rounded-lg hover:bg-white/5 transition-all"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {sortedFighters.length > 0 && (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <Award size={16} />
            RANKING DE LUCHADORES
          </h3>
          <div className="space-y-1">
            {sortedFighters.slice(0, 5).map((fighter, index) => (
              <div key={fighter.id} className="flex items-center justify-between text-xs p-2 rounded-lg glass">
                <div className="flex items-center gap-2">
                  {index === 0 ? (
                    <Crown size={14} className="text-yellow-400" />
                  ) : index === 1 ? (
                    <Medal size={14} className="text-slate-400" />
                  ) : index === 2 ? (
                    <Medal size={14} className="text-amber-600" />
                  ) : (
                    <span className="w-4 text-center text-muted-foreground">{index + 1}</span>
                  )}
                  <div className="size-2 rounded-full" style={{ backgroundColor: fighter.color }} />
                  <span>{fighter.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">{fighter.total_points} pts</span>
                  <span className="text-green-400">{fighter.wins}W</span>
                  <span className="text-red-400">{fighter.losses}L</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
