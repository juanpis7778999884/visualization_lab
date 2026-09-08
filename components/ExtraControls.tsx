'use client'

import { motion } from 'framer-motion'
import { 
  Activity,  // ← Reemplaza Earthquake
  Music, 
  PenTool, 
  Clock, 
  Sparkles 
} from 'lucide-react'

interface ExtraControlsProps {
  earthquake: boolean
  setEarthquake: (value: boolean) => void
  earthquakeMagnitude: number
  setEarthquakeMagnitude: (value: number) => void
  drawMode: boolean
  setDrawMode: (value: boolean) => void
  soundEnabled: boolean
  setSoundEnabled: (value: boolean) => void
  timeMode: boolean
  setTimeMode: (value: boolean) => void
  timeValue: number
  setTimeValue: (value: number) => void
}

export function ExtraControls({
  earthquake,
  setEarthquake,
  earthquakeMagnitude,
  setEarthquakeMagnitude,
  drawMode,
  setDrawMode,
  soundEnabled,
  setSoundEnabled,
  timeMode,
  setTimeMode,
  timeValue,
  setTimeValue,
}: ExtraControlsProps) {
  return (
    <motion.div
      className="glass rounded-2xl p-4 space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
        <Sparkles size={16} />
        CONTROLES EXTRAS
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {/* Terremoto */}
        <button
          onClick={() => setEarthquake(!earthquake)}
          className={`p-2 rounded-lg text-xs font-bold transition-all ${
            earthquake
              ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse'
              : 'glass text-muted-foreground'
          }`}
        >
          <Activity size={16} className="mx-auto mb-1" />
          Terremoto
        </button>

        {/* Dibujo */}
        <button
          onClick={() => setDrawMode(!drawMode)}
          className={`p-2 rounded-lg text-xs font-bold transition-all ${
            drawMode
              ? 'bg-pink-500/20 border border-pink-500/50 text-pink-400'
              : 'glass text-muted-foreground'
          }`}
        >
          <PenTool size={16} className="mx-auto mb-1" />
          Dibujar
        </button>

        {/* Sonido */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-lg text-xs font-bold transition-all ${
            soundEnabled
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'glass text-muted-foreground'
          }`}
        >
          <Music size={16} className="mx-auto mb-1" />
          Sonido
        </button>

        {/* Tiempo */}
        <button
          onClick={() => setTimeMode(!timeMode)}
          className={`p-2 rounded-lg text-xs font-bold transition-all ${
            timeMode
              ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400 animate-pulse'
              : 'glass text-muted-foreground'
          }`}
        >
          <Clock size={16} className="mx-auto mb-1" />
          Tiempo
        </button>
      </div>

      {/* Slider de magnitud (terremoto) */}
      {earthquake && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Magnitud</span>
            <span>{earthquakeMagnitude.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={earthquakeMagnitude}
            onChange={(e) => setEarthquakeMagnitude(parseFloat(e.target.value))}
            className="w-full accent-red-500"
          />
        </div>
      )}

      {/* Slider de tiempo */}
      {timeMode && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Tiempo</span>
            <span>{timeValue.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.01}
            value={timeValue}
            onChange={(e) => setTimeValue(parseFloat(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>
      )}
    </motion.div>
  )
}