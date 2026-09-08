import {
  evaluateFunction,
  getPartialDerivativeX,
  getPartialDerivativeY,
  getExactHessian,
} from './math-utils'

export interface FighterQuestion {
  prompt: string
  detail: string
  options: string[]
  correctIndex: number
}

interface Domain {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

// PRNG determinista (mulberry32): con la misma "semilla" (matchId + ronda)
// los dos celulares generan exactamente el mismo número, sin red de por medio.
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

function fmt(n: number): string {
  return Number(n.toFixed(2)).toString()
}

function randomPoint(rng: () => number, domain: Domain, inset = 0.15) {
  const dx = domain.xMax - domain.xMin
  const dy = domain.yMax - domain.yMin
  const x = domain.xMin + dx * (inset + rng() * (1 - 2 * inset))
  const y = domain.yMin + dy * (inset + rng() * (1 - 2 * inset))
  return { x, y }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Builder = (rng: () => number, expr: string, domain: Domain) => FighterQuestion | null

// A) Signo de f(x,y) en un punto
const buildValueSign: Builder = (rng, expr, domain) => {
  const { x, y } = randomPoint(rng, domain)
  const z = evaluateFunction(expr, x, y)
  if (z === null || Math.abs(z) < 0.05) return null

  const sign = z > 0 ? 'Positivo' : 'Negativo'
  const wrong = z > 0 ? 'Negativo' : 'Positivo'
  const options = shuffle([sign, wrong, 'Cero'], rng)

  return {
    prompt: `🎯 En el punto (${fmt(x)}, ${fmt(y)}), ¿cuál es el signo de f(x,y)?`,
    detail: `f(${fmt(x)}, ${fmt(y)}) ≈ ${fmt(z)}`,
    options,
    correctIndex: options.indexOf(sign),
  }
}

// B) Comparar f en dos puntos distintos
const buildCompare: Builder = (rng, expr, domain) => {
  const a = randomPoint(rng, domain)
  const b = randomPoint(rng, domain)
  const za = evaluateFunction(expr, a.x, a.y)
  const zb = evaluateFunction(expr, b.x, b.y)
  if (za === null || zb === null || Math.abs(za - zb) < 0.1) return null

  const labelA = `Punto A (${fmt(a.x)}, ${fmt(a.y)})`
  const labelB = `Punto B (${fmt(b.x)}, ${fmt(b.y)})`
  const correct = za > zb ? labelA : labelB
  const options = shuffle([labelA, labelB], rng)

  return {
    prompt: `📊 ¿En cuál punto f(x,y) tiene un valor mayor?`,
    detail: `A: f ≈ ${fmt(za)}  ·  B: f ≈ ${fmt(zb)}`,
    options,
    correctIndex: options.indexOf(correct),
  }
}

// C) Signo de ∂f/∂x en un punto (¿crece o decrece al aumentar x?)
const buildDerivX: Builder = (rng, expr, domain) => {
  const { x, y } = randomPoint(rng, domain)
  const fx = getPartialDerivativeX(expr, x, y)
  if (fx === null || Math.abs(fx) < 0.05) return null

  const correct = fx > 0 ? 'Aumenta (∂f/∂x > 0)' : 'Disminuye (∂f/∂x < 0)'
  const wrong = fx > 0 ? 'Disminuye (∂f/∂x < 0)' : 'Aumenta (∂f/∂x > 0)'
  const options = shuffle([correct, wrong], rng)

  return {
    prompt: `📈 En (${fmt(x)}, ${fmt(y)}), si x aumenta un poco, ¿qué le pasa a f(x,y)?`,
    detail: `∂f/∂x ≈ ${fmt(fx)}`,
    options,
    correctIndex: options.indexOf(correct),
  }
}

// D) Signo de ∂f/∂y en un punto
const buildDerivY: Builder = (rng, expr, domain) => {
  const { x, y } = randomPoint(rng, domain)
  const fy = getPartialDerivativeY(expr, x, y)
  if (fy === null || Math.abs(fy) < 0.05) return null

  const correct = fy > 0 ? 'Aumenta (∂f/∂y > 0)' : 'Disminuye (∂f/∂y < 0)'
  const wrong = fy > 0 ? 'Disminuye (∂f/∂y < 0)' : 'Aumenta (∂f/∂y > 0)'
  const options = shuffle([correct, wrong], rng)

  return {
    prompt: `📈 En (${fmt(x)}, ${fmt(y)}), si y aumenta un poco, ¿qué le pasa a f(x,y)?`,
    detail: `∂f/∂y ≈ ${fmt(fy)}`,
    options,
    correctIndex: options.indexOf(correct),
  }
}

// E) Clasificación por Hessiano (cóncava arriba / abajo / silla)
const buildHessian: Builder = (rng, expr, domain) => {
  const { x, y } = randomPoint(rng, domain, 0.25)
  const { fxx, determinant } = getExactHessian(expr, x, y)
  if (Math.abs(determinant) < 0.2) return null

  let correct: string
  if (determinant < 0) {
    correct = 'Punto de silla'
  } else {
    correct = fxx > 0 ? 'Cóncava hacia arriba' : 'Cóncava hacia abajo'
  }
  const allOptions = ['Cóncava hacia arriba', 'Cóncava hacia abajo', 'Punto de silla']
  const options = shuffle(allOptions, rng)

  return {
    prompt: `🧮 En (${fmt(x)}, ${fmt(y)}), ¿cómo se curva la superficie según el Hessiano?`,
    detail: `det(H) ≈ ${fmt(determinant)}`,
    options,
    correctIndex: options.indexOf(correct),
  }
}

const BUILDERS: Builder[] = [buildValueSign, buildCompare, buildDerivX, buildDerivY, buildHessian]

/**
 * Genera la pregunta de la ronda de forma 100% determinista a partir de
 * matchId + número de ronda: dos celulares distintos que llamen esta función
 * con los mismos parámetros obtienen exactamente la misma pregunta, sin
 * necesidad de sincronizarla por la base de datos.
 */
export function generateFighterQuestion(
  matchId: string,
  round: number,
  expression: string,
  domain: Domain
): FighterQuestion {
  const baseSeed = hashString(`${matchId}:${round}`)

  // Hasta 6 intentos con builders y semillas distintas, por si un punto
  // sale ambiguo (derivada ~0, valores empatados, etc.)
  for (let attempt = 0; attempt < 6; attempt++) {
    const rng = mulberry32(baseSeed + attempt * 7919)
    const builderIndex = Math.floor(rng() * BUILDERS.length)
    const question = BUILDERS[builderIndex](rng, expression, domain)
    if (question) return question
  }

  // Fallback garantizado: comparar dos esquinas del dominio (casi nunca empata).
  const rng = mulberry32(baseSeed)
  const a = { x: domain.xMin + 0.2, y: domain.yMin + 0.2 }
  const b = { x: domain.xMax - 0.2, y: domain.yMax - 0.2 }
  const za = evaluateFunction(expression, a.x, a.y) ?? 0
  const zb = evaluateFunction(expression, b.x, b.y) ?? 0
  const labelA = `Punto A (${fmt(a.x)}, ${fmt(a.y)})`
  const labelB = `Punto B (${fmt(b.x)}, ${fmt(b.y)})`
  const correct = za >= zb ? labelA : labelB
  const options = shuffle([labelA, labelB], rng)

  return {
    prompt: `📊 ¿En cuál punto f(x,y) tiene un valor mayor?`,
    detail: `A: f ≈ ${fmt(za)}  ·  B: f ≈ ${fmt(zb)}`,
    options,
    correctIndex: options.indexOf(correct),
  }
}
