'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X } from 'lucide-react'

interface TooltipContent {
  id: string
  title: string
  description: string
  formula?: string
}

interface EducationalTooltipProps {
  content: TooltipContent
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}

const tooltips: Record<string, TooltipContent> = {
  'domain': {
    id: 'domain',
    title: '📐 Dominio',
    description: 'El dominio es el conjunto de todos los valores (x, y) donde la función está definida. Si la función tiene raíces cuadradas, logaritmos o divisiones, el dominio se restringe.',
    formula: 'Dom(f) = { (x,y) ∈ ℝ² | f(x,y) existe }'
  },
  'range': {
    id: 'range',
    title: '📊 Rango',
    description: 'El rango es el conjunto de todos los valores de z que la función puede tomar. Es la "altura" que alcanza la superficie.',
    formula: 'Ran(f) = { z ∈ ℝ | ∃ (x,y) con f(x,y) = z }'
  },
  'contour': {
    id: 'contour',
    title: '🎯 Curvas de Nivel',
    description: 'Las curvas de nivel son líneas donde f(x,y) = k. Son como las curvas de un mapa topográfico. Te ayudan a visualizar la "altura" de la función.',
    formula: 'C_k = { (x,y) ∈ Dom(f) | f(x,y) = k }'
  },
  'gradient': {
    id: 'gradient',
    title: '🔄 Gradiente',
    description: 'El gradiente ∇f = (∂f/∂x, ∂f/∂y) apunta en la dirección de máximo crecimiento de la función. Su magnitud indica qué tan rápido cambia.',
    formula: '∇f(x,y) = (∂f/∂x, ∂f/∂y)'
  },
  'hessian': {
    id: 'hessian',
    title: '🧮 Hessiano',
    description: 'El Hessiano es una matriz de segundas derivadas. Nos dice si un punto crítico es máximo (H > 0, f_xx < 0), mínimo (H > 0, f_xx > 0) o punto de silla (H < 0).',
    formula: 'H = f_xx * f_yy - (f_xy)²'
  },
  'partial': {
    id: 'partial',
    title: '📈 Derivadas Parciales',
    description: 'La derivada parcial ∂f/∂x mide cómo cambia f cuando variamos x manteniendo y fijo. ∂f/∂y es análogo. Son la base del gradiente.',
    formula: '∂f/∂x = lim_{h→0} (f(x+h,y) - f(x,y))/h'
  }
}

export function EducationalTooltip({ content, position = 'top', children }: EducationalTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltip = tooltips[content.id] || content

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute z-50 w-80 glass rounded-xl p-4 border border-cyan-400/30 shadow-xl shadow-cyan-400/20 ${
              position === 'top' ? 'bottom-full mb-2' :
              position === 'bottom' ? 'top-full mt-2' :
              position === 'left' ? 'right-full mr-2' :
              'left-full ml-2'
            }`}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-cyan-400">{tooltip.title}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {tooltip.description}
            </p>
            {tooltip.formula && (
              <div className="mt-2 p-2 bg-black/30 rounded font-mono text-xs text-cyan-400">
                {tooltip.formula}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}