import type { MathFunction } from './types'

export const PREDEFINED_FUNCTIONS: MathFunction[] = [
  {
    id: 'gaussian',
    name: 'Campana Gaussiana',
    expression: 'exp(-(x^2 + y^2) / 2)',
    description: 'Distribución gaussiana clásica bidimensional',
    domain: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
  },
  {
    id: 'ripple',
    name: 'Onda Ondulante',
    expression: 'sin(sqrt(x^2 + y^2)) / (sqrt(x^2 + y^2) + 0.1)',
    description: 'Patrón de ondulación oscilante',
    domain: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
  },
  {
    id: 'saddle',
    name: 'Silla de Montar Hiperbólica',
    expression: 'x^2 - y^2',
    description: 'Topología clásica de punto de silla',
    domain: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
  },
  {
    id: 'spiral',
    name: 'Torre Espiral',
    expression: 'atan2(y, x) + sqrt(x^2 + y^2) / 5',
    description: 'Patrón de torre ascendente en espiral',
    domain: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
  },
  {
    id: 'volcano',
    name: 'Pico del Volcán',
    expression: 'exp(-0.1 * (x^2 + y^2)) * cos(2 * sqrt(x^2 + y^2))',
    description: 'Pico con forma de volcán con anillos',
    domain: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
  },
  {
    id: 'wavy',
    name: 'Superficie Ondulada',
    expression: 'sin(x) * cos(y)',
    description: 'Producto de ondas sinusoidales y cosenoidales',
    domain: { xMin: -Math.PI, xMax: Math.PI, yMin: -Math.PI, yMax: Math.PI },
  },
]

export const DEFAULT_FUNCTION = PREDEFINED_FUNCTIONS[0]