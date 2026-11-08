import type {Direction, Point} from './types'

export const COURT_LENGTH = 13.4
export const COURT_WIDTH = 6.1
export const NET_Y = 6.7
export const SINGLES_LEFT = 0.46
export const SINGLES_RIGHT = 5.64
export const SHORT_SERVICE_DISTANCE = 1.98
export const DOUBLES_LONG_SERVICE_INSET = 0.76
export const CENTER_X = 3.05

const CROSS_COURT_LATERAL_CHANGE = 2

export function isInSinglesHalf(point: Point, side: 'A' | 'B'): boolean {
  const insideWidth = point.x >= SINGLES_LEFT && point.x <= SINGLES_RIGHT
  const insideDepth = side === 'B'
    ? point.y >= 0 && point.y <= NET_Y
    : point.y >= NET_Y && point.y <= COURT_LENGTH
  return insideWidth && insideDepth
}

export function depthFromNet(point: Point): number {
  return Math.abs(point.y - NET_Y)
}

export function pointAtDepth(side: 'A' | 'B', depth: number, x: number): Point {
  const y = side === 'A' ? NET_Y + depth : NET_Y - depth
  return {x, y}
}

export function forehandIsPositiveX(side: 'A' | 'B'): boolean {
  return side === 'A'
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function directionBetween(from: Point, to: Point): Direction {
  return Math.abs(to.x - from.x) > CROSS_COURT_LATERAL_CHANGE ? 'croise' : 'ligne'
}
