'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PREDEFINED_FUNCTIONS } from '@/lib/functions'
import { validateExpression } from '@/lib/math-utils'
import type { MathFunction } from '@/lib/types'
import { AlertCircle } from 'lucide-react'

interface FunctionPanelProps {
  currentFunction: MathFunction
  onFunctionChange: (func: MathFunction) => void
}

export function FunctionPanel({ currentFunction, onFunctionChange }: FunctionPanelProps) {
  const [customExpression, setCustomExpression] = useState('')
  const [customError, setCustomError] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleCustomSubmit = () => {
    if (!customExpression.trim()) {
      setCustomError('Expression cannot be empty')
      return
    }

    if (!validateExpression(customExpression)) {
      setCustomError('Invalid expression. Use x, y, and math functions.')
      return
    }

    const newFunc: MathFunction = {
      id: 'custom',
      name: 'Custom Function',
      expression: customExpression,
      description: 'User-defined expression',
      domain: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
    }

    onFunctionChange(newFunc)
    setCustomExpression('')
    setCustomError('')
    setShowCustomInput(false)
  }

  return (
    <motion.div
      className="glass rounded-2xl p-6 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg font-semibold text-foreground">Functions</h2>

      <div className="grid grid-cols-1 gap-3">
        {PREDEFINED_FUNCTIONS.map((func) => (
          <motion.button
            key={func.id}
            onClick={() => onFunctionChange(func)}
            className={`text-left p-4 rounded-lg transition-all ${
              currentFunction.id === func.id
                ? 'glass-light neon-border shadow-lg shadow-cyan-400/20'
                : 'glass hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="font-medium text-sm text-cyan-400">{func.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{func.description}</div>
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={() => setShowCustomInput(!showCustomInput)}
        className="w-full glass p-3 rounded-lg text-sm font-medium text-cyan-400 hover:bg-white/10 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {showCustomInput ? '✕ Close Custom' : '+ Custom Expression'}
      </motion.button>

      {showCustomInput && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <input
            type="text"
            value={customExpression}
            onChange={(e) => {
              setCustomExpression(e.target.value)
              setCustomError('')
            }}
            placeholder="e.g., sin(x)*cos(y)"
            className="w-full bg-black/30 border border-cyan-400/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-cyan-400"
          />

          {customError && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2 rounded">
              <AlertCircle size={14} />
              <span>{customError}</span>
            </div>
          )}

          <motion.button
            onClick={handleCustomSubmit}
            className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-medium py-2 rounded-lg text-sm hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Apply
          </motion.button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Use: x, y, +, -, *, /, ^, sin, cos, tan, exp, sqrt, log, abs</p>
            <p>Example: sin(x)*cos(y) or x^2 - y^2</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
