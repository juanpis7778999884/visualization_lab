import { evaluate } from 'mathjs'
import type { MathFunction } from './types'

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

export function getPartialDerivativeX(
  expression: string,
  x: number,
  y: number,
  epsilon = 0.0001
): number | null {
  const f1 = evaluateFunction(expression, x + epsilon, y)
  const f2 = evaluateFunction(expression, x - epsilon, y)

  if (f1 === null || f2 === null) return null
  return (f1 - f2) / (2 * epsilon)
}

export function getPartialDerivativeY(
  expression: string,
  x: number,
  y: number,
  epsilon = 0.0001
): number | null {
  const f1 = evaluateFunction(expression, x, y + epsilon)
  const f2 = evaluateFunction(expression, x, y - epsilon)

  if (f1 === null || f2 === null) return null
  return (f1 - f2) / (2 * epsilon)
}

// 🔥 CORREGIDO: Calcula dominio y rango correctamente
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

  // Detectar posibles restricciones del dominio
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

// 🔥 NUEVO: Calcular curva de nivel para un k dado
export function calculateContourLine(
  expression: string,
  k: number,
  domain: { xMin: number; xMax: number; yMin: number; yMax: number },
  samples = 100
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const step = (domain.xMax - domain.xMin) / samples

  for (let i = 0; i <= samples; i++) {
    const x = domain.xMin + i * step
    // Búsqueda binaria para encontrar y donde f(x,y) = k
    let yLow = domain.yMin
    let yHigh = domain.yMax
    let found = false

    for (let iter = 0; iter < 50; iter++) {
      const yMid = (yLow + yHigh) / 2
      const z = evaluateFunction(expression, x, yMid)

      if (z === null) {
        // Si no está definido, movemos el rango
        yLow = yMid
        continue
      }

      const diff = z - k
      if (Math.abs(diff) < 0.001) {
        points.push({ x, y: yMid })
        found = true
        break
      }

      // Verificar si estamos en el lado correcto
      const zLow = evaluateFunction(expression, x, yLow)
      const zHigh = evaluateFunction(expression, x, yHigh)

      if (zLow === null || zHigh === null) {
        // Si no está definido en los extremos, mover al centro
        yLow = (yLow + yMid) / 2
        yHigh = (yHigh + yMid) / 2
        continue
      }

      if ((zLow - k) * (zHigh - k) > 0) break // No hay raíz en este intervalo

      if ((zLow - k) * (diff) < 0) {
        yHigh = yMid
      } else {
        yLow = yMid
      }
    }
  }

  return points
}

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

  // First pass: collect all z values to determine range
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

  // Second pass: generate vertices and colors
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = domain.xMin + i * xStep
      const y = domain.yMin + j * yStep
      const z = evaluateFunction(expression, x, y) ?? 0

      vertices.push(x, z, y)

      // 🔥 MEJORADO: Thermal color mapping con más gradientes
      const normalized = Math.max(0, Math.min(1, (z - zMin) / zRange))
      let r, g, b

      if (normalized < 0.2) {
        // Deep blue to cyan
        const t = normalized / 0.2
        r = 0
        g = t * 0.8
        b = 0.8 + t * 0.2
      } else if (normalized < 0.4) {
        // Cyan to turquoise
        const t = (normalized - 0.2) / 0.2
        r = t * 0.3
        g = 0.8 + t * 0.2
        b = 1 - t * 0.3
      } else if (normalized < 0.6) {
        // Turquoise to yellow
        const t = (normalized - 0.4) / 0.2
        r = 0.3 + t * 0.7
        g = 1
        b = 0.7 - t * 0.7
      } else if (normalized < 0.8) {
        // Yellow to orange
        const t = (normalized - 0.6) / 0.2
        r = 1
        g = 1 - t * 0.4
        b = 0
      } else {
        // Orange to red
        const t = (normalized - 0.8) / 0.2
        r = 1
        g = 0.6 - t * 0.6
        b = 0
      }

      colors.push(r, g, b)
    }
  }

  // Generate indices
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

export function validateExpression(expression: string): boolean {
  try {
    evaluate(expression, { x: 0, y: 0 })
    return true
  } catch {
    return false
  }
}

export function thermalColor(value: number, min: number, max: number): [number, number, number] {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)))

  let r, g, b

  if (normalized < 0.25) {
    r = 0
    g = normalized / 0.25
    b = 1
  } else if (normalized < 0.5) {
    r = 0
    g = 1
    b = 1 - (normalized - 0.25) / 0.25
  } else if (normalized < 0.75) {
    r = (normalized - 0.5) / 0.25
    g = 1
    b = 0
  } else {
    r = 1
    g = 1 - (normalized - 0.75) / 0.25
    b = 0
  }

  return [r, g, b]
}