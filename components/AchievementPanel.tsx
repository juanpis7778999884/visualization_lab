'use client'

import { motion } from 'framer-motion'
import { Award, Check, Lock } from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

interface AchievementPanelProps {
  achievements: Achievement[]
}

export function AchievementPanel({ achievements }: AchievementPanelProps) {
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <motion.div
      className="glass rounded-2xl p-4 space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
          <Award size={16} />
          LOGROS
        </h3>
        <span className="text-xs text-muted-foreground">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {achievements.map((ach) => (
          <motion.div
            key={ach.id}
            className={`p-2 rounded-lg text-center transition-all ${
              ach.unlocked
                ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30'
                : 'glass opacity-50'
            }`}
            whileHover={ach.unlocked ? { scale: 1.05 } : {}}
          >
            <div className="text-2xl">{ach.icon}</div>
            <p className="text-[10px] font-semibold mt-1">{ach.name}</p>
            {ach.unlocked ? (
              <Check size={12} className="mx-auto text-green-400 mt-1" />
            ) : (
              <Lock size={12} className="mx-auto text-muted-foreground mt-1" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}