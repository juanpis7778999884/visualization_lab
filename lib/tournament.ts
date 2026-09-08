export interface TournamentGroup {
  id: string
  name: string
  color: string
}

export type MatchStatus = 'pending' | 'bye' | 'ready' | 'fighting' | 'finished'

export interface TournamentMatch {
  id: string
  round: number
  slot: number
  group1_id: string | null
  group2_id: string | null
  group1_hp: number
  group2_hp: number
  status: MatchStatus
  winner_id: string | null
  buzzer_holder_id: string | null
  buzzer_question: string | null
  next_match_id: string | null
  next_match_slot: number | null
}

export interface MatchDraft {
  round: number
  slot: number
  group1_id: string | null
  group2_id: string | null
  status: MatchStatus
  winner_id: string | null
}

export const DAMAGE_CORRECT = 15
export const DAMAGE_WRONG = 5
export const STARTING_HP = 100

// Construye TODAS las rondas de la llave a partir de una lista de grupos de
// cualquier tamaño (no necesita ser potencia de 2). Si sobran cupos, los
// grupos con menor suerte en el sorteo reciben un "bye" (pase directo) en la
// ronda 1, garantizando que nunca haya dos byes emparejados entre sí.
export function buildBracket(groups: TournamentGroup[]): MatchDraft[] {
  const n = groups.length
  if (n < 2) return []

  const size = Math.pow(2, Math.ceil(Math.log2(n)))
  const totalRounds = Math.log2(size)
  const byes = size - n
  const matchesInRound1 = size / 2

  // Sorteo: el orden de inscripción no debe determinar quién se enfrenta a quién.
  const shuffled = [...groups].sort(() => Math.random() - 0.5)

  const drafts: MatchDraft[] = []

  // Ronda 1: primero los `byes` emparejamientos de "un grupo real + hueco vacío"
  // (avanzan solos), luego el resto emparejado de a dos.
  let cursor = 0
  for (let slot = 0; slot < matchesInRound1; slot++) {
    if (slot < byes) {
      const g = shuffled[cursor++]
      drafts.push({ round: 1, slot, group1_id: g.id, group2_id: null, status: 'bye', winner_id: g.id })
    } else {
      const g1 = shuffled[cursor++]
      const g2 = shuffled[cursor++]
      drafts.push({ round: 1, slot, group1_id: g1.id, group2_id: g2.id, status: 'ready', winner_id: null })
    }
  }

  // Rondas siguientes: vacías, se llenan solas cuando se resuelven las anteriores.
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = size / Math.pow(2, round)
    for (let slot = 0; slot < matchesInRound; slot++) {
      drafts.push({ round, slot, group1_id: null, group2_id: null, status: 'pending', winner_id: null })
    }
  }

  return drafts
}

export function totalRoundsFor(groupCount: number): number {
  if (groupCount < 2) return 0
  const size = Math.pow(2, Math.ceil(Math.log2(groupCount)))
  return Math.log2(size)
}

// Nombre humano de la ronda: las últimas 3 siempre son Cuartos/Semifinal/Final,
// las que sobren hacia atrás (torneos grandes) se numeran.
export function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round
  if (fromEnd === 0) return 'Final'
  if (fromEnd === 1) return 'Semifinal'
  if (fromEnd === 2) return 'Cuartos de final'
  return `Ronda ${round}`
}

const CHALLENGE_TYPES = [
  { type: 'domain', label: '📐 ¿Cuál es el dominio de esta función?' },
  { type: 'range', label: '📊 ¿Cuál es el rango de esta función?' },
  { type: 'critical_point', label: '🎯 Encuentra un punto crítico (máx, mín o silla) en la superficie' },
  { type: 'derivative_x', label: '📈 ¿Cuál es la derivada parcial con respecto a x?' },
  { type: 'derivative_y', label: '📈 ¿Cuál es la derivada parcial con respecto a y?' },
  { type: 'hessian', label: '🧮 ¿Cuál es el determinante Hessiano en este punto?' },
] as const

export function randomChallenge(): string {
  const pick = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)]
  return pick.label
}
