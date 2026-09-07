'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, Minimize2, RotateCw, Sparkles } from 'lucide-react'
import { Surface3D } from '@/components/Surface3D'
import { ParticleBackground } from '@/components/ParticleBackground'
import { FunctionPanel } from '@/components/FunctionPanel'
import { InfoPanel } from '@/components/InfoPanel'
import { LevelSlider } from '@/components/LevelSlider'
import { InteractivePoint } from '@/components/InteractivePoint'
import { Header } from '@/components/Header'
import { GamePanel } from '@/components/GamePanel'
import { AchievementPanel } from '@/components/AchievementPanel'
import { ExtraControls } from '@/components/ExtraControls'
import { DEFAULT_FUNCTION } from '@/lib/functions'
import { calculateDomainRange, getPartialDerivativeX, getPartialDerivativeY } from '@/lib/math-utils'
import type { MathFunction } from '@/lib/types'

export default function Page() {
  // Estados base
  const [currentFunction, setCurrentFunction] = useState<MathFunction>(DEFAULT_FUNCTION)
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number; z: number } | null>(null)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const [contourLevel, setContourLevel] = useState(0.5)

  // Estados del juego
  const [gameMode, setGameMode] = useState(false)
  const [targetType, setTargetType] = useState<'max' | 'min' | 'saddle'>('max')
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [gameMessage, setGameMessage] = useState('')

  // Estados extras
  const [earthquake, setEarthquake] = useState(false)
  const [earthquakeMagnitude, setEarthquakeMagnitude] = useState(0.5)
  const [drawMode, setDrawMode] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [timeMode, setTimeMode] = useState(false)
  const [timeValue, setTimeValue] = useState(0)

  // Logros
  const [achievements, setAchievements] = useState([
    { id: 'first-click', name: 'Primer contacto', description: 'Haz clic en la superficie', icon: '👆', unlocked: false },
    { id: 'max-finder', name: 'Buscador de cimas', description: 'Encuentra un máximo local', icon: '🏔️', unlocked: false },
    { id: 'min-finder', name: 'Buscador de valles', description: 'Encuentra un mínimo local', icon: '🕳️', unlocked: false },
    { id: 'saddle-finder', name: 'Jinete de silla', description: 'Encuentra un punto de silla', icon: '🐴', unlocked: false },
    { id: 'custom-master', name: 'Maestro de funciones', description: 'Escribe 3 funciones personalizadas', icon: '🧙', unlocked: false },
    { id: 'explorer', name: 'Explorador', description: 'Visita 10 puntos diferentes', icon: '🧭', unlocked: false },
    { id: 'earthquake', name: 'Terremoto', description: 'Activa el modo terremoto', icon: '🌊', unlocked: false },
    { id: 'time-traveler', name: 'Viajero del tiempo', description: 'Activa el modo tiempo', icon: '⏳', unlocked: false },
  ])

  const range = useMemo(
    () => calculateDomainRange(currentFunction.expression, currentFunction.domain),
    [currentFunction]
  )

  // Efecto para inicializar contourLevel
  useEffect(() => {
    setContourLevel((range.min + range.max) / 2)
  }, [range])

  // Función para verificar si un punto es extremo
  const checkPoint = (x: number, y: number, z: number) => {
    if (!gameMode) return

    const fx = getPartialDerivativeX(currentFunction.expression, x, y)
    const fy = getPartialDerivativeY(currentFunction.expression, x, y)
    
    if (fx === null || fy === null) {
      setGameMessage('❌ Punto no válido')
      return
    }

    // Calcular Hessiano (determinante)
    const fxx = getPartialDerivativeX(currentFunction.expression, x + 0.001, y)
    const fyy = getPartialDerivativeY(currentFunction.expression, x, y + 0.001)
    const fxy = getPartialDerivativeX(currentFunction.expression, x, y + 0.001)
    
    if (fxx === null || fyy === null || fxy === null) {
      setGameMessage('❌ No se puede calcular')
      return
    }

    const hessian = fxx * fyy - fxy * fxy
    const isMax = hessian > 0 && fxx < 0
    const isMin = hessian > 0 && fxx > 0
    const isSaddle = hessian < 0

    let isCorrect = false
    let message = ''

    if (targetType === 'max' && isMax) {
      isCorrect = true
      message = '🎉 ¡Encontraste un MÁXIMO! +100 pts'
      unlockAchievement('max-finder')
    } else if (targetType === 'min' && isMin) {
      isCorrect = true
      message = '🎉 ¡Encontraste un MÍNIMO! +100 pts'
      unlockAchievement('min-finder')
    } else if (targetType === 'saddle' && isSaddle) {
      isCorrect = true
      message = '🎉 ¡Encontraste un PUNTO DE SILLA! +100 pts'
      unlockAchievement('saddle-finder')
    } else {
      message = `❌ No es un ${targetType === 'max' ? 'máximo' : targetType === 'min' ? 'mínimo' : 'punto de silla'}`
    }

    setAttempts(attempts + 1)
    if (isCorrect) {
      setScore(score + 100)
      // Animación de éxito
      if (typeof window !== 'undefined') {
        const audio = new Audio()
        // Crear sonido simple con Web Audio
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = 880
          osc.type = 'sine'
          gain.gain.value = 0.1
          osc.start()
          osc.stop(ctx.currentTime + 0.2)
          setTimeout(() => {
            const osc2 = ctx.createOscillator()
            const gain2 = ctx.createGain()
            osc2.connect(gain2)
            gain2.connect(ctx.destination)
            osc2.frequency.value = 1100
            osc2.type = 'sine'
            gain2.gain.value = 0.08
            osc2.start()
            osc2.stop(ctx.currentTime + 0.3)
          }, 150)
        } catch (e) {}
      }
    }
    setGameMessage(message)
  }

  // Función para desbloquear logros
  const unlockAchievement = (id: string) => {
    setAchievements(prev =>
      prev.map(a => a.id === id ? { ...a, unlocked: true } : a)
    )
  }

  // Función para manejar clicks en la superficie
  const handlePointClick = (point: { x: number; y: number; z: number }) => {
    setSelectedPoint(point)
    
    // Desbloquear logro de primer clic
    unlockAchievement('first-click')
    
    // Desbloquear logro de explorador
    const visitCount = achievements.find(a => a.id === 'explorer')
    if (visitCount && !visitCount.unlocked) {
      // Contar puntos visitados (simplificado)
      unlockAchievement('explorer')
    }

    // Verificar si es un extremo (modo juego)
    checkPoint(point.x, point.y, point.z)
  }

  // Función para cambiar función
  const handleFunctionChange = (func: MathFunction) => {
    setCurrentFunction(func)
    const nextRange = calculateDomainRange(func.expression, func.domain)
    setContourLevel((nextRange.min + nextRange.max) / 2)
    setSelectedPoint(null)
    
    // Contar funciones personalizadas
    if (func.id === 'custom') {
      const customCount = parseInt(localStorage.getItem('custom-functions-count') || '0')
      const newCount = customCount + 1
      localStorage.setItem('custom-functions-count', String(newCount))
      if (newCount >= 3) {
        unlockAchievement('custom-master')
      }
    }
  }

  // Efecto para logros de modos
  useEffect(() => {
    if (earthquake) unlockAchievement('earthquake')
  }, [earthquake])

  useEffect(() => {
    if (timeMode) unlockAchievement('time-traveler')
  }, [timeMode])

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
              {/* Panel de funciones */}
              <FunctionPanel
                currentFunction={currentFunction}
                onFunctionChange={handleFunctionChange}
              />
              
              {/* Panel de información */}
              <InfoPanel
                func={currentFunction}
                selectedPoint={selectedPoint}
                range={range}
              />
              
              {/* Nivel de contorno */}
              <LevelSlider
                min={range.min}
                max={range.max}
                value={contourLevel}
                onChange={setContourLevel}
              />
              
              {/* 🎮 JUEGO: Cazador de extremos */}
              <GamePanel
                gameMode={gameMode}
                setGameMode={setGameMode}
                targetType={targetType}
                setTargetType={setTargetType}
                score={score}
                attempts={attempts}
              />
              
              {/* Mensaje del juego */}
              {gameMessage && (
                <motion.div
                  className="glass p-2 rounded-lg text-center text-sm font-bold"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {gameMessage}
                </motion.div>
              )}
              
              {/* 🏆 Logros */}
              <AchievementPanel achievements={achievements} />
              
              {/* 🎛️ Controles extras */}
              <ExtraControls
                earthquake={earthquake}
                setEarthquake={setEarthquake}
                earthquakeMagnitude={earthquakeMagnitude}
                setEarthquakeMagnitude={setEarthquakeMagnitude}
                drawMode={drawMode}
                setDrawMode={setDrawMode}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                timeMode={timeMode}
                setTimeMode={setTimeMode}
                timeValue={timeValue}
                setTimeValue={setTimeValue}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        <section className={`${isPresentationMode ? 'w-full' : 'ml-[336px] mr-4'} h-[calc(100vh-6rem)] relative`}>
          <div className="absolute inset-0 glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-400/10">
            <Surface3D
              func={currentFunction}
              onPointClick={handlePointClick}
              isAutoRotating={isAutoRotating}
              contourLevel={contourLevel}
              earthquake={earthquake}
              earthquakeMagnitude={earthquakeMagnitude}
              drawMode={drawMode}
              timeValue={timeMode ? timeValue : 0}
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
                {gameMode && (
                  <div className="mt-1 text-xs text-yellow-400 animate-pulse">
                    🎯 Modo Cazador Activo
                  </div>
                )}
                {earthquake && (
                  <div className="mt-1 text-xs text-red-400 animate-pulse">
                    🌊 TERREMOTO: {earthquakeMagnitude.toFixed(1)}
                  </div>
                )}
                {drawMode && (
                  <div className="mt-1 text-xs text-pink-400 animate-pulse">
                    ✏️ Modo Dibujo Activo
                  </div>
                )}
                {timeMode && (
                  <div className="mt-1 text-xs text-purple-400 animate-pulse">
                    ⏳ Tiempo: {timeValue.toFixed(2)}
                  </div>
                )}
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
                🖱️ Drag to orbit · 🔄 Scroll to zoom · 👆 Click to inspect
                {gameMode && ' · 🎯 Encuentra el extremo!'}
                {drawMode && ' · ✏️ Dibuja sobre la superficie!'}
              </div>
              <div className="glass-light rounded-lg px-4 py-2 text-xs text-muted-foreground">
                <span className="text-cyan-400">Thermal map</span> · {range.min.toFixed(2)} to {range.max.toFixed(2)}
                {gameMode && (
                  <span className="ml-2 text-yellow-400">🏆 {score} pts</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <InteractivePoint point={selectedPoint} onDismiss={() => setSelectedPoint(null)} />
    </main>
  )
}