import type { MathFunction } from './types'

export const PREDEFINED_FUNCTIONS: MathFunction[] = [
  {
    id: 'gaussian',
    name: 'Gaussian Bell',
    expression: 'exp(-(x^2 + y^2) / 2)',
    description: 'Classic 2D Gaussian distribution',
    domain: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
  },
  {
    id: 'ripple',
    name: 'Ripple Wave',
    expression: 'sin(sqrt(x^2 + y^2)) / (sqrt(x^2 + y^2) + 0.1)',
    description: 'Oscillating ripple pattern',
    domain: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
  },
  {
    id: 'saddle',
    name: 'Hyperbolic Saddle',
    expression: 'x^2 - y^2',
    description: 'Classic saddle point topology',
    domain: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
  },
  {
    id: 'spiral',
    name: 'Spiral Tower',
    expression: 'atan2(y, x) + sqrt(x^2 + y^2) / 5',
    description: 'Spiral rising tower pattern',
    domain: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
  },
  {
    id: 'volcano',
    name: 'Volcano Peak',
    expression: 'exp(-0.1 * (x^2 + y^2)) * cos(2 * sqrt(x^2 + y^2))',
    description: 'Volcano-like peak with rings',
    domain: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
  },
  {
    id: 'wavy',
    name: 'Wavy Surface',
    expression: 'sin(x) * cos(y)',
    description: 'Product of sine and cosine waves',
    domain: { xMin: -Math.PI, xMax: Math.PI, yMin: -Math.PI, yMax: Math.PI },
  },
]

export const DEFAULT_FUNCTION = PREDEFINED_FUNCTIONS[0]
