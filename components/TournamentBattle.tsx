'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, X, Skull, Hourglass } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { DAMAGE_CORRECT, DAMAGE_WRONG, randomChallenge, type TournamentGroup, type TournamentMatch } from '@/lib/tournament'

export function TournamentBattle() {
  const [groups, setGroups] = useState<TournamentGroup[]>([])
  const [matches, setMatches] = useState<TournamentMatch[]>([])
  const [groupId, setGroupId] = useState<string | null>(null)
  const [buzzResult, setBuzzResult] = useState<'won' | 'lost' | null>(null)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('tournament-group-id') : null
    if (saved) setGroupId(saved)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: g } = await supabase.from('tournament_groups').select('id,name,color')
      if (g) setGroups(g)
      const { data: m } = await supabase.from('tournament_matches').select('*')
      if (m) setMatches(m as TournamentMatch[])
    }
    load()
    const channel = supabase
      .channel('tournament_battle')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tournament_moves' }, (payload: any) => {
        const move = payload.new
        const g = groups.find(item => item.id === move.group_id)
        setFlash(move.type === 'correct' ? `🥊 ¡${g?.name ?? 'Alguien'} dio un golpe! (-${move.damage} HP)` : `💥 ¡${g?.name ?? 'Alguien'} falló y se lastimó! (-${move.damage} HP)`)
        setTimeout(() => setFlash(''), 1800)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chooseGroup = (id: string) => {
    setGroupId(id)
    if (typeof window !== 'undefined') localStorage.setItem('tournament-group-id', id)
  }

  const myMatch = useMemo(() => {
    if (!groupId) return null
    return matches.find(m => (m.group1_id === groupId || m.group2_id === groupId) && (m.status === 'ready' || m.status === 'fighting')) || null
  }, [matches, groupId])

  // Si el match está "ready" y todavía no tiene pregunta, alguno de los dos
  // dispositivos la genera. El WHERE status='ready' evita que ambos lo hagan
  // a la vez: solo la primera actualización realmente cambia la fila.
  useEffect(() => {
    if (!myMatch || myMatch.status !== 'ready') return
    const activate = async () => {
      await supabase.from('tournament_matches')
        .update({ status: 'fighting', buzzer_question: randomChallenge(), buzzer_holder_id: null })
        .eq('id', myMatch.id).eq('status', 'ready')
    }
    activate()
  }, [myMatch?.id, myMatch?.status])

  const groupById = (id: string | null) => (id ? groups.find(g => g.id === id) : null)

  const buzz = async () => {
    if (!myMatch || !groupId) return
    const { data } = await supabase.from('tournament_matches')
      .update({ buzzer_holder_id: groupId })
      .eq('id', myMatch.id).is('buzzer_holder_id', null)
      .select('id')
    setBuzzResult(data && data.length > 0 ? 'won' : 'lost')
    setTimeout(() => setBuzzResult(null), 1200)
  }

  const isPlayer1 = myMatch?.group1_id === groupId
  const nextQuestionOrFinish = async (match: TournamentMatch, correctGroupId: string, wrongGroupId: string, ko: boolean) => {
    if (!ko) {
      await supabase.from('tournament_matches').update({ buzzer_holder_id: null, buzzer_question: randomChallenge() }).eq('id', match.id)
      return
    }
    await supabase.from('tournament_matches').update({ status: 'finished', winner_id: correctGroupId, buzzer_holder_id: null }).eq('id', match.id)
    if (match.next_match_id && match.next_match_slot) {
      const field = match.next_match_slot === 1 ? 'group1_id' : 'group2_id'
      const { data: nextRow } = await supabase.from('tournament_matches').update({ [field]: correctGroupId }).eq('id', match.next_match_id).select('group1_id,group2_id').single()
      if (nextRow?.group1_id && nextRow?.group2_id) {
        await supabase.from('tournament_matches').update({ status: 'ready' }).eq('id', match.next_match_id)
      }
    } else {
      await supabase.from('tournament_state').update({ champion_id: correctGroupId }).eq('id', 1)
    }
  }

  const answer = async (correct: boolean) => {
    if (!myMatch || !groupId || myMatch.buzzer_holder_id !== groupId) return
    const opponentId = isPlayer1 ? myMatch.group2_id : myMatch.group1_id
    if (!opponentId) return

    if (correct) {
      const hpField = isPlayer1 ? 'group2_hp' : 'group1_hp'
      const newHp = Math.max(0, (isPlayer1 ? myMatch.group2_hp : myMatch.group1_hp) - DAMAGE_CORRECT)
      await supabase.from('tournament_moves').insert({ match_id: myMatch.id, group_id: groupId, type: 'correct', damage: DAMAGE_CORRECT })
      await supabase.from('tournament_matches').update({ [hpField]: newHp }).eq('id', myMatch.id)
      await nextQuestionOrFinish(myMatch, groupId, opponentId, newHp === 0)
    } else {
      const hpField = isPlayer1 ? 'group1_hp' : 'group2_hp'
      const newHp = Math.max(0, (isPlayer1 ? myMatch.group1_hp : myMatch.group2_hp) - DAMAGE_WRONG)
      await supabase.from('tournament_moves').insert({ match_id: myMatch.id, group_id: groupId, type: 'wrong', damage: DAMAGE_WRONG })
      await supabase.from('tournament_matches').update({ [hpField]: newHp }).eq('id', myMatch.id)
      await nextQuestionOrFinish(myMatch, opponentId, groupId, newHp === 0)
    }
  }

  if (!groupId) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-card p-4">
        <p className="text-xs text-muted-foreground">Selecciona a qué grupo representas en este dispositivo:</p>
        <div className="flex flex-wrap gap-2">
          {groups.map(g => (
            <button key={g.id} onClick={() => chooseGroup(g.id)} className="rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: g.color, color: g.color }}>{g.name}</button>
          ))}
          {groups.length === 0 && <p className="text-xs text-muted-foreground">El profesor todavía no ha creado grupos.</p>}
        </div>
      </div>
    )
  }

  const myGroup = groupById(groupId)

  if (!myMatch) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-center">
        <Hourglass className="size-6 text-muted-foreground" />
        <p className="text-sm font-semibold" style={{ color: myGroup?.color }}>{myGroup?.name}</p>
        <p className="text-xs text-muted-foreground">Esperando tu turno en la llave. La pantalla se actualiza sola cuando te toque pelear.</p>
      </div>
    )
  }

  const p1 = groupById(myMatch.group1_id)
  const p2 = groupById(myMatch.group2_id)
  const iHaveBuzzer = myMatch.buzzer_holder_id === groupId
  const someoneHasBuzzer = !!myMatch.buzzer_holder_id

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-card p-4">
      <AnimatePresence>{flash && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center text-xs font-semibold text-primary">{flash}</motion.p>}</AnimatePresence>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-semibold" style={{ color: p1?.color }}>{p1?.name}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${myMatch.group1_hp}%` }} /></div>
        </div>
        <div className="text-right">
          <p className="font-semibold" style={{ color: p2?.color }}>{p2?.name}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"><div className="ml-auto h-full bg-destructive transition-all" style={{ width: `${myMatch.group2_hp}%` }} /></div>
        </div>
      </div>

      <div className="rounded-xl bg-secondary/50 p-3 text-center text-sm">{myMatch.buzzer_question || 'Preparando la pregunta...'}</div>

      {!someoneHasBuzzer && (
        <motion.button whileTap={{ scale: 0.92 }} onClick={buzz} className="flex items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground">
          <Bell className="size-5" /> ¡TOCA AQUÍ PRIMERO!
        </motion.button>
      )}
      {buzzResult === 'lost' && <p className="text-center text-xs text-destructive">Te ganaron por milisegundos, espera la próxima.</p>}

      {iHaveBuzzer && (
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs font-semibold text-primary">¡Tienes la palabra! ¿Respondiste bien?</p>
          <div className="flex gap-2">
            <button onClick={() => answer(true)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground"><Check className="size-4" /> Respondí bien</button>
            <button onClick={() => answer(false)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-destructive/50 py-2.5 text-xs text-destructive"><X className="size-4" /> Me equivoqué</button>
          </div>
        </div>
      )}
      {someoneHasBuzzer && !iHaveBuzzer && (
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><Skull className="size-3.5" /> El otro grupo tiene la palabra, espera...</p>
      )}
    </div>
  )
}
