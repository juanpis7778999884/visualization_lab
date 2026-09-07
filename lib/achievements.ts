export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-click', name: 'Primer contacto', description: 'Haz clic en la superficie', icon: '👆', unlocked: false },
  { id: 'max-finder', name: 'Buscador de cimas', description: 'Encuentra un máximo local', icon: '🏔️', unlocked: false },
  { id: 'min-finder', name: 'Buscador de valles', description: 'Encuentra un mínimo local', icon: '🕳️', unlocked: false },
  { id: 'saddle-finder', name: 'Jinete de silla', description: 'Encuentra un punto de silla', icon: '🐴', unlocked: false },
  { id: 'explorer', name: 'Explorador', description: 'Visita 10 puntos diferentes', icon: '🧭', unlocked: false },
  { id: 'earthquake', name: 'Terremoto', description: 'Activa el modo terremoto', icon: '🌊', unlocked: false },
  { id: 'time-traveler', name: 'Viajero del tiempo', description: 'Activa el modo tiempo', icon: '⏳', unlocked: false },
]

export function getAchievements(): Achievement[] {
  return ACHIEVEMENTS
}