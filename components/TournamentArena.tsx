'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { TournamentAdminPanel } from './TournamentAdminPanel'
import { TournamentBracketView } from './TournamentBracketView'
import { TournamentBattle } from './TournamentBattle'
import type { TournamentGroup, TournamentMatch } from '@/lib/tournament'

export function TournamentArena({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState<'group' | 'teacher'>('group')
  const [isActive, setIsActive] = useState(false)
  const [champion, setChampion] = useState<TournamentGroup | null>(null)
  const [podium, setPodium] = useState<{ second: TournamentGroup | null; thirds: TournamentGroup[] }>({ second: null, thirds: [] })

  const refreshState = async () => {
    const { data: state } = await supabase.from('tournament_state').select('is_active,champion_id').eq('id', 1).maybeSingle()
    setIsActive(!!state?.is_active)
    if (!state?.champion_id) { setChampion(null); return }

    const { data: groups } = await supabase.from('tournament_groups').select('id,name,color')
    const { data: matches } = await supabase.from('tournament_matches').select('*')
    if (!groups || !matches) return
    const byId = Object.fromEntries(groups.map((g: TournamentGroup) => [g.id, g]))
    setChampion(byId[state.champion_id] || null)

    const totalRounds = Math.max(...matches.map((m: TournamentMatch) => m.round))
    const final = matches.find((m: TournamentMatch) => m.round === totalRounds)
    const semis = matches.filter((m: TournamentMatch) => m.round === totalRounds - 1)
    const secondId = final ? (final.winner_id === final.group1_id ? final.group2_id : final.group1_id) : null
    const thirdIds = semis.map((m: TournamentMatch) => (m.winner_id ? (m.winner_id === m.group1_id ? m.group2_id : m.group1_id) : null)).filter(Boolean) as string[]
    setPodium({ second: secondId ? byId[secondId] || null : null, thirds: thirdIds.map(id => byId[id]).filter(Boolean) })
  }

  useEffect(() => {
    refreshState()
    const channel = supabase
      .channel('tournament_arena_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_state' }, refreshState)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches' }, refreshState)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-background/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary"><Trophy className="size-5" /><h2 className="text-lg font-bold">Torneo MathFighter</h2></div>
        <button onClick={onClose} aria-label="Cerrar torneo" className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="size-5" /></button>
      </div>

      <div className="flex w-fit rounded-lg border border-border bg-card p-1">
        <button onClick={() => setRole('group')} className={`rounded-md px-3 py-1.5 text-xs ${role === 'group' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Mi grupo</button>
        <button onClick={() => setRole('teacher')} className={`rounded-md px-3 py-1.5 text-xs ${role === 'teacher' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Profesor</button>
      </div>

      {champion && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/5 p-6 text-center">
          <Trophy className="size-10 text-amber-400" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">¡Tenemos campeón!</p>
          <p className="text-2xl font-bold" style={{ color: champion.color }}>{champion.name}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            {podium.second && <span className="flex items-center gap-1"><Medal className="size-3.5 text-slate-300" /> 2º: {podium.second.name}</span>}
            {podium.thirds.map(g => <span key={g.id} className="flex items-center gap-1"><Medal className="size-3.5 text-amber-700" /> 3º: {g.name}</span>)}
          </div>
        </div>
      )}

      {role === 'teacher' ? <TournamentAdminPanel isActive={isActive} onGenerated={refreshState} /> : <TournamentBattle />}
      {isActive && <TournamentBracketView champion={champion} />}
    </motion.div>
  )
}
