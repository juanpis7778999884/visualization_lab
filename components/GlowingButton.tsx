'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlowingButtonProps {
  onClick: () => void
  children: ReactNode
  active?: boolean
  color?: 'cyan' | 'violet' | 'pink' | 'yellow'
  className?: string
}

const colorMap = {
  cyan: 'border-cyan-400/50 text-cyan-400 hover:shadow-cyan-400/30',
  violet: 'border-violet-400/50 text-violet-400 hover:shadow-violet-400/30',
  pink: 'border-pink-400/50 text-pink-400 hover:shadow-pink-400/30',
  yellow: 'border-yellow-400/50 text-yellow-400 hover:shadow-yellow-400/30',
}

export function GlowingButton({ 
  onClick, 
  children, 
  active, 
  color = 'cyan', 
  className = '' 
}: GlowingButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border bg-black/30 backdrop-blur text-sm font-medium transition-all ${colorMap[color]} ${
        active ? 'shadow-lg shadow-cyan-400/50 border-cyan-400 bg-cyan-400/20' : ''
      } ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  )
}