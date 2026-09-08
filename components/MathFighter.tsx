'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import {
  Swords,
  Shield,
  Zap,
  Crown,
  Medal,
  Timer,
  Target,
  Users,
  Plus,
  LogIn,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Flame,
  Heart,
  Skull,
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
  player2_id: string
  player1_hp: number
  player2_hp: number
  status: 'waiting' | 'fighting' | 'finished'
  winner_id: string | null
  current_round: number
}

interface Move {
  id: string
  match_id: string
  player_id: string
  type: 'correct' | 'wrong' | 'timeout'
  damage: number
  timestamp: string
}

interface MathFighterProps {
  currentFunction: string
  onWin?: () => void
}

const COLORS = ['#00f0ff', '#7c3aed', '#ec4899', '#fbbf24', '#10b981', '#fb7185']
const DAMAGE_CORRECT = 15
const DAMAGE_WRONG = 5

export function MathFighter({ currentFunction, onWin }: MathFighterProps) {
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [challenge, setChallenge] = useState<{ question: string; answer: string } | null>(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [showCreateFighter, setShowCreateFighter] = useState(false)
  const [newFighterName, setNewFighterName] = useState('')
  const [newFighterColor, setNewFighterColor] = useState('#00f0ff')
  const [gameMessage, setGameMessage] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [winner, setWinner] = useState<Fighter | null>(null)

  const challengeTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cargar luchadores
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fighters' },
        async () => {
          const { data } = await supabase
            .from('fighters')
            .select('*')
            .order('total_points', { ascending: false })
          if (data) setFighters(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Suscripción a partidas activas
  useEffect(() => {
    if (!selectedFighter) return

    const channel = supabase
      .channel('matches_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        async (payload) => {
          const match = payload.new as Match
          if (match.player1_id === selectedFighter || match.player2_id === selectedFighter) {
            setCurrentMatch(match)
            setIsPlaying(true)
            setWaitingForOpponent(false)
            startChallenge()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        async (payload) => {
          const match = payload.new as Match
          if (match.id === currentMatch?.id) {
            setCurrentMatch(match)
            if (match.status === 'finished') {
              const winnerFighter = fighters.find(f => f.id === match.winner_id)
              setWinner(winnerFighter || null)
              setShowResult(true)
              setIsPlaying(false)
              if (match.winner_id === selectedFighter && onWin) {
                onWin()
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moves' },
        async (payload) => {
          const move = payload.new as Move
          if (move.match_id === currentMatch?.id) {
            setMoveHistory(prev => [...prev, move])
            
            const fighter = fighters.find(f => f.id === move.player_id)
            if (fighter) {
              setGameMessage(
                move.type === 'correct'
                  ? `🥊 ¡${fighter.name} dio un golpe! (-${move.damage} HP)`
                  : move.type === 'wrong'
                  ? `💥 ¡${fighter.name} se lastimó! (-${move.damage} HP)`
                  : `⏰ ¡Tiempo agotado!`
              )
              setTimeout(() => setGameMessage(''), 2000)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedFighter, currentMatch, fighters, onWin])

  // Temporizador de desafío
  useEffect(() => {
    if (!isPlaying || !challenge) return

    setTimeLeft(15)
    if (challengeTimerRef.current) clearInterval(challengeTimerRef.current)

    challengeTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(challengeTimerRef.current!)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (challengeTimerRef.current) clearInterval(challengeTimerRef.current)
    }
  }, [challenge, isPlaying])

  // Generar desafío aleatorio
  const startChallenge = () => {
    const types = [
      { type: 'critical_point', label: 'Encuentra el punto crítico' },
      { type: 'domain', label: '¿Cuál es el dominio?' },
      { type: 'range', label: '¿Cuál es el rango?' },
      { type: 'derivative_x', label: '¿Cuál es ∂f/∂x?' },
      { type: 'derivative_y', label: '¿Cuál es ∂f/∂y?' },
      { type: 'hessian', label: '¿Cuál es el determinante Hessiano?' },
    ]

    const selected = types[Math.floor(Math.random() * types.length)]
    let question = ''
    let answer = ''

    switch (selected.type) {
      case 'critical_point':
        const pointTypes = ['máximo', 'mínimo', 'punto de silla']
        const pointType = pointTypes[Math.floor(Math.random() * pointTypes.length)]
        question = `🎯 Encuentra el ${pointType} en la superficie`
        answer = pointType
        break
      case 'domain':
        question = `📐 ¿Cuál es el dominio de esta función?`
        answer = 'dominio'
        break
      case 'range':
        question = `📊 ¿Cuál es el rango de esta función?`
        answer = 'rango'
        break
      case 'derivative_x':
        question = `📈 ¿Cuál es la derivada parcial con respecto a x?`
        answer = 'derivada x'
        break
      case 'derivative_y':
        question = `📈 ¿Cuál es la derivada parcial con respecto a y?`
        answer = 'derivada y'
        break
      case 'hessian':
        question = `🧮 ¿Cuál es el determinante Hessiano?`
        answer = 'hessiano'
        break
    }

    setChallenge({ question, answer })
  }

  // Manejar respuesta correcta
  const handleCorrect = async () => {
    if (!currentMatch || !selectedFighter) return

    const isPlayer1 = currentMatch.player1_id === selectedFighter
    const targetHp = isPlayer1 ? 'player2_hp' : 'player1_hp'
    const newHp = Math.max(0, (currentMatch[targetHp as keyof Match] as number) - DAMAGE_CORRECT)

    await supabase.from('moves').insert({
      match_id: currentMatch.id,
      player_id: selectedFighter,
      type: 'correct',
      damage: DAMAGE_CORRECT,
    })

    await supabase
      .from('matches')
      .update({ [targetHp]: newHp })
      .eq('id', currentMatch.id)

    if (newHp === 0) {
      await supabase
        .from('matches')
        .update({
          status: 'finished',
          winner_id: selectedFighter,
        })
        .eq('id', currentMatch.id)

      await supabase.rpc('update_fighter_stats', {
        fighter_id: selectedFighter,
        won: true,
      })

      if (onWin) onWin()
    }

    setTimeout(() => startChallenge(), 500)
  }

  // Manejar respuesta incorrecta
  const handleWrong = async () => {
    if (!currentMatch || !selectedFighter) return

    const isPlayer1 = currentMatch.player1_id === selectedFighter
    const currentHp = isPlayer1 ? 'player1_hp' : 'player2_hp'
    const newHp = Math.max(0, (currentMatch[currentHp as keyof Match] as number) - DAMAGE_WRONG)

    await supabase.from('moves').insert({
      match_id: currentMatch.id,
      player_id: selectedFighter,
      type: 'wrong',
      damage: DAMAGE_WRONG,
    })

    await supabase
      .from('matches')
      .update({ [currentHp]: newHp })
      .eq('id', currentMatch.id)

    if (newHp === 0) {
      const winnerId = isPlayer1 ? currentMatch.player2_id : currentMatch.player1_id
      await supabase
        .from('matches')
        .update({
          status: 'finished',
          winner_id: winnerId,
        })
        .eq('id', currentMatch.id)

      await supabase.rpc('update_fighter_stats', {
        fighter_id: winnerId,
        won: true,
      })

      if (winnerId === selectedFighter && onWin) onWin()
    }

    setTimeout(() => startChallenge(), 500)
  }

  // Manejar tiempo agotado
  const handleTimeout = async () => {
    if (!currentMatch) return

    await supabase.from('moves').insert({
      match_id: currentMatch.id,
      player_id: selectedFighter,
      type: 'timeout',
      damage: 0,
    })

    const newHp1 = Math.max(0, currentMatch.player1_hp - 2)
    const newHp2 = Math.max(0, currentMatch.player2_hp - 2)

    await supabase
      .from('matches')
      .update({
        player1_hp: newHp1,
        player2_hp: newHp2,
      })
      .eq('id', currentMatch.id)

    if (newHp1 === 0) {
      await supabase
        .from('matches')
        .update({
          status: 'finished',
          winner_id: currentMatch.player2_id,
        })
        .eq('id', currentMatch.id)
      
      if (currentMatch.player2_id === selectedFighter && onWin) onWin()
    } else if (newHp2 === 0) {
      await supabase
        .from('matches')
        .update({
          status: 'finished',
          winner_id: currentMatch.player1_id,
        })
        .eq('id', currentMatch.id)
      
      if (currentMatch.player1_id === selectedFighter && onWin) onWin()
    }

    setTimeout(() => startChallenge(), 500)
  }

  // Crear luchador
  const createFighter = async () => {
    if (!newFighterName.trim()) return

    const { data, error } = await supabase
      .from('fighters')
      .insert({
        name: newFighterName,
        color: newFighterColor,
      })
      .select()

    if (!error && data) {
      setFighters([...fighters, data[0]])
      setSelectedFighter(data[0].id)
      setNewFighterName('')
      setShowCreateFighter(false)
    }
  }

  // Buscar partida
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
      await supabase
        .from('matches')
        .update({
          player2_id: selectedFighter,
          status: 'fighting',
        })
        .eq('id', waitingMatch[0].id)

      setCurrentMatch(waitingMatch[0])
      setIsPlaying(true)
      setWaitingForOpponent(false)
      startChallenge()
    } else {
      const { data: newMatch } = await supabase
        .from('matches')
        .insert({
          player1_id: selectedFighter,
          status: 'waiting',
        })
        .select()

      if (newMatch) {
        setCurrentMatch(newMatch[0])
      }
    }
  }

  // Reiniciar partida
  const resetMatch = async () => {
    if (!currentMatch) return

    await supabase
      .from('matches')
      .delete()
      .eq('id', currentMatch.id)

    setCurrentMatch(null)
    setIsPlaying(false)
    setShowResult(false)
    setWinner(null)
    setMoveHistory([])
    setChallenge(null)
  }

  const renderHealthBar = (hp: number, maxHp: number = 100) => {
    const percentage = (hp / maxHp) * 100
    const color = percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
    
    return (
      <div className="w-full h-4 bg-black/30 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }

  const sortedFighters = [...fighters].sort((a, b) => b.total_points - a.total_points)

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
        <div className="flex items-center gap-2">
          {isPlaying && (
            <span className="text-xs text-cyan-400 animate-pulse">
              ⚔️ En combate
            </span>
          )}
        </div>
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
                    <div
                      className="size-4 rounded-full"
                      style={{ backgroundColor: fighter.color }}
                    />
                    <span className="font-medium text-foreground">{fighter.name}</span>
                    <span className="text-xs text-muted-foreground">
                      🏆 {fighter.total_points} pts
                    </span>
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
                      newFighterColor === color
                        ? 'border-white scale-110'
                        : 'border-transparent'
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
              <div
                className="size-4 rounded-full"
                style={{ backgroundColor: fighters.find(f => f.id === selectedFighter)?.color }}
              />
              <span className="font-medium text-foreground">
                {fighters.find(f => f.id === selectedFighter)?.name}
              </span>
              <span className="text-xs text-muted-foreground">
                🏆 {fighters.find(f => f.id === selectedFighter)?.total_points || 0} pts
              </span>
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
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: fighters.find(f => f.id === currentMatch?.player1_id)?.color }}
                />
                <span className="font-bold text-sm text-foreground">
                  {fighters.find(f => f.id === currentMatch?.player1_id)?.name || '?'}
                </span>
              </div>
              <div className="mt-2">
                {renderHealthBar(currentMatch?.player1_hp || 100)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ❤️ {currentMatch?.player1_hp || 100} HP
              </div>
            </div>

            <div className="text-center">
              <Swords className="size-8 text-yellow-400 mx-auto animate-pulse" />
              <div className="text-xs text-muted-foreground mt-1">⚔️ VS</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  {fighters.find(f => f.id === currentMatch?.player2_id)?.name || '?'}
                </span>
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: fighters.find(f => f.id === currentMatch?.player2_id)?.color }}
                />
              </div>
              <div className="mt-2">
                {renderHealthBar(currentMatch?.player2_hp || 100)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ❤️ {currentMatch?.player2_hp || 100} HP
              </div>
            </div>
          </div>

          {challenge && currentMatch && (
            <div className="glass-light rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-400">🎯 Desafío</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer size={12} />
                  {timeLeft}s
                </span>
              </div>
              <p className="text-sm text-foreground text-center font-medium">
                {challenge.question}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Función: {currentFunction}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCorrect}
                  className="flex-1 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-all font-bold text-sm"
                >
                  ✅ Correcto
                </button>
                <button
                  onClick={handleWrong}
                  className="flex-1 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all font-bold text-sm"
                >
                  ❌ Incorrecto
                </button>
              </div>
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
                    key={i}
                    className={`text-xs px-2 py-1 rounded ${
                      move.type === 'correct'
                        ? 'bg-green-500/20 text-green-400'
                        : move.type === 'wrong'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {move.type === 'correct' ? '🥊' : move.type === 'wrong' ? '💥' : '⏰'}
                    {move.damage > 0 && ` -${move.damage}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={resetMatch}
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
            <div
              className="size-12 rounded-full mx-auto my-4"
              style={{ backgroundColor: winner.color }}
            />
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
              <div
                key={fighter.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg glass"
              >
                <div className="flex items-center gap-2">
                  {index === 0 ? <Crown size={14} className="text-yellow-400" /> :
                   index === 1 ? <Medal size={14} className="text-slate-400" /> :
                   index === 2 ? <Medal size={14} className="text-amber-600" /> :
                   <span className="w-4 text-center text-muted-foreground">{index + 1}</span>}
                  <div
                    className="size-2 rounded-full"
                    style={{ backgroundColor: fighter.color }}
                  />
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