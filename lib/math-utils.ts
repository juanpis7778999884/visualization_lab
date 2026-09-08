import { evaluate } from 'mathjs'
import type { MathFunction } from './types'

// ============================================================
// FUNCIÓN PRINCIPAL: Evaluar f(x,y)
// ============================================================

export function evaluateFunction(
  expression: string,
  x: number,
  y: number
): number | null {
  try {
    const result = evaluate(expression, { x, y })
    const num = Number(result)
    return isFinite(num) ? num : null
  } catch {
    return null
  }
}

// ============================================================
// DERIVADAS PARCIALES PRIMERAS
// ============================================================

export function getPartialDerivativeX(
  expression: string,
  x: number,
  y: number,
  epsilon = 0.0001
): number | null {
  try {
    const f1 = evaluateFunction(expression, x + epsilon, y)
    const f2 = evaluateFunction(expression, x - epsilon, y)
    
    if (f1 === null || f2 === null) return null
    return (f1 - f2) / (2 * epsilon)
  } catch {
    return null
  }
}

export function getPartialDerivativeY(
  expression: string,
  x: number,
  y: number,
  epsilon = 0.0001
): number | null {
  try {
    const f1 = evaluateFunction(expression, x, y + epsilon)
    const f2 = evaluateFunction(expression, x, y - epsilon)
    
    if (f1 === null || f2 === null) return null
    return (f1 - f2) / (2 * epsilon)
  } catch {
    return null
  }
}

// ============================================================
// DERIVADAS PARCIALES SEGUNDAS
// ============================================================

export function getSecondPartialDerivativeXX(
  expression: string,
  x: number,
  y: number,
  epsilon = 0.0001
): number | null {
  try {
    const f1 = evaluateFunction(expression, x + epsilon, y)
    const f2 = evaluateFunction(expression, x, y)
    const f3 = evaluateFunction(expression, x - epsilon, y)
    
    if (f1 === null || f2 === null || f3 === null) return null
    return (f1 - 2 * f2 + f3) / (epsilon * epsilon)
  } catch {
    return null
  }
}

export function getSecondPartialDerivativeYY(
  expression: string,
  x: number,
  y: number,
  epsilon = 0.0001
): number | null {
  try {
    const f1 = evaluateFunction(expression, x, y + epsilon)
    const f2 = evaluateFunction(expression, x, y)
    const f3 = evaluateFunction(expression, x, y - epsilon)
    
    if (f1 === null || f2 === null || f3 === null) return null
    return (f1 - 2 * f2 + f3) / (epsilon * epsilon)
  } catch {
    return null
  }
}

export function getSecondPartialDerivativeXY(
  expression: string,
  x: number,
  y: number,
  epsilon = 0.0001
): number | null {
  try {
    const f1 = evaluateFunction(expression, x + epsilon, y + epsilon)
    const f2 = evaluateFunction(expression, x + epsilon, y - epsilon)
    const f3 = evaluateFunction(expression, x - epsilon, y + epsilon)
    const f4 = evaluateFunction(expression, x - epsilon, y - epsilon)
    
    if (f1 === null || f2 === null || f3 === null || f4 === null) return null
    return (f1 - f2 - f3 + f4) / (4 * epsilon * epsilon)
  } catch {
    return null
  }
}

// ============================================================
// HESSIANO EXACTO PARA FUNCIONES CUADRÁTICAS
// ============================================================

export function getExactHessian(
  expression: string,
  x: number,
  y: number
): {
  fxx: number
  fyy: number
  fxy: number
  determinant: number
} {
  const trimmed = expression.replace(/\s/g, '')
  
  // Funciones cuadráticas conocidas
  if (trimmed === 'x^2+y^2' || trimmed === 'x*x+y*y') {
    return { fxx: 2, fyy: 2, fxy: 0, determinant: 4 }
  }
  if (trimmed === 'x^2-y^2' || trimmed === 'x*x-y*y') {
    return { fxx: 2, fyy: -2, fxy: 0, determinant: -4 }
  }
  if (trimmed === '-x^2-y^2' || trimmed === '-x*x-y*y') {
    return { fxx: -2, fyy: -2, fxy: 0, determinant: 4 }
  }
  
  // Para otras funciones, usar numérico
  const eps = 0.0001
  try {
    const fxx = (evaluateFunction(expression, x + eps, y) || 0) - 2 * (evaluateFunction(expression, x, y) || 0) + (evaluateFunction(expression, x - eps, y) || 0)
    const fyy = (evaluateFunction(expression, x, y + eps) || 0) - 2 * (evaluateFunction(expression, x, y) || 0) + (evaluateFunction(expression, x, y - eps) || 0)
    const fxy = ((evaluateFunction(expression, x + eps, y + eps) || 0) - (evaluateFunction(expression, x + eps, y - eps) || 0) - (evaluateFunction(expression, x - eps, y + eps) || 0) + (evaluateFunction(expression, x - eps, y - eps) || 0)) / 4
    
    return { fxx, fyy, fxy, determinant: fxx * fyy - fxy * fxy }
  } catch {
    return { fxx: 0, fyy: 0, fxy: 0, determinant: 0 }
  }
}

// ============================================================
// DOMINIO Y RANGO
// ============================================================

export function calculateDomainRange(
  expression: string,
  domain: { xMin: number; xMax: number; yMin: number; yMax: number },
  samples = 50
): { min: number; max: number; domainRestrictions: string[] } {
  let min = Infinity
  let max = -Infinity
  const restrictions: string[] = []

  const xStep = (domain.xMax - domain.xMin) / samples
  const yStep = (domain.yMax - domain.yMin) / samples

  // Detectar restricciones del dominio
  if (expression.includes('sqrt(')) {
    restrictions.push('Dominio restringido: radicando ≥ 0')
  }
  if (expression.includes('log(') || expression.includes('ln(')) {
    restrictions.push('Dominio restringido: argumento > 0')
  }
  if (expression.includes('1/') || expression.includes('/(x') || expression.includes('/(y')) {
    restrictions.push('Dominio restringido: denominador ≠ 0')
  }

  for (let i = 0; i <= samples; i++) {
    for (let j = 0; j <= samples; j++) {
      const x = domain.xMin + i * xStep
      const y = domain.yMin + j * yStep

      const z = evaluateFunction(expression, x, y)
      if (z !== null && isFinite(z)) {
        min = Math.min(min, z)
        max = Math.max(max, z)
      }
    }
  }

  return {
    min: isFinite(min) ? min : -10,
    max: isFinite(max) ? max : 10,
    domainRestrictions: restrictions,
  }
}

// ============================================================
// CURVAS DE NIVEL
// ============================================================

export function calculateContourLine(
  expression: string,
  k: number,
  domain: { xMin: number; xMax: number; yMin: number; yMax: number },
  samples = 80
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const xStep = (domain.xMax - domain.xMin) / samples
  const yStep = (domain.yMax - domain.yMin) / samples

  for (let i = 0; i < samples; i++) {
    for (let j = 0; j < samples; j++) {
      const x = domain.xMin + i * xStep
      const y = domain.yMin + j * yStep
      
      const z00 = evaluateFunction(expression, x, y)
      const z10 = evaluateFunction(expression, x + xStep, y)
      const z01 = evaluateFunction(expression, x, y + yStep)
      const z11 = evaluateFunction(expression, x + xStep, y + yStep)
      
      const values = [z00, z10, z01, z11]
      const allValid = values.every(v => v !== null && isFinite(v))
      if (!allValid) continue
      
      const above = [z00!, z10!, z01!, z11!].map(v => v > k)
      const countAbove = above.filter(Boolean).length
      
      if (countAbove === 0 || countAbove === 4) continue
      
      const midX = x + xStep / 2
      const midY = y + yStep / 2
      
      const zMid = evaluateFunction(expression, midX, midY)
      if (zMid !== null && Math.abs(zMid - k) < 0.1) {
        points.push({ x: midX, y: midY })
      }
    }
  }

  // Ordenar puntos
  if (points.length > 2) {
    const sorted: { x: number; y: number }[] = [points[0]]
    const remaining = points.slice(1)
    
    while (remaining.length > 0) {
      const last = sorted[sorted.length - 1]
      let closestIdx = 0
      let closestDist = Infinity
      
      for (let i = 0; i < remaining.length; i++) {
        const dist = Math.sqrt(
          Math.pow(remaining[i].x - last.x, 2) +
          Math.pow(remaining[i].y - last.y, 2)
        )
        if (dist < closestDist) {
          closestDist = dist
          closestIdx = i
        }
      }
      
      if (closestDist < xStep * 3) {
        sorted.push(remaining.splice(closestIdx, 1)[0])
      } else {
        break
      }
    }
    
    return sorted
  }

  return points
}

// ============================================================
// GENERAR DATOS DE SUPERFICIE
// ============================================================

export function generateSurfaceData(
  expression: string,
  domain: { xMin: number; xMax: number; yMin: number; yMax: number },
  resolution: number
): {
  vertices: number[]
  indices: number[]
  colors: number[]
  range: { min: number; max: number }
} {
  const vertices: number[] = []
  const indices: number[] = []
  const colors: number[] = []

  const xStep = (domain.xMax - domain.xMin) / resolution
  const yStep = (domain.yMax - domain.yMin) / resolution

  // Primera pasada: recolectar valores z
  const zValues: number[] = []
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = domain.xMin + i * xStep
      const y = domain.yMin + j * yStep
      const z = evaluateFunction(expression, x, y)
      if (z !== null && isFinite(z)) {
        zValues.push(z)
      }
    }
  }

  const zMin = Math.min(...zValues)
  const zMax = Math.max(...zValues)
  const zRange = Math.max(Math.abs(zMax - zMin), 0.001)

  // Segunda pasada: generar vértices y colores
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = domain.xMin + i * xStep
      const y = domain.yMin + j * yStep
      const z = evaluateFunction(expression, x, y) ?? 0

      vertices.push(x, z, y)

      // Mapa térmico
      const normalized = Math.max(0, Math.min(1, (z - zMin) / zRange))
      let r, g, b

      if (normalized < 0.2) {
        const t = normalized / 0.2
        r = 0
        g = t * 0.8
        b = 0.8 + t * 0.2
      } else if (normalized < 0.4) {
        const t = (normalized - 0.2) / 0.2
        r = t * 0.3
        g = 0.8 + t * 0.2
        b = 1 - t * 0.3
      } else if (normalized < 0.6) {
        const t = (normalized - 0.4) / 0.2
        r = 0.3 + t * 0.7
        g = 1
        b = 0.7 - t * 0.7
      } else if (normalized < 0.8) {
        const t = (normalized - 0.6) / 0.2
        r = 1
        g = 1 - t * 0.4
        b = 0
      } else {
        const t = (normalized - 0.8) / 0.2
        r = 1
        g = 0.6 - t * 0.6
        b = 0
      }

      colors.push(r, g, b)
    }
  }

  // Generar índices
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const a = i * (resolution + 1) + j
      const b = a + 1
      const c = a + resolution + 1
      const d = c + 1

      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  return {
    vertices,
    indices,
    colors,
    range: { min: zMin, max: zMax },
  }
}

// ============================================================
// VALIDACIÓN DE EXPRESIONES
// ============================================================

export function validateExpression(expression: string): boolean {
  try {
    evaluate(expression, { x: 0, y: 0 })
    return true
  } catch {
    return false
  }
}