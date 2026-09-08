'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
  BookOpen,
  Brain,
  Flame,
  Target,
  Trophy,
  Menu,
  X,
  Swords,
} from 'lucide-react'
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
import { Tutorial } from '@/components/Tutorial'
import { MathQuiz } from '@/components/MathQuiz'
import { CriticalPointsAnalyzer } from '@/components/CriticalPointsAnalyzer'
import { MathFighter } from '@/components/MathFighter'
import { TournamentArena } from '@/components/TournamentArena'
import { DEFAULT_FUNCTION } from '@/lib/functions'
import { calculateDomainRange, getPartialDerivativeX, getPartialDerivativeY } from '@/lib/math-utils'
import type { MathFunction } from '@/lib/types'

export default function Page() {
  // ============================================================
  // ESTADOS BASE
  // ============================================================
  const [currentFunction, setCurrentFunction] = useState<MathFunction>(DEFAULT_FUNCTION)
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number; z: number } | null>(null)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const [contourLevel, setContourLevel] = useState(0.5)

  // ============================================================
  // ESTADOS DEL JUEGO (CAZADOR DE EXTREMOS)
  // ============================================================
  const [gameMode, setGameMode] = useState(false)
  const [targetType, setTargetType] = useState<'max' | 'min' | 'saddle'>('max')
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [gameMessage, setGameMessage] = useState('')

  // ============================================================
  // ESTADOS EXTRAS
  // ============================================================
  const [earthquake, setEarthquake] = useState(false)
  const [earthquakeMagnitude, setEarthquakeMagnitude] = useState(0.5)
  const [drawMode, setDrawMode] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [timeMode, setTimeMode] = useState(false)
  const [timeValue, setTimeValue] = useState(0)

  // ============================================================
  // ESTADOS DE UI
  // ============================================================
  const [showTutorial, setShowTutorial] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showFighter, setShowFighter] = useState(false)
  const [showTournament, setShowTournament] = useState(false)

  // ============================================================
  // LOGROS
  // ============================================================
  const [achievements, setAchievements] = useState([
    { id: 'first-click', name: 'Primer contacto', description: 'Haz clic en la superficie', icon: '👆', unlocked: false },
    { id: 'max-finder', name: 'Buscador de cimas', description: 'Encuentra un máximo local', icon: '🏔️', unlocked: false },
    { id: 'min-finder', name: 'Buscador de valles', description: 'Encuentra un mínimo local', icon: '🕳️', unlocked: false },
    { id: 'saddle-finder', name: 'Jinete de silla', description: 'Encuentra un punto de silla', icon: '🐴', unlocked: false },
    { id: 'custom-master', name: 'Maestro de funciones', description: 'Escribe 3 funciones personalizadas', icon: '🧙', unlocked: false },
    { id: 'explorer', name: 'Explorador', description: 'Visita 10 puntos diferentes', icon: '🧭', unlocked: false },
    { id: 'earthquake', name: 'Terremoto', description: 'Activa el modo terremoto', icon: '🌊', unlocked: false },
    { id: 'time-traveler', name: 'Viajero del tiempo', description: 'Activa el modo tiempo', icon: '⏳', unlocked: false },
    { id: 'quiz-master', name: '🧠 Genio Matemático', description: 'Obtén 5/5 en el quiz', icon: '🏆', unlocked: false },
    { id: 'fighter-champion', name: '🥊 Campeón Fighter', description: 'Gana una pelea en MATH FIGHTER', icon: '🥊', unlocked: false },
  ])

  // ============================================================
  // CÁLCULOS
  // ============================================================
  const range = useMemo(
    () => calculateDomainRange(currentFunction.expression, currentFunction.domain),
    [currentFunction]
  )

  // ============================================================
  // EFECTOS
  // ============================================================
  useEffect(() => {
    setContourLevel((range.min + range.max) / 2)
  }, [range])

  useEffect(() => {
    if (earthquake) unlockAchievement('earthquake')
  }, [earthquake])

  useEffect(() => {
    if (timeMode) unlockAchievement('time-traveler')
  }, [timeMode])

  useEffect(() => {
    if (quizScore === 5) unlockAchievement('quiz-master')
  }, [quizScore])

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cerrar menú en resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobileMenuOpen])

  // ============================================================
  // FUNCIONES DEL JUEGO
  // ============================================================
  const checkPoint = (x: number, y: number, z: number) => {
    if (!gameMode) return

    const fx = getPartialDerivativeX(currentFunction.expression, x, y)
    const fy = getPartialDerivativeY(currentFunction.expression, x, y)

    if (fx === null || fy === null) {
      setGameMessage('❌ Punto no válido')
      return
    }

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
      if (soundEnabled && typeof window !== 'undefined') {
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

  // ============================================================
  // FUNCIONES DE LOGROS
  // ============================================================
  const unlockAchievement = (id: string) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, unlocked: true } : a)))
  }

  // ============================================================
  // MANEJADORES DE EVENTOS
  // ============================================================
  const handlePointClick = (point: { x: number; y: number; z: number }) => {
    setSelectedPoint(point)
    unlockAchievement('first-click')

    const visits = parseInt(localStorage.getItem('math-visits') || '0') + 1
    localStorage.setItem('math-visits', String(visits))
    if (visits >= 10) unlockAchievement('explorer')

    checkPoint(point.x, point.y, point.z)
  }

  const handleFunctionChange = (func: MathFunction) => {
    setCurrentFunction(func)
    const nextRange = calculateDomainRange(func.expression, func.domain)
    setContourLevel((nextRange.min + nextRange.max) / 2)
    setSelectedPoint(null)

    if (func.id === 'custom') {
      const customCount = parseInt(localStorage.getItem('custom-functions-count') || '0') + 1
      localStorage.setItem('custom-functions-count', String(customCount))
      if (customCount >= 3) unlockAchievement('custom-master')
    }
  }

  const handleFighterWin = () => {
    unlockAchievement('fighter-champion')
  }

  // Toggle Math Fighter
  const toggleFighter = () => {
    setShowFighter(!showFighter)
    if (!showFighter) {
      setShowTournament(false)
      if (isMobile) setIsMobileMenuOpen(false)
    }
  }

  // Toggle Torneo por grupos
  const toggleTournament = () => {
    setShowTournament(!showTournament)
    if (!showTournament) {
      setShowFighter(false)
      if (isMobile) setIsMobileMenuOpen(false)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <ParticleBackground />

      <Header
        isPresentationMode={isPresentationMode}
        onPresentationModeChange={setIsPresentationMode}
        onSkipTutorial={() => setShowTutorial(false)}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onOpenFighter={toggleFighter}
        isFighterOpen={showFighter}
        onOpenTournament={toggleTournament}
        isTournamentOpen={showTournament}
      />

      {showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}

      <div className="relative min-h-screen pt-20">
        {/* Panel lateral */}
        <AnimatePresence>
          {!isPresentationMode && (
            <>
              {/* Overlay oscuro para móvil */}
              {isMobileMenuOpen && isMobile && (
                <motion.div
                  className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              <motion.aside
                className={`
                  fixed z-30 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-cyan-400/30
                  transition-all duration-300 ease-in-out
                  ${isMobile 
                    ? (isMobileMenuOpen 
                        ? 'left-0 right-0 top-20 bottom-0 p-4 bg-background/95 backdrop-blur-md' 
                        : '-left-full')
                    : 'left-4 top-24 bottom-4 w-80'
                  }
                `}
                initial={false}
                animate={{
                  x: isMobile 
                    ? (isMobileMenuOpen ? 0 : -400) 
                    : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <div className={isMobile ? 'h-full overflow-y-auto pb-20' : 'space-y-3'}>
                  <FunctionPanel
                    currentFunction={currentFunction}
                    onFunctionChange={handleFunctionChange}
                  />

                  <InfoPanel func={currentFunction} selectedPoint={selectedPoint} range={range} />

                  <LevelSlider
                    min={range.min}
                    max={range.max}
                    value={contourLevel}
                    onChange={setContourLevel}
                  />

                  <CriticalPointsAnalyzer
                    func={currentFunction}
                    onPointClick={handlePointClick}
                  />

                  <GamePanel
                    gameMode={gameMode}
                    setGameMode={setGameMode}
                    targetType={targetType}
                    setTargetType={setTargetType}
                    score={score}
                    attempts={attempts}
                  />

                  {gameMessage && (
                    <motion.div
                      className={`glass p-2 rounded-lg text-center text-sm font-bold ${
                        gameMessage.includes('🎉') ? 'text-yellow-400 border border-yellow-400/30' : 'text-red-400'
                      }`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      {gameMessage}
                    </motion.div>
                  )}

                  <AchievementPanel achievements={achievements} />

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

                  <motion.button
                    onClick={() => setShowTutorial(true)}
                    className="w-full glass p-3 rounded-lg text-sm font-medium text-cyan-400 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <BookOpen size={16} />
                    📖 Tutorial Interactivo
                  </motion.button>

                  <motion.button
                    onClick={() => setShowQuiz(!showQuiz)}
                    className="w-full glass p-3 rounded-lg text-sm font-medium text-violet-400 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Brain size={16} />
                    🧠 Desafío Matemático
                  </motion.button>

                  {showQuiz && <MathQuiz onComplete={setQuizScore} />}

                  {/* ⚔️ MATH FIGHTER - 1vs1 */}
                  {showFighter && (
                    <MathFighter 
                      currentFunction={currentFunction} 
                      onWin={handleFighterWin}
                    />
                  )}

                  {/* 🏆 TORNEO POR GRUPOS */}
                  {showTournament && (
                    <TournamentArena onClose={() => setShowTournament(false)} />
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Contenido principal 3D */}
        <section
          className={`
            h-[calc(100vh-6rem)] relative transition-all duration-300
            ${isPresentationMode ? 'w-full' : 'w-full md:ml-[336px] md:mr-4'}
            ${isMobile && isMobileMenuOpen ? 'opacity-30' : 'opacity-100'}
          `}
        >
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

            {/* Overlay superior - Responsive */}
            <div className="absolute top-4 left-4 right-4 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
              <div className="glass-light rounded-lg px-3 py-2 md:px-4 md:py-3 pointer-events-auto text-xs md:text-sm max-w-[200px] md:max-w-none">
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-cyan-400 uppercase tracking-wider font-semibold">
                  <Sparkles size={14} />
                  Live Surface
                </div>
                <div className="mt-1 font-mono text-[10px] md:text-sm truncate">
                  z = {currentFunction.expression}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  k = {contourLevel.toFixed(2)}
                </div>
                {gameMode && (
                  <div className="mt-1 text-[10px] text-yellow-400 animate-pulse">
                    🎯 Modo Cazador
                  </div>
                )}
                {earthquake && (
                  <div className="mt-1 text-[10px] text-red-400 animate-pulse">
                    🌊 {earthquakeMagnitude.toFixed(1)}
                  </div>
                )}
                {drawMode && (
                  <div className="mt-1 text-[10px] text-pink-400 animate-pulse">
                    ✏️ Dibujo
                  </div>
                )}
                {timeMode && (
                  <div className="mt-1 text-[10px] text-purple-400 animate-pulse">
                    ⏳ {timeValue.toFixed(2)}
                  </div>
                )}
                {showFighter && (
                  <div className="mt-1 text-[10px] text-red-400 animate-pulse">
                    ⚔️ Fighter Activo
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <motion.button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`p-2 md:p-3 rounded-lg glass-light transition-all ${
                    isAutoRotating ? 'text-cyan-400 neon-border' : 'text-muted-foreground'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCw size={16} className="md:size-[18px]" />
                </motion.button>
                <motion.button
                  onClick={() => setIsPresentationMode(!isPresentationMode)}
                  className="p-2 md:p-3 rounded-lg glass-light text-muted-foreground hover:text-cyan-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPresentationMode ? <Minimize2 size={16} className="md:size-[18px]" /> : <Maximize2 size={16} className="md:size-[18px]" />}
                </motion.button>
              </div>
            </div>

            {/* Overlay inferior - Responsive */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="glass-light rounded-lg px-2 py-1 md:px-4 md:py-2 text-[8px] md:text-xs text-muted-foreground">
                🖱️ Arrastrar · 🔄 Zoom
                {gameMode && ' · 🎯 Cazar'}
                {drawMode && ' · ✏️ Dibujar'}
                {showFighter && ' · ⚔️ Fighter'}
              </div>
              <div className="glass-light rounded-lg px-2 py-1 md:px-4 md:py-2 text-[8px] md:text-xs text-muted-foreground">
                <span className="text-cyan-400">Mapa</span> {range.min.toFixed(1)}-{range.max.toFixed(1)}
                {gameMode && <span className="ml-2 text-yellow-400">🏆 {score}</span>}
                {quizScore > 0 && <span className="ml-2 text-violet-400">🧠 {quizScore}/5</span>}
              </div>
            </div>
          </div>
        </section>
      </div>

      <InteractivePoint point={selectedPoint} onDismiss={() => setSelectedPoint(null)} />
    </main>
  )
}