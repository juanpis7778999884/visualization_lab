'use client'

import { useEffect, useState } from 'react'
import { Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { roundLabel, type TournamentGroup, type TournamentMatch } from '@/lib/tournament'

export function TournamentBracketView({ champion }: { champion: TournamentGroup | null }) {
  const [groups, setGroups] = useState<Record<string, TournamentGroup>>({})
  const [matches, setMatches] = useState<TournamentMatch[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: g } = await supabase.from('tournament_groups').select('id,name,color')
      if (g) setGroups(Object.fromEntries(g.map((item: TournamentGroup) => [item.id, item])))
      const { data: m } = await supabase.from('tournament_matches').select('*').order('round').order('slot')
      if (m) setMatches(m as TournamentMatch[])
    }
    load()
    const channel = supabase
      .channel('tournament_bracket_view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_groups' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (matches.length === 0) return null
  const totalRounds = Math.max(...matches.map(m => m.round))
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1)
  const name = (id: string | null) => id ? (groups[id]?.name ?? '???') : '—'
  const color = (id: string | null) => id ? (groups[id]?.color ?? '#888') : '#555'

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card p-4">
      <div className="flex gap-6" style={{ minWidth: totalRounds * 200 }}>
        {rounds.map(round => (
          <div key={round} className="flex flex-1 flex-col justify-around gap-3">
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-primary">{roundLabel(round, totalRounds)}</p>
            {matches.filter(m => m.round === round).sort((a, b) => a.slot - b.slot).map(m => (
              <div key={m.id} className={`rounded-xl border p-2.5 text-xs ${m.status === 'finished' ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'}`}>
                <div className="flex items-center justify-between gap-2" style={{ color: color(m.group1_id) }}>
                  <span className={m.winner_id === m.group1_id ? 'font-semibold' : ''}>{name(m.group1_id)}</span>
                  {m.status !== 'pending' && m.status !== 'bye' && <span className="font-mono text-[10px] text-muted-foreground">{m.group1_hp}HP</span>}
                </div>
                <div className="my-1 h-px bg-border" />
                <div className="flex items-center justify-between gap-2" style={{ color: color(m.group2_id) }}>
                  <span className={m.winner_id === m.group2_id ? 'font-semibold' : ''}>{m.status === 'bye' ? 'BYE (pase directo)' : name(m.group2_id)}</span>
                  {m.status !== 'pending' && m.status !== 'bye' && <span className="font-mono text-[10px] text-muted-foreground">{m.group2_hp}HP</span>}
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="flex flex-col items-center justify-center gap-2 px-4">
          <Crown className={`size-8 ${champion ? 'text-amber-400' : 'text-muted-foreground/40'}`} />
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Campeón</p>
          <p className="text-sm font-semibold" style={{ color: champion?.color }}>{champion?.name ?? '???'}</p>
        </div>
      </div>
    </div>
  )
}
