'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, Minimize2, RotateCw, Sparkles } from 'lucide-react'
import { Surface3D } from '@/components/Surface3D'
import { ParticleBackground } from '@/components/ParticleBackground'
import { FunctionPanel } from '@/components/FunctionPanel'
import { InfoPanel } from '@/components/InfoPanel'
import { LevelSlider } from '@/components/LevelSlider'
import { InteractivePoint } from '@/components/InteractivePoint'
import { Header } from '@/components/Header'
import { DEFAULT_FUNCTION } from '@/lib/functions'
import { calculateDomainRange } from '@/lib/math-utils'
import type { MathFunction } from '@/lib/types'

export default function Page() {
  const [currentFunction, setCurrentFunction] = useState<MathFunction>(DEFAULT_FUNCTION)
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number; z: number } | null>(null)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const range = useMemo(
    () => calculateDomainRange(currentFunction.expression, currentFunction.domain),
    [currentFunction]
  )
  const [contourLevel, setContourLevel] = useState((range.min + range.max) / 2)

  const handleFunctionChange = (func: MathFunction) => {
    setCurrentFunction(func)
    const nextRange = calculateDomainRange(func.expression, func.domain)
    setContourLevel((nextRange.min + nextRange.max) / 2)
    setSelectedPoint(null)
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <ParticleBackground />
      <Header
        isPresentationMode={isPresentationMode}
        onPresentationModeChange={setIsPresentationMode}
      />

      <div className="relative min-h-screen pt-20">
        <AnimatePresence mode="wait">
          {!isPresentationMode && (
            <motion.aside
              className="fixed left-4 top-24 bottom-4 w-80 z-30 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-cyan-400/30"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
            >
              <FunctionPanel
                currentFunction={currentFunction}
                onFunctionChange={handleFunctionChange}
              />
              <InfoPanel
                func={currentFunction}
                selectedPoint={selectedPoint}
                range={range}
              />
              <LevelSlider
                min={range.min}
                max={range.max}
                value={contourLevel}
                onChange={setContourLevel}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        <section className={`${isPresentationMode ? 'w-full' : 'ml-[336px] mr-4'} h-[calc(100vh-6rem)] relative`}>
          <div className="absolute inset-0 glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-400/10">
            <Surface3D
              func={currentFunction}
              onPointClick={setSelectedPoint}
              isAutoRotating={isAutoRotating}
              contourLevel={contourLevel}
            />

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="glass-light rounded-lg px-4 py-3 pointer-events-auto">
                <div className="flex items-center gap-2 text-xs text-cyan-400 uppercase tracking-wider font-semibold">
                  <Sparkles size={14} />
                  Live Surface
                </div>
                <div className="mt-1 text-sm text-foreground font-mono">z = {currentFunction.expression}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  k = {contourLevel.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <motion.button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`p-3 rounded-lg glass-light transition-all ${isAutoRotating ? 'text-cyan-400 neon-border' : 'text-muted-foreground'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Toggle auto rotation"
                >
                  <RotateCw size={18} />
                </motion.button>
                <motion.button
                  onClick={() => setIsPresentationMode(!isPresentationMode)}
                  className="p-3 rounded-lg glass-light text-muted-foreground hover:text-cyan-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Toggle fullscreen presentation mode"
                >
                  {isPresentationMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </motion.button>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="glass-light rounded-lg px-4 py-2 text-xs text-muted-foreground">
                Drag to orbit · Scroll to zoom · Click the surface to inspect
              </div>
              <div className="glass-light rounded-lg px-4 py-2 text-xs text-muted-foreground">
                <span className="text-cyan-400">Thermal map</span> · {range.min.toFixed(2)} to {range.max.toFixed(2)}
              </div>
            </div>
          </div>
        </section>
      </div>

      <InteractivePoint point={selectedPoint} onDismiss={() => setSelectedPoint(null)} />
    </main>
  )
}