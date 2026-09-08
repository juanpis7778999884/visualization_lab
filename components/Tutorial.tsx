'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles, Target, Trophy, PenTool, Clock, Activity } from 'lucide-react'

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  highlight?: string
  action?: string
}

interface TutorialProps {
  onComplete: () => void
}

const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '👋 ¡Bienvenido al Laboratorio de Visualización Matemática!',
    description: 'Esta aplicación te permite explorar funciones de dos variables (z = f(x,y)) en 3D. Vas a poder ver, tocar y jugar con las matemáticas como nunca antes lo habías hecho.',
    icon: <Sparkles className="size-8 text-yellow-400" />,
    action: 'Haz clic en "Siguiente" para continuar'
  },
  {
    id: 'surface',
    title: '🔮 La Superficie 3D',
    description: 'La superficie que ves es la representación gráfica de la función matemática. Cada punto en la superficie tiene coordenadas (x, y, z) donde z = f(x,y). Los colores representan la altura: azul (bajo) → rojo (alto).',
    icon: <Sparkles className="size-8 text-cyan-400" />,
    highlight: 'Drag para orbitar, Scroll para zoom',
    action: 'Prueba a arrastrar la superficie con el mouse'
  },
  {
    id: 'functions',
    title: '📐 Selección de Funciones',
    description: 'En el panel izquierdo puedes elegir entre varias funciones predefinidas. Cada una tiene propiedades matemáticas únicas: dominios, rangos, simetrías y puntos críticos.',
    icon: <Target className="size-8 text-violet-400" />,
    highlight: 'Prueba a cambiar de función',
    action: 'Haz clic en "Campana Gaussiana" y luego en "Silla de Montar"'
  },
  {
    id: 'domain-range',
    title: '📊 Dominio y Rango',
    description: 'El DOMINIO son todos los valores de (x,y) donde la función existe. El RANGO son todos los valores de z que la función puede tomar. En el panel de información puedes verlos en tiempo real.',
    icon: <Target className="size-8 text-blue-400" />,
    highlight: 'Observa cómo cambian al moverte por la superficie',
    action: 'Haz clic en la superficie para inspeccionar un punto'
  },
  {
    id: 'contour',
    title: '🎯 Curvas de Nivel',
    description: 'Las curvas de nivel son líneas donde f(x,y) = k (la función tiene un valor constante). Son como las curvas de nivel de un mapa topográfico. Mueve el deslizador para ver cómo cambian.',
    icon: <Target className="size-8 text-yellow-400" />,
    highlight: 'Mueve el deslizador "Contour Level"',
    action: 'Arrastra el deslizador de k y observa la curva'
  },
  {
    id: 'game',
    title: '🎮 Cazador de Extremos (El Juego)',
    description: '¡Este es el juego! Tienes que encontrar máximos (picos), mínimos (valles) y puntos de silla en la superficie. Actívalo, elige el tipo y haz clic en la superficie para probar tu suerte.',
    icon: <Trophy className="size-8 text-yellow-400" />,
    highlight: 'Gana puntos al acertar',
    action: 'Activa el "Cazador de Extremos" y busca un máximo'
  },
  {
    id: 'extras',
    title: '⚡ Modos Extras',
    description: 'Terremoto: la superficie vibra en tiempo real. Dibujo: puedes pintar sobre la superficie. Tiempo: funciones que evolucionan con el tiempo. Sonido: feedback de audio al interactuar.',
    icon: <Activity className="size-8 text-pink-400" />,
    highlight: 'Activa todos los modos y experimenta',
    action: 'Prueba el "Terremoto" o el "Modo Tiempo"'
  },
  {
    id: 'achievements',
    title: '🏆 Logros',
    description: 'Desbloquea logros al explorar: tu primer clic, encontrar extremos, activar modos especiales, etc. ¡Hay 8 logros para desbloquear! ¿Podrás conseguirlos todos?',
    icon: <Trophy className="size-8 text-amber-400" />,
    highlight: 'Revisa tus logros en el panel',
    action: 'Haz clic en la superficie para desbloquear tu primer logro'
  },
  {
    id: 'final',
    title: '🚀 ¡Ya eres un Experto!',
    description: 'Ahora ya sabes todo lo que necesitas para explorar funciones multivariables como un profesional. Recuerda: la mejor manera de aprender es experimentando. ¡Diviértete!',
    icon: <Sparkles className="size-8 text-yellow-400" />,
    action: '¡A explorar!'
  }
]

export function Tutorial({ onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const totalSteps = STEPS.length

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsVisible(false)
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isVisible) return null

  const step = STEPS[currentStep]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="glass rounded-3xl p-8 max-w-2xl w-full mx-4 border border-cyan-400/30 shadow-2xl shadow-cyan-400/20"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          {/* Progress bar */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 transition-all duration-500"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex-shrink-0">
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {step.description}
                </p>
                {step.highlight && (
                  <div className="mt-2 p-2 bg-cyan-400/10 rounded-lg border border-cyan-400/20">
                    <p className="text-xs text-cyan-400 font-mono">💡 {step.highlight}</p>
                  </div>
                )}
                {step.action && (
                  <div className="mt-3 p-2 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
                    <p className="text-xs text-yellow-400">🎯 {step.action}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <button
              onClick={handlePrev}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentStep > 0
                  ? 'glass text-foreground hover:bg-white/10'
                  : 'opacity-30 cursor-not-allowed'
              }`}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={16} className="inline mr-1" />
              Anterior
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold text-sm hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
            >
              {currentStep === totalSteps - 1 ? (
                '✨ Comenzar'
              ) : (
                <>
                  Siguiente
                  <ChevronRight size={16} className="inline ml-1" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}