'use client'

import { motion } from 'framer-motion'
import { calculateDomainRange, getPartialDerivativeX, getPartialDerivativeY } from '@/lib/math-utils'
import type { MathFunction } from '@/lib/types'
import { useMemo } from 'react'

interface InfoPanelProps {
  func: MathFunction
  selectedPoint?: { x: number; y: number; z: number } | null
  range: { min: number; max: number; domainRestrictions: string[] }
}

export function InfoPanel({ func, selectedPoint, range }: InfoPanelProps) {
  const partialX = useMemo(() => {
    if (!selectedPoint) return null
    return getPartialDerivativeX(func.expression, selectedPoint.x, selectedPoint.y)
  }, [func, selectedPoint])

  const partialY = useMemo(() => {
    if (!selectedPoint) return null
    return getPartialDerivativeY(func.expression, selectedPoint.x, selectedPoint.y)
  }, [func, selectedPoint])

  return (
    <motion.div
      className="glass rounded-2xl p-6 space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="text-lg font-semibold text-foreground">Information</h2>

      {/* Function Expression */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-cyan-400 uppercase tracking-wide">Expression</div>
        <div className="text-sm text-foreground font-mono bg-black/30 p-3 rounded-lg break-all">
          z = {func.expression}
        </div>
      </div>

      {/* Domain */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-cyan-400 uppercase tracking-wide">Domain</div>
        <div className="text-sm text-foreground space-y-1">
          <div>
            x: [{func.domain.xMin.toFixed(1)}, {func.domain.xMax.toFixed(1)}]
          </div>
          <div>
            y: [{func.domain.yMin.toFixed(1)}, {func.domain.yMax.toFixed(1)}]
          </div>
          {range.domainRestrictions.length > 0 && (
            <div className="mt-2 text-xs text-yellow-400 space-y-1">
              {range.domainRestrictions.map((r, i) => (
                <div key={i} className="bg-yellow-500/10 p-1.5 rounded">⚠️ {r}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Range */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-cyan-400 uppercase tracking-wide">Range</div>
        <div className="text-sm text-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span>z: [{range.min.toFixed(2)}, {range.max.toFixed(2)}]</span>
            <span className="text-xs text-muted-foreground">({(range.max - range.min).toFixed(2)} amplitude)</span>
          </div>
        </div>
      </div>

      {/* Selected Point Info */}
      {selectedPoint && (
        <motion.div
          className="space-y-3 pt-3 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-xs font-medium text-violet-400 uppercase tracking-wide">Selected Point</div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-black/30 p-2 rounded">
              <div className="text-muted-foreground">x</div>
              <div className="text-foreground font-mono">{selectedPoint.x.toFixed(2)}</div>
            </div>
            <div className="bg-black/30 p-2 rounded">
              <div className="text-muted-foreground">y</div>
              <div className="text-foreground font-mono">{selectedPoint.y.toFixed(2)}</div>
            </div>
            <div className="bg-black/30 p-2 rounded">
              <div className="text-muted-foreground">z</div>
              <div className="text-foreground font-mono">{selectedPoint.z.toFixed(2)}</div>
            </div>
          </div>

          {/* Partial Derivatives */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-pink-400 uppercase tracking-wide">Partial Derivatives</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/30 p-2 rounded">
                <div className="text-muted-foreground">∂f/∂x</div>
                <div className="text-foreground font-mono">
                  {partialX !== null ? partialX.toFixed(3) : '—'}
                </div>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <div className="text-muted-foreground">∂f/∂y</div>
                <div className="text-foreground font-mono">
                  {partialY !== null ? partialY.toFixed(3) : '—'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}