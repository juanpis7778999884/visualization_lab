'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface InteractivePointProps {
  point: { x: number; y: number; z: number } | null
  onDismiss: () => void
}

export function InteractivePoint({ point, onDismiss }: InteractivePointProps) {
  if (!point) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass rounded-xl px-6 py-4 flex items-center gap-6 shadow-2xl shadow-cyan-400/20 border border-cyan-400/30">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Selected Point</div>
            <div className="font-mono text-sm text-foreground">
              ({point.x.toFixed(2)}, {point.y.toFixed(2)}, {point.z.toFixed(2)})
            </div>
          </div>

          <motion.button
            onClick={onDismiss}
            className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={18} className="text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* 🔥 MEJORADO: Animated particle burst effect */}
      {point && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2
            const radius = 80 + Math.random() * 60
            const color = ['#00f0ff', '#7c3aed', '#ec4899', '#fbbf24'][i % 4]
            return (
              <motion.div
                key={i}
                className="fixed w-2 h-2 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}`,
                }}
                animate={{
                  x: Math.cos(angle) * radius,
                  y: Math.sin(angle) * radius,
                  opacity: [1, 0],
                  scale: [1, 0],
                }}
                transition={{
                  duration: 1.2 + Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            )
          })}
        </div>
      )}
    </AnimatePresence>
  )
}