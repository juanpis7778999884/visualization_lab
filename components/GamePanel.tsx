'use client'

import { motion } from 'framer-motion'
import { Trophy, Target, Zap, Award } from 'lucide-react'

interface GamePanelProps {
  gameMode: boolean
  setGameMode: (mode: boolean) => void
  targetType: 'max' | 'min' | 'saddle'
  setTargetType: (type: 'max' | 'min' | 'saddle') => void
  score: number
  attempts: number
}

export function GamePanel({
  gameMode,
  setGameMode,
  targetType,
  setTargetType,
  score,
  attempts,
}: GamePanelProps) {
  const getTargetLabel = () => {
    if (targetType === 'max') return '🔺 MÁXIMO'
    if (targetType === 'min') return '🔻 MÍNIMO'
    return '🐴 PUNTO DE SILLA'
  }

  const getTargetColor = () => {
    if (targetType === 'max') return 'border-red-500/50 text-red-400'
    if (targetType === 'min') return 'border-blue-500/50 text-blue-400'
    return 'border-purple-500/50 text-purple-400'
  }

  return (
    <motion.div
      className="glass rounded-2xl p-4 space-y-3 border border-cyan-400/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
          <Target size={16} />
          CAZADOR DE EXTREMOS
        </h3>
        <motion.button
          onClick={() => setGameMode(!gameMode)}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            gameMode
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse'
              : 'glass text-muted-foreground'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {gameMode ? '🔴 ACTIVO' : '▶ INICIAR'}
        </motion.button>
      </div>

      {gameMode && (
        <>
          <div className={`border rounded-lg p-3 text-center ${getTargetColor()}`}>
            <p className="text-xs font-mono">ENCUENTRA EL</p>
            <p className="text-lg font-bold">{getTargetLabel()}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTargetType('max')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                targetType === 'max'
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                  : 'glass text-muted-foreground'
              }`}
            >
              🔺 Máx
            </button>
            <button
              onClick={() => setTargetType('min')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                targetType === 'min'
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                  : 'glass text-muted-foreground'
              }`}
            >
              🔻 Mín
            </button>
            <button
              onClick={() => setTargetType('saddle')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                targetType === 'saddle'
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                  : 'glass text-muted-foreground'
              }`}
            >
              🐴 Silla
            </button>
          </div>

          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1">
              <Trophy size={14} className="text-yellow-400" />
              <span>{score} pts</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={14} className="text-cyan-400" />
              <span>{attempts} intentos</span>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}