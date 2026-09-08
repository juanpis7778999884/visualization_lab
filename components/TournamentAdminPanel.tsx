'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Swords, RotateCcw, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { buildBracket, type TournamentGroup } from '@/lib/tournament'

const COLORS = ['#00f0ff', '#7c3aed', '#ec4899', '#fbbf24', '#10b981', '#fb7185', '#f97316', '#38bdf8']

export function TournamentAdminPanel({ isActive, onGenerated }: { isActive: boolean; onGenerated: () => void }) {
  const [groups, setGroups] = useState<TournamentGroup[]>([])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('tournament_groups').select('id,name,color').order('created_at')
      if (data) setGroups(data)
    }
    load()
    const channel = supabase
      .channel('tournament_groups_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_groups' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const addGroup = async () => {
    if (!name.trim() || isActive) return
    const color = COLORS[groups.length % COLORS.length]
    await supabase.from('tournament_groups').insert({ name: name.trim(), color })
    setName('')
  }

  const removeGroup = async (id: string) => {
    if (isActive) return
    await supabase.from('tournament_groups').delete().eq('id', id)
  }

  // Genera toda la llave: inserta los enfrentamientos, los conecta entre rondas
  // (next_match_id / next_match_slot) y propaga de una vez los "byes" (pases
  // directos) de la ronda 1 hacia la ronda 2.
  const startTournament = async () => {
    if (groups.length < 2) { setError('Necesitas al menos 2 grupos.'); return }
    setBusy(true)
    setError('')
    try {
      const drafts = buildBracket(groups)
      const { data: inserted, error: insertError } = await supabase
        .from('tournament_matches')
        .insert(drafts.map(d => ({
          round: d.round, slot: d.slot, group1_id: d.group1_id, group2_id: d.group2_id,
          status: d.status, winner_id: d.winner_id,
          group1_hp: 100, group2_hp: 100,
        })))
        .select('id,round,slot,status,winner_id')
      if (insertError || !inserted) { setError(insertError?.message || 'No se pudo crear la llave.'); setBusy(false); return }

      const totalRounds = Math.max(...inserted.map(m => m.round))
      const byRoundSlot = new Map<string, { id: string; status: string; winner_id: string | null }>()
      inserted.forEach(m => byRoundSlot.set(`${m.round}-${m.slot}`, m))

      // Conecta cada match con el de la siguiente ronda al que alimenta.
      for (const m of inserted) {
        if (m.round >= totalRounds) continue
        const nextSlot = Math.floor(m.slot / 2)
        const nextSide = m.slot % 2 === 0 ? 1 : 2
        const next = byRoundSlot.get(`${m.round + 1}-${nextSlot}`)
        if (!next) continue
        await supabase.from('tournament_matches').update({ next_match_id: next.id, next_match_slot: nextSide }).eq('id', m.id)
      }

      // Propaga los byes de la ronda 1 hacia la ronda 2 de inmediato.
      for (const m of inserted) {
        if (m.status !== 'bye' || !m.winner_id) continue
        const nextSlot = Math.floor(m.slot / 2)
        const next = byRoundSlot.get(`2-${nextSlot}`)
        if (!next) continue
        const field = m.slot % 2 === 0 ? 'group1_id' : 'group2_id'
        const { data: nextRow } = await supabase.from('tournament_matches').update({ [field]: m.winner_id }).eq('id', next.id).select('group1_id,group2_id').single()
        if (nextRow?.group1_id && nextRow?.group2_id) {
          await supabase.from('tournament_matches').update({ status: 'ready' }).eq('id', next.id)
        }
      }

      await supabase.from('tournament_state').update({ is_active: true, champion_id: null }).eq('id', 1)
      onGenerated()
    } finally {
      setBusy(false)
    }
  }

  const resetTournament = async () => {
    setBusy(true)
    await supabase.from('tournament_moves').delete().neq('match_id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('tournament_matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('tournament_state').update({ is_active: false, champion_id: null }).eq('id', 1)
    setBusy(false)
    onGenerated()
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-card p-4">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Grupos inscritos ({groups.length})</h3>
      </div>

      {!isActive && (
        <form onSubmit={e => { e.preventDefault(); addGroup() }} className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del grupo" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary" />
          <button type="submit" className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" /> Agregar</button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {groups.map(g => (
          <span key={g.id} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: g.color, color: g.color }}>
            {g.name}
            {!isActive && <button onClick={() => removeGroup(g.id)} aria-label={`Quitar ${g.name}`}><Trash2 className="size-3" /></button>}
          </span>
        ))}
        {groups.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay grupos. Agrega mínimo 2 para armar la llave.</p>}
      </div>

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      <div className="flex gap-2">
        {!isActive ? (
          <button disabled={busy || groups.length < 2} onClick={startTournament} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
            <Swords className="size-3.5" /> {busy ? 'Generando llave...' : 'Iniciar torneo'}
          </button>
        ) : (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-primary">Torneo en curso · la llave está abajo</motion.p>
        )}
        <button disabled={busy} onClick={resetTournament} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground hover:border-destructive/60 hover:text-destructive">
          <RotateCcw className="size-3.5" /> Reiniciar torneo
        </button>
      </div>
    </div>
  )
}
