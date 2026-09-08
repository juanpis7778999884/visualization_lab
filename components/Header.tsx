'use client'

import { motion } from 'framer-motion'
import { Zap, SkipForward, Menu, X } from 'lucide-react'

interface HeaderProps {
  isPresentationMode: boolean
  onPresentationModeChange: (mode: boolean) => void
  onSkipTutorial?: () => void
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export function Header({ 
  isPresentationMode, 
  onPresentationModeChange, 
  onSkipTutorial,
  onMenuToggle,
  isMobileMenuOpen = false
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
          {/* Botón Menú Hamburguesa - SOLO MÓVIL */}
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

          {/* Omitir Tutorial - oculto en móvil */}
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