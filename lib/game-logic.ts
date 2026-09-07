import { getPartialDerivativeX, getPartialDerivativeY } from './math-utils'

export type TargetType = 'max' | 'min' | 'saddle'

export function checkPointType(
  expression: string,
  x: number,
  y: number
): 'max' | 'min' | 'saddle' | 'none' {
  const fx = getPartialDerivativeX(expression, x, y)
  const fy = getPartialDerivativeY(expression, x, y)
  
  if (fx === null || fy === null) return 'none'
  
  // Calcular derivadas segundas (aproximación numérica)
  const fxx = getPartialDerivativeX(expression, x + 0.001, y) || 0
  const fyy = getPartialDerivativeY(expression, x, y + 0.001) || 0
  const fxy = getPartialDerivativeX(expression, x, y + 0.001) || 0
  
  const hessian = fxx * fyy - fxy * fxy
  
  // Verificar gradiente ≈ 0
  const gradMagnitude = Math.sqrt(fx * fx + fy * fy)
  if (gradMagnitude > 0.1) return 'none'
  
  if (hessian > 0 && fxx > 0) return 'min'
  if (hessian > 0 && fxx < 0) return 'max'
  if (hessian < 0) return 'saddle'
  
  return 'none'
}

export function calculateScore(
  type: TargetType,
  foundType: 'max' | 'min' | 'saddle' | 'none'
): number {
  if (foundType === 'none') return 0
  if (type === foundType) return 100
  return -20
}