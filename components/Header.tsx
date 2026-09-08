'use client'

import { motion } from 'framer-motion'
import { Zap, SkipForward } from 'lucide-react'

interface HeaderProps {
  isPresentationMode: boolean
  onPresentationModeChange: (mode: boolean) => void
  onSkipTutorial?: () => void
}

export function Header({ isPresentationMode, onPresentationModeChange, onSkipTutorial }: HeaderProps) {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-lg">
            <Zap className="text-black" size={24} />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Mathematical <span className="text-cyan-400">Visualization Lab</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {onSkipTutorial && (
            <motion.button
              onClick={onSkipTutorial}
              className="px-3 py-2 rounded-lg text-xs font-medium glass text-muted-foreground hover:text-cyan-400 hover:bg-white/10 transition-all flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SkipForward size={14} />
              Omitir Tutorial
            </motion.button>
          )}

          <motion.button
            onClick={() => onPresentationModeChange(!isPresentationMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isPresentationMode
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-black'
                : 'glass text-cyan-400 hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPresentationMode ? '✓ Presentation' : 'Presentation Mode'}
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}