'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface LevelSliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
}

export function LevelSlider({ min, max, value, onChange }: LevelSliderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <motion.div
      className="glass rounded-2xl p-6 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Contour Level</h2>
        <span className="text-xs text-cyan-400 font-mono">{value.toFixed(2)}</span>
      </div>

      <div className="space-y-3">
        <div className="relative h-12 bg-black/30 rounded-lg overflow-hidden border border-cyan-400/20">
          {/* Background fill - gradiente térmico */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-400 via-yellow-400 to-red-500 opacity-30"
            style={{ width: `${percentage}%` }}
          />

          {/* Slider input */}
          <input
            type="range"
            min={min}
            max={max}
            step={(max - min) / 100}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            className="absolute inset-0 w-full cursor-pointer opacity-0 z-10"
          />

          {/* Thumb */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-10 bg-gradient-to-r from-cyan-400 to-violet-500 rounded shadow-lg shadow-cyan-400/50 pointer-events-none"
            style={{ left: `${percentage}%`, x: '-50%' }}
            animate={{
              boxShadow: isDragging
                ? '0 0 30px rgba(0, 240, 255, 0.9)'
                : '0 0 15px rgba(0, 240, 255, 0.5)',
              scale: isDragging ? 1.1 : 1,
            }}
          />
        </div>

        {/* Range display */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{min.toFixed(1)}</span>
          <span>{max.toFixed(1)}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Adjusts the cutting plane through the surface to visualize cross-sections
      </p>
    </motion.div>
  )
}