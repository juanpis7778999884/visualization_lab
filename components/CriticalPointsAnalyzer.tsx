'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react'
import { getPartialDerivativeX, getPartialDerivativeY, evaluateFunction, getExactHessian } from '@/lib/math-utils'
import type { MathFunction } from '@/lib/types'

interface CriticalPoint {
  x: number
  y: number
  z: number
  type: 'max' | 'min' | 'saddle' | 'none'
  hessian: number
  fxx: number
  fyy: number
  fxy: number
}

interface CriticalPointsAnalyzerProps {
  func: MathFunction
  onPointClick: (point: { x: number; y: number; z: number }) => void
}

export function CriticalPointsAnalyzer({ func, onPointClick }: CriticalPointsAnalyzerProps) {
  const [resolution, setResolution] = useState(60)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [points, setPoints] = useState<CriticalPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<CriticalPoint | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = () => {
    console.log('🔍 Iniciando análisis...')
    console.log('📐 Función:', func.expression)
    console.log('📊 Dominio:', func.domain)
    
    setError(null)
    setIsAnalyzing(true)
    setPoints([])
    setSelectedPoint(null)
    
    try {
      const foundPoints: CriticalPoint[] = []
      const { xMin, xMax, yMin, yMax } = func.domain
      
      if (xMin === undefined || xMax === undefined || yMin === undefined || yMax === undefined) {
        throw new Error('El dominio de la función no está definido correctamente')
      }
      
      const stepX = (xMax - xMin) / resolution
      const stepY = (yMax - yMin) / resolution
      
      console.log(`🔍 Resolución: ${resolution}x${resolution}`)

      let totalPoints = 0

      for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
          const x = xMin + i * stepX
          const y = yMin + j * stepY
          
          const fx = getPartialDerivativeX(func.expression, x, y)
          const fy = getPartialDerivativeY(func.expression, x, y)
          
          totalPoints++
          
          if (fx !== null && fy !== null && !isNaN(fx) && !isNaN(fy) && Math.abs(fx) < 0.1 && Math.abs(fy) < 0.1) {
            const z = evaluateFunction(func.expression, x, y) || 0
            
            const hessian = getExactHessian(func.expression, x, y)
            
            let type: 'max' | 'min' | 'saddle' | 'none' = 'none'
            
            if (Math.abs(hessian.determinant) > 0.000001) {
              if (hessian.determinant > 0) {
                type = hessian.fxx > 0 ? 'min' : 'max'
              } else {
                type = 'saddle'
              }
            } else {
              if (Math.abs(hessian.fxx) > 0.001) {
                type = hessian.fxx > 0 ? 'min' : 'max'
              } else if (Math.abs(hessian.fyy) > 0.001) {
                type = hessian.fyy > 0 ? 'min' : 'max'
              }
            }
            
            console.log(`🎯 Punto en (${x.toFixed(4)}, ${y.toFixed(4)}) → fx=${fx.toFixed(4)}, fy=${fy.toFixed(4)}, tipo=${type}`)
            
            foundPoints.push({
              x,
              y,
              z,
              type: type !== 'none' ? type : 'none',
              hessian: hessian.determinant,
              fxx: hessian.fxx,
              fyy: hessian.fyy,
              fxy: hessian.fxy
            })
          }
        }
      }

      console.log(`🔍 Puntos analizados: ${totalPoints}`)
      console.log(`🎯 Puntos con gradiente ≈ 0: ${foundPoints.length}`)

      const filtered: CriticalPoint[] = []
      const threshold = stepX * 0.9
      
      for (const p of foundPoints) {
        let isDuplicate = false
        for (const f of filtered) {
          if (Math.abs(p.x - f.x) < threshold && Math.abs(p.y - f.y) < threshold) {
            isDuplicate = true
            break
          }
        }
        if (!isDuplicate) {
          const hessian = getExactHessian(func.expression, p.x, p.y)
          let type: 'max' | 'min' | 'saddle' | 'none' = p.type
          
          if (type === 'none') {
            if (Math.abs(hessian.determinant) > 0.000001) {
              if (hessian.determinant > 0) {
                type = hessian.fxx > 0 ? 'min' : 'max'
              } else {
                type = 'saddle'
              }
            } else {
              type = Math.abs(hessian.fxx) > Math.abs(hessian.fyy) 
                ? (hessian.fxx > 0 ? 'min' : 'max')
                : (hessian.fyy > 0 ? 'min' : 'max')
            }
          }
          
          filtered.push({
            ...p,
            type,
            hessian: hessian.determinant,
            fxx: hessian.fxx,
            fyy: hessian.fyy,
            fxy: hessian.fxy
          })
        }
      }

      const finalPoints = filtered.filter(p => p.type !== 'none')

      finalPoints.sort((a, b) => {
        const order: Record<string, number> = { max: 0, saddle: 1, min: 2 }
        return order[a.type] - order[b.type]
      })

      setPoints(finalPoints)
      console.log(`✅ Análisis completado: ${finalPoints.length} puntos críticos únicos`)
      
    } catch (err) {
      console.error('❌ Error en el análisis:', err)
      setError(err instanceof Error ? err.message : 'Error al analizar la función')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'max': return <ArrowUp className="size-4 text-green-400" />
      case 'min': return <ArrowDown className="size-4 text-blue-400" />
      case 'saddle': return <Minus className="size-4 text-yellow-400" />
      default: return <Target className="size-4 text-muted-foreground" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'max': return '🔺 MÁXIMO'
      case 'min': return '🔻 MÍNIMO'
      case 'saddle': return '🐴 PUNTO DE SILLA'
      default: return 'PUNTO CRÍTICO'
    }
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'max': return 'text-green-400 border-green-400/30 bg-green-500/10'
      case 'min': return 'text-blue-400 border-blue-400/30 bg-blue-500/10'
      case 'saddle': return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10'
      default: return 'text-cyan-400 border-cyan-400/30 bg-cyan-500/10'
    }
  }

  const handlePointClick = (point: CriticalPoint) => {
    setSelectedPoint(point)
    onPointClick({ x: point.x, y: point.y, z: point.z })
  }

  return (
    <motion.div
      className="glass rounded-2xl p-5 space-y-4 border border-cyan-400/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-5 text-cyan-400" />
          <h3 className="text-base font-bold text-foreground">PUNTOS CRÍTICOS</h3>
        </div>
        <div className="flex items-center gap-2">
          {points.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {points.length} encontrados
            </span>
          )}
          <button
            onClick={analyze}
            disabled={isAnalyzing}
            className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-cyan-400 to-violet-500 text-black rounded-lg hover:shadow-lg hover:shadow-cyan-400/30 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? '⏳ Buscando...' : '🔍 ANALIZAR'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          ❌ {error}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Precisión de búsqueda</span>
          <span>{resolution}x{resolution}</span>
        </div>
        <input
          type="range"
          min={20}
          max={80}
          step={5}
          value={resolution}
          onChange={(e) => setResolution(parseInt(e.target.value))}
          className="w-full accent-cyan-400 h-1"
        />
      </div>

      <AnimatePresence>
        {points.length > 0 && (
          <motion.div
            className="space-y-2 max-h-64 overflow-y-auto pr-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {points.map((p, i) => (
              <motion.button
                key={i}
                onClick={() => handlePointClick(p)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedPoint === p
                    ? `${getTypeColor(p.type)} border-2`
                    : `glass ${getTypeColor(p.type)} opacity-70 hover:opacity-100`
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(p.type)}
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        ({p.x.toFixed(4)}, {p.y.toFixed(4)})
                      </div>
                      <div className="text-xs text-muted-foreground">
                        z = {p.z.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${getTypeColor(p.type)}`}>
                      {getTypeLabel(p.type)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      H = {p.hessian.toFixed(4)}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {points.length === 0 && !isAnalyzing && !error && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <Sparkles className="size-8 mx-auto mb-2 text-cyan-400/50" />
          <p>Haz clic en "Analizar" para encontrar</p>
          <p className="text-xs">máximos, mínimos y puntos de silla</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-cyan-400 border-t-transparent"></div>
          <p className="text-xs text-muted-foreground mt-2">Escaneando la superficie...</p>
        </div>
      )}

      {points.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {points.filter(p => p.type === 'max').length}
            </div>
            <div className="text-[10px] text-muted-foreground">MÁXIMOS</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">
              {points.filter(p => p.type === 'saddle').length}
            </div>
            <div className="text-[10px] text-muted-foreground">PUNTOS DE SILLA</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {points.filter(p => p.type === 'min').length}
            </div>
            <div className="text-[10px] text-muted-foreground">MÍNIMOS</div>
          </div>
        </div>
      )}
    </motion.div>
  )
}