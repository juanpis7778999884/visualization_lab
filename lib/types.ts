export interface MathFunction {
  id: string
  name: string
  expression: string
  description: string
  domain: { xMin: number; xMax: number; yMin: number; yMax: number }
  range?: { min: number; max: number }
}

export interface SurfaceConfig {
  resolution: number
  scale: number
  heightMultiplier: number
  wireframe: boolean
}

export interface InteractivePointData {
  x: number
  y: number
  z: number
  timestamp: number
}

export interface VisualizationState {
  currentFunction: MathFunction
  contourLevel: number
  isPresentationMode: boolean
  isAutoRotating: boolean
  selectedPoint: InteractivePointData | null
}
