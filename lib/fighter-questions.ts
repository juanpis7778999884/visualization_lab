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

// ============================================================
// PREGUNTAS NUMÉRICAS (usan la función real y un punto al azar)
// Cada una, al variar el punto, genera prácticamente infinitas
// variantes distintas — no son "una sola pregunta".
// ============================================================

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

// C) Signo de ∂f/∂x en un punto — opciones en lenguaje natural.
const buildDerivX: Builder = (rng, expr, domain) => {
  const { x, y } = randomPoint(rng, domain)
  const fx = getPartialDerivativeX(expr, x, y)
  if (fx === null || Math.abs(fx) < 0.05) return null

  const correct = fx > 0 ? 'Aumenta' : 'Disminuye'
  const wrong = fx > 0 ? 'Disminuye' : 'Aumenta'
  const options = shuffle([correct, wrong], rng)

  return {
    prompt: `📈 En (${fmt(x)}, ${fmt(y)}), si x aumenta un poco, ¿qué le pasa a f(x,y)?`,
    detail: `∂f/∂x ≈ ${fmt(fx)}`,
    options,
    correctIndex: options.indexOf(correct),
  }
}

// D) Signo de ∂f/∂y en un punto — mismo cambio.
const buildDerivY: Builder = (rng, expr, domain) => {
  const { x, y } = randomPoint(rng, domain)
  const fy = getPartialDerivativeY(expr, x, y)
  if (fy === null || Math.abs(fy) < 0.05) return null

  const correct = fy > 0 ? 'Aumenta' : 'Disminuye'
  const wrong = fy > 0 ? 'Disminuye' : 'Aumenta'
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

// F) Forma de las curvas de nivel cerca de un punto (conceptual sobre un
// dato real: se lee del signo del determinante del Hessiano, pero al
// estudiante solo se le pide reconocer la forma geométrica).
const buildLevelCurveShape: Builder = (rng, expr, domain) => {
  const { x, y } = randomPoint(rng, domain, 0.25)
  const { determinant } = getExactHessian(expr, x, y)
  if (Math.abs(determinant) < 0.2) return null

  const correct = determinant > 0 ? 'Elipses cerradas' : 'Hipérbolas (forma de silla)'
  const wrong = determinant > 0 ? 'Hipérbolas (forma de silla)' : 'Elipses cerradas'
  const options = shuffle([correct, wrong], rng)

  return {
    prompt: `🥚 Cerca de (${fmt(x)}, ${fmt(y)}), ¿qué forma tienen las curvas de nivel de f(x,y)?`,
    detail:
      determinant > 0
        ? 'La superficie se comporta como un paraboloide cerca de ese punto.'
        : 'La superficie se comporta como una silla de montar cerca de ese punto.',
    options,
    correctIndex: options.indexOf(correct),
  }
}

// G) Comparar TRES puntos a la vez (variante de la B, más difícil)
const buildCompareThree: Builder = (rng, expr, domain) => {
  const a = randomPoint(rng, domain)
  const b = randomPoint(rng, domain)
  const c = randomPoint(rng, domain)
  const za = evaluateFunction(expr, a.x, a.y)
  const zb = evaluateFunction(expr, b.x, b.y)
  const zc = evaluateFunction(expr, c.x, c.y)
  if (za === null || zb === null || zc === null) return null

  const vals = [za, zb, zc]
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  if (max - min < 0.15) return null

  const labelA = `Punto A (${fmt(a.x)}, ${fmt(a.y)})`
  const labelB = `Punto B (${fmt(b.x)}, ${fmt(b.y)})`
  const labelC = `Punto C (${fmt(c.x)}, ${fmt(c.y)})`
  const labels = [labelA, labelB, labelC]
  const correct = labels[vals.indexOf(max)]
  const options = shuffle(labels, rng)

  return {
    prompt: `📊 De estos tres puntos, ¿en cuál f(x,y) es MÁS grande?`,
    detail: `A: f≈${fmt(za)} · B: f≈${fmt(zb)} · C: f≈${fmt(zc)}`,
    options,
    correctIndex: options.indexOf(correct),
  }
}

// ============================================================
// BANCO DE PREGUNTAS CONCEPTUALES — cero procedimiento matemático.
// Son de teoría/definiciones e interpretación geométrica. Se
// escoge una al azar (determinista por semilla) en cada ronda.
// ============================================================
interface ConceptEntry {
  prompt: string
  correct: string
  wrongs: string[]
  detail?: string
}

const CONCEPT_BANK: ConceptEntry[] = [
  {
    prompt: '📘 ¿Qué hace que f(x,y) sea realmente una función?',
    correct: 'A cada par (x, y) le asigna un único valor de salida',
    wrongs: [
      'A cada valor de salida le puede corresponder más de un par (x, y)',
      'Es cualquier ecuación que relacione x, y, z sin ninguna otra condición',
    ],
    detail: 'Pista: "una entrada, una sola salida".',
  },
  {
    prompt: '📘 En términos simples, ¿qué mide una derivada parcial como ∂f/∂x?',
    correct: 'Qué tan inclinada está la superficie si te mueves solo en dirección de x',
    wrongs: [
      'El valor máximo que puede alcanzar la función en todo su dominio',
      'La distancia entre dos puntos cualquiera de la superficie',
    ],
  },
  {
    prompt: '📘 ¿Qué representa el vector gradiente ∇f en un punto?',
    correct: 'La dirección en la que f crece más rápido desde ese punto',
    wrongs: [
      'La dirección en la que f siempre permanece constante',
      'El punto más lejano del dominio de la función',
    ],
  },
  {
    prompt: '📘 Si te mueves en la dirección opuesta al gradiente, ¿qué le pasa a f?',
    correct: 'Es la dirección en la que f decrece más rápido',
    wrongs: ['f no cambia en absoluto', 'f siempre se vuelve indefinida'],
  },
  {
    prompt: '📘 ¿Qué es un punto crítico de f(x,y)?',
    correct: 'Un punto donde ambas derivadas parciales valen cero',
    wrongs: ['Un punto donde la función no está definida', 'Cualquier punto donde x = y'],
  },
  {
    prompt: '📘 ¿Cómo se ve un máximo local en la gráfica de f(x,y)?',
    correct: 'Como la cima de una colina: todos los puntos cercanos están más bajo',
    wrongs: [
      'Como un punto donde la función crece en una dirección y baja en otra',
      'Como una línea recta que atraviesa toda la superficie',
    ],
  },
  {
    prompt: '📘 ¿Cómo se ve un mínimo local en la gráfica de f(x,y)?',
    correct: 'Como el fondo de un valle: todos los puntos cercanos están más alto',
    wrongs: ['Como la cima de una colina', 'Como una curva que nunca cambia de altura'],
  },
  {
    prompt: '📘 ¿Qué es un punto de silla?',
    correct: 'Un punto donde la función sube en una dirección y baja en otra',
    wrongs: [
      'Un punto donde la función siempre alcanza su valor más alto',
      'Un punto que no pertenece al dominio de la función',
    ],
  },
  {
    prompt: '📘 ¿Qué es una curva de nivel de f(x,y)?',
    correct: 'El conjunto de puntos (x,y) donde f vale exactamente lo mismo',
    wrongs: ['La línea recta que pasa por el origen', 'El borde exterior del dominio de la función'],
  },
  {
    prompt: '📘 ¿Qué es el dominio de una función f(x,y)?',
    correct: 'El conjunto de pares (x,y) para los que la función está definida',
    wrongs: [
      'El conjunto de todos los valores que puede dar la función como resultado',
      'Solo el punto (0,0)',
    ],
  },
  {
    prompt: '📘 ¿Qué es el rango (o recorrido) de una función f(x,y)?',
    correct: 'El conjunto de todos los valores de salida que puede tomar la función',
    wrongs: ['El conjunto de entradas (x,y) válidas', 'Siempre es el conjunto de todos los números reales'],
  },
  {
    prompt: '📘 De forma intuitiva, ¿qué significa que f(x,y) sea continua?',
    correct: 'Que su gráfica no tiene huecos ni saltos bruscos',
    wrongs: ['Que solo depende de una variable', 'Que siempre tiene un valor máximo'],
  },
  {
    prompt: '📘 ¿Cuál es la forma general de una función LINEAL de dos variables?',
    correct: 'f(x,y) = ax + by + c',
    wrongs: ['f(x,y) = ax² + by² + c', 'f(x,y) = a·sen(x) + b·cos(y)'],
  },
  {
    prompt: '📘 ¿Qué tipo de función es f(x,y) = x² + y²?',
    correct: 'Una función cuadrática (contiene términos al cuadrado)',
    wrongs: ['Una función lineal', 'Una función que no depende de x ni de y'],
  },
  {
    prompt: '📘 f(x,y) = √(x² + y²) depende solo de la distancia al origen. ¿Cómo se llama esa propiedad?',
    correct: 'Simetría radial',
    wrongs: ['Discontinuidad', 'Linealidad'],
  },
  {
    prompt: '📘 ¿Qué forma tiene la gráfica de f(x,y) = x² + y²?',
    correct: 'Un paraboloide (como un tazón)',
    wrongs: ['Un plano inclinado', 'Una línea recta'],
  },
  {
    prompt: '📘 ¿Qué forma tiene la gráfica de una función lineal f(x,y) = ax + by + c?',
    correct: 'Un plano',
    wrongs: ['Una esfera', 'Un paraboloide'],
  },
  {
    prompt: '📘 ¿Qué es la matriz Hessiana de f(x,y)?',
    correct: 'La matriz formada por todas las segundas derivadas parciales',
    wrongs: ['La matriz de valores de f evaluada en varios puntos', 'El vector gradiente escrito como matriz'],
  },
  {
    prompt: '📘 Si el determinante del Hessiano es NEGATIVO en un punto crítico, ¿qué tipo de punto es?',
    correct: 'Punto de silla',
    wrongs: ['Máximo local', 'Mínimo local'],
  },
  {
    prompt: '📘 Si el determinante del Hessiano es positivo y fxx > 0, ¿qué tipo de punto es?',
    correct: 'Mínimo local',
    wrongs: ['Máximo local', 'Punto de silla'],
  },
  {
    prompt: '📘 Si el determinante del Hessiano es positivo y fxx < 0, ¿qué tipo de punto es?',
    correct: 'Máximo local',
    wrongs: ['Mínimo local', 'Punto de silla'],
  },
  {
    prompt: '📘 ¿Qué es una derivada direccional?',
    correct: 'La tasa de cambio de f al moverte en CUALQUIER dirección, no solo en x o y',
    wrongs: ['Otro nombre para la derivada parcial respecto a x', 'La distancia entre dos curvas de nivel'],
  },
  {
    prompt: '📘 ¿Qué es la superficie que representa f(x,y) en un espacio 3D?',
    correct: 'La gráfica formada por todos los puntos (x, y, f(x,y))',
    wrongs: ['Solo el conjunto de puntos críticos de la función', 'Una curva plana en el plano xy'],
  },
  {
    prompt: '📘 ¿Por qué las curvas de nivel cerca de un máximo o mínimo local suelen ser elipses?',
    correct: 'Porque la función crece (o decrece) de forma parecida en todas direcciones cerca de ese punto',
    wrongs: ['Porque ahí la función siempre vale cero', 'Porque el dominio de la función es siempre circular'],
  },
  {
    prompt: '📘 ¿Por qué las curvas de nivel cerca de un punto de silla suelen ser hipérbolas?',
    correct: 'Porque la función crece en una dirección y decrece en la dirección perpendicular',
    wrongs: [
      'Porque en ese punto la función no está definida',
      'Porque ahí el gradiente siempre es más grande que en cualquier otro punto',
    ],
  },
  {
    prompt: '📘 ¿Qué significa que una función sea ACOTADA?',
    correct: 'Que sus valores no crecen ni decrecen sin límite',
    wrongs: ['Que solo tiene un punto en su dominio', 'Que su gráfica es siempre un plano'],
  },
  {
    prompt: '📘 f(-x, y) = f(x, y) para toda x. ¿Cómo se llama esta propiedad respecto a x?',
    correct: 'Simetría par en x',
    wrongs: ['Simetría impar en x', 'Discontinuidad en x = 0'],
  },
  {
    prompt: '📘 f(-x, y) = -f(x, y) para toda x. ¿Cómo se llama esta propiedad respecto a x?',
    correct: 'Simetría impar en x',
    wrongs: ['Simetría par en x', 'Simetría radial'],
  },
  {
    prompt: '📘 ¿En qué se diferencia una función de dos variables de una de una sola variable?',
    correct: 'La de dos variables recibe DOS valores de entrada (x, y) en vez de uno',
    wrongs: ['La de dos variables nunca puede graficarse', 'La de dos variables siempre da resultados negativos'],
  },
  {
    prompt: '📘 La notación f: R² → R significa que la función...',
    correct: 'Toma un par de números reales y devuelve un solo número real',
    wrongs: ['Toma un solo número y devuelve un par de números', 'Solo puede usarse con números enteros'],
  },
  {
    prompt: '📘 En f(x,y), el par ordenado (x,y) representa...',
    correct: 'Un punto de entrada en el plano, con dos coordenadas',
    wrongs: ['El resultado final de la función', 'Siempre las coordenadas del punto más alto de la gráfica'],
  },
  {
    prompt: '📘 Si fijas y = 3 y dejas variar x en f(x,y), ¿qué obtienes?',
    correct: 'Una traza: un corte transversal de la superficie, una curva en 2D',
    wrongs: ['Otra función de dos variables', 'El punto crítico de la función'],
  },
  {
    prompt: '📘 ¿Para qué sirve un plano tangente a una superficie en un punto?',
    correct: 'Para aproximar cómo se comporta la función muy cerca de ese punto',
    wrongs: ['Para calcular el dominio completo de la función', 'Para encontrar todos los puntos de silla de la función'],
  },
  {
    prompt: '📘 ¿Cuál es la diferencia entre un extremo LOCAL y uno ABSOLUTO?',
    correct: 'El local es el mayor/menor solo cerca de un punto; el absoluto lo es en todo el dominio',
    wrongs: ['No hay ninguna diferencia, son sinónimos', 'El absoluto solo existe si la función es lineal'],
  },
  {
    prompt: '📘 ¿Qué significa que f sea creciente en la dirección de x en cierto punto?',
    correct: 'Que al aumentar x un poco (con y fija), el valor de f aumenta',
    wrongs: ['Que la función nunca puede disminuir en ninguna dirección', 'Que x siempre debe ser positivo'],
  },
  {
    prompt: '📘 ¿Cómo se ve una superficie con concavidad hacia arriba en un punto?',
    correct: 'Como un tazón: se curva hacia arriba alrededor de ese punto',
    wrongs: ['Como una cúpula: se curva hacia abajo', 'Como una línea perfectamente recta'],
  },
  {
    prompt: '📘 ¿Cómo se ve una superficie con concavidad hacia abajo en un punto?',
    correct: 'Como una cúpula o domo: se curva hacia abajo alrededor de ese punto',
    wrongs: ['Como un tazón: se curva hacia arriba', 'Como un plano perfectamente horizontal'],
  },
  {
    prompt: '📘 Si ∂f/∂x no depende de y en ninguna parte, ¿qué sugiere eso sobre la función?',
    correct: 'Que la forma en que f cambia respecto a x es la misma sin importar el valor de y',
    wrongs: ['Que la función no está definida para ningún valor de y', 'Que f siempre es igual a cero'],
  },
  {
    prompt: '📘 ¿Para qué se usan los multiplicadores de Lagrange, en términos simples?',
    correct: 'Para encontrar máximos o mínimos de f cuando hay una restricción que cumplir',
    wrongs: ['Para calcular el dominio de cualquier función', 'Para dibujar la gráfica de f en 3D'],
  },
  {
    prompt: '📘 ¿Qué significa que un punto NO sea un punto crítico?',
    correct: 'Que al menos una de las derivadas parciales en ese punto no es cero',
    wrongs: ['Que la función no existe en ese punto', 'Que ese punto está fuera del dominio siempre'],
  },
  {
    prompt: '📘 En un mapa de calor de f(x,y), ¿qué suele indicar un color más intenso/cálido?',
    correct: 'Un valor más alto de f en esa zona',
    wrongs: ['Que la función no está definida ahí', 'Que ese es el dominio completo de la función'],
  },
  {
    prompt: '📘 Dos curvas de nivel distintas de la misma función, ¿pueden cruzarse entre sí?',
    correct: 'No, porque cada una representa un valor constante distinto de f',
    wrongs: ['Sí, siempre se cruzan en el origen', 'Sí, se cruzan cada vez que la función es cuadrática'],
  },
  {
    prompt:
      '📘 Si te paras exactamente en un punto crítico y caminas sobre una curva de nivel, ¿qué le pasa a f?',
    correct: 'No cambia: por definición, una curva de nivel mantiene el mismo valor de f',
    wrongs: ['Siempre aumenta', 'Siempre se vuelve indefinida'],
  },
  {
    prompt: '📘 ¿Qué representa geométricamente que el gradiente en un punto sea el vector cero?',
    correct: 'Que ese punto es candidato a máximo, mínimo o silla (un punto crítico)',
    wrongs: ['Que la función no está definida en ese punto', 'Que la superficie tiene una pendiente infinita ahí'],
  },
  {
    prompt: '📘 El gradiente ∇f en un punto siempre es perpendicular a...',
    correct: 'La curva de nivel que pasa por ese punto',
    wrongs: ['El eje x, sin importar el punto', 'La recta y = x'],
  },
]

const buildConceptual: Builder = (rng) => {
  const entry = CONCEPT_BANK[Math.floor(rng() * CONCEPT_BANK.length)]
  const options = shuffle([entry.correct, ...entry.wrongs], rng)
  return {
    prompt: entry.prompt,
    detail: entry.detail || 'Pregunta de teoría: no requiere ningún cálculo.',
    options,
    correctIndex: options.indexOf(entry.correct),
  }
}

// buildConceptual se repite varias veces en la lista de builders para que,
// al elegir al azar entre "tipos" de pregunta, las conceptuales (que ya
// traen ~45 variantes propias) tengan más peso frente a las numéricas.
const BUILDERS: Builder[] = [
  buildValueSign,
  buildCompare,
  buildDerivX,
  buildDerivY,
  buildHessian,
  buildLevelCurveShape,
  buildCompareThree,
  buildConceptual,
  buildConceptual,
  buildConceptual,
]

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
  // sale ambiguo (derivada ~0, valores empatados, determinante ~0, etc.)
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