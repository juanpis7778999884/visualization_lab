'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Check, X, Award } from 'lucide-react'

interface Question {
  id: number
  question: string
  options: string[]
  correct: number
  explanation: string
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: '¿Qué representa la curva de nivel f(x,y) = k?',
    options: [
      'Todos los puntos donde la función vale k',
      'La pendiente máxima de la función',
      'El valor mínimo de la función',
      'El dominio de la función'
    ],
    correct: 0,
    explanation: 'La curva de nivel son todos los puntos (x,y) donde f(x,y) = k. Es como las curvas de altitud en un mapa.'
  },
  {
    id: 2,
    question: 'Si H > 0 y f_xx > 0 en un punto crítico, ¿qué tipo de punto es?',
    options: [
      'Máximo local',
      'Mínimo local',
      'Punto de silla',
      'No se puede determinar'
    ],
    correct: 1,
    explanation: 'Cuando H > 0 y f_xx > 0, tenemos un mínimo local. La función es convexa en ese punto.'
  },
  {
    id: 3,
    question: '¿Qué información nos da el gradiente ∇f?',
    options: [
      'La dirección de máximo crecimiento',
      'El valor mínimo de la función',
      'El dominio de la función',
      'Las curvas de nivel'
    ],
    correct: 0,
    explanation: 'El gradiente apunta en la dirección donde la función crece más rápido. Su magnitud indica la tasa de cambio.'
  },
  {
    id: 4,
    question: '¿Qué condición se cumple en un punto de silla?',
    options: [
      'H > 0 y f_xx > 0',
      'H > 0 y f_xx < 0',
      'H < 0',
      'H = 0'
    ],
    correct: 2,
    explanation: 'En un punto de silla, H < 0. La función sube en una dirección y baja en otra.'
  },
  {
    id: 5,
    question: 'El dominio de f(x,y) = √(4 - x² - y²) es:',
    options: [
      'Todo ℝ²',
      'Un círculo de radio 2',
      'Solo el origen',
      'Dos rectas que se cruzan'
    ],
    correct: 1,
    explanation: 'La función existe cuando 4 - x² - y² ≥ 0, es decir, x² + y² ≤ 4. Esto es un círculo de radio 2.'
  }
]

interface MathQuizProps {
  onComplete?: (score: number) => void
}

export function MathQuiz({ onComplete }: MathQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [completed, setCompleted] = useState(false)

  const question = QUESTIONS[currentQuestion]

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index)
    setShowExplanation(true)
    
    if (index === question.correct) {
      setScore(score + 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      setCompleted(true)
      onComplete?.(score)
    }
  }

  if (completed) {
    return (
      <motion.div
        className="glass rounded-2xl p-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Award className="size-12 text-yellow-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-foreground">¡Quiz Completado!</h3>
        <p className="text-3xl font-bold text-cyan-400 mt-2">
          {score} / {QUESTIONS.length}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {score === QUESTIONS.length ? '🎉 ¡Perfecto! Eres un experto en funciones multivariables.' :
           score >= QUESTIONS.length * 0.6 ? '👍 ¡Bien hecho! Sigue practicando.' :
           '📚 Revisa los conceptos y vuelve a intentarlo.'}
        </p>
        <button
          onClick={() => {
            setCurrentQuestion(0)
            setSelectedAnswer(null)
            setShowExplanation(false)
            setScore(0)
            setCompleted(false)
          }}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
        >
          🔄 Reintentar
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="glass rounded-2xl p-6 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
          <Brain size={16} />
          Desafío Matemático
        </h3>
        <span className="text-xs text-muted-foreground">
          {currentQuestion + 1}/{QUESTIONS.length}
        </span>
      </div>

      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
          style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <div className="min-h-[200px]">
        <p className="text-sm text-foreground font-medium">{question.question}</p>
        
        <div className="space-y-2 mt-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !selectedAnswer && handleAnswer(index)}
              disabled={selectedAnswer !== null}
              className={`w-full text-left p-3 rounded-lg text-sm transition-all ${
                selectedAnswer === null
                  ? 'glass hover:bg-white/10'
                  : index === question.correct
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : selectedAnswer === index
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                  : 'opacity-50'
              }`}
            >
              <span className="font-mono text-xs text-muted-foreground mr-2">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
              {selectedAnswer !== null && index === question.correct && (
                <Check className="inline ml-2 size-4 text-green-400" />
              )}
              {selectedAnswer === index && index !== question.correct && (
                <X className="inline ml-2 size-4 text-red-400" />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showExplanation && (
            <motion.div
              className="mt-3 p-3 bg-cyan-400/10 rounded-lg border border-cyan-400/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-xs text-muted-foreground">
                💡 {question.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedAnswer !== null && (
        <button
          onClick={handleNext}
          className="w-full py-2 bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-400/30 transition-all text-sm"
        >
          {currentQuestion < QUESTIONS.length - 1 ? 'Siguiente →' : '✨ Ver Resultados'}
        </button>
      )}
    </motion.div>
  )
}