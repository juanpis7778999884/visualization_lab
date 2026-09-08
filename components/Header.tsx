'use client'

import { motion } from 'framer-motion'
import { Zap, SkipForward, Menu, X, Swords, Trophy } from 'lucide-react'

interface HeaderProps {
  isPresentationMode: boolean
  onPresentationModeChange: (mode: boolean) => void
  onSkipTutorial?: () => void
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
  onOpenFighter?: () => void
  isFighterOpen?: boolean
  onOpenTournament?: () => void
  isTournamentOpen?: boolean
}

export function Header({ 
  isPresentationMode, 
  onPresentationModeChange, 
  onSkipTutorial,
  onMenuToggle,
  isMobileMenuOpen = false,
  onOpenFighter,
  isFighterOpen = false,
  onOpenTournament,
  isTournamentOpen = false
}: HeaderProps) {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-lg">
            <Zap className="text-black size-4 md:size-6" />
          </div>
          <h1 className="text-sm md:text-xl font-bold text-foreground">
            Math <span className="text-cyan-400 hidden sm:inline">Visualization</span>
            <span className="text-cyan-400 sm:hidden">Lab</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* 🔥 BOTÓN MATH FIGHTER - SIEMPRE VISIBLE */}
          <motion.button
            onClick={onOpenFighter}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all flex items-center gap-1 md:gap-2 ${
              isFighterOpen
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                : 'glass text-yellow-400 hover:bg-white/10 border border-yellow-400/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Swords size={16} className="md:size-[18px]" />
            <span className="hidden sm:inline">⚔️ Math Fighter</span>
            <span className="sm:hidden">Fighter</span>
          </motion.button>

          {/* 🏆 BOTÓN TORNEO POR GRUPOS */}
          {onOpenTournament && (
            <motion.button
              onClick={onOpenTournament}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all flex items-center gap-1 md:gap-2 ${
                isTournamentOpen
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30'
                  : 'glass text-amber-400 hover:bg-white/10 border border-amber-400/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trophy size={16} className="md:size-[18px]" />
              <span className="hidden sm:inline">🏆 Torneo</span>
              <span className="sm:hidden">Torneo</span>
            </motion.button>
          )}

          {/* Menú Hamburguesa - SOLO MÓVIL */}
          {onMenuToggle && (
            <motion.button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg glass text-cyan-400 hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          )}

          {/* Omitir Tutorial */}
          {onSkipTutorial && (
            <motion.button
              onClick={onSkipTutorial}
              className="hidden sm:flex px-3 py-1.5 md:px-3 md:py-2 rounded-lg text-[10px] md:text-xs font-medium glass text-muted-foreground hover:text-cyan-400 hover:bg-white/10 transition-all items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SkipForward size={14} />
              <span className="hidden md:inline">Omitir Tutorial</span>
              <span className="md:hidden">Saltar</span>
            </motion.button>
          )}

          {/* Presentation Mode */}
          <motion.button
            onClick={() => onPresentationModeChange(!isPresentationMode)}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-all ${
              isPresentationMode
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-black'
                : 'glass text-cyan-400 hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="hidden sm:inline">
              {isPresentationMode ? '✓ Presentation' : 'Presentation Mode'}
            </span>
            <span className="sm:hidden">
              {isPresentationMode ? '✓' : '🔲'}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}