import type {Point} from '../engine/types'
import {SHOTS} from '../engine/shots'
import type {Arc, ShotId, Speed} from '../engine/shots'

export const RETURN_COLOR = '#ffd54a'
export const BEST_RETURN_COLOR = '#ffffff'
export const UNREACHABLE_COLOR = '#ff5252'

export const STROKE_PIXELS = {
  courtLine: 1.5,
  net: 3,
  netDashArray: '6 4',
  trajectory: 2.5,
  bestReturn: 2,
  unreachable: 2,
  unreachableDashArray: '3 4',
  cross: 2.5,
  forehandArc: 3,
  ghost: 1.5,
  ghostDashArray: '4 3',
}

const DASH_ARRAYS: Record<Speed, string> = {
  'very-fast': '',
  'fast': '12 3',
  'medium': '6 6',
  'slow': '2 8',
}

const CURVATURES: Record<Arc, number> = {
  flat: 0,
  low: 0.08,
  high: 0.2,
}

export function constantStroke(width: number, dashArray = ''): Record<string, string | number> {
  const attributes: Record<string, string | number> = {'stroke-width': width, 'vector-effect': 'non-scaling-stroke'}
  if (dashArray === '') {
    return attributes
  } else {
    return {...attributes, 'stroke-dasharray': dashArray}
  }
}

function rounded(value: number): number {
  return Number(value.toFixed(3))
}

export function trajectoryStyle(shot: ShotId): {dashArray: string; curvature: number} {
  const {speed, arc} = SHOTS[shot]
  return {dashArray: DASH_ARRAYS[speed], curvature: CURVATURES[arc]}
}

function controlPoint(from: Point, to: Point, shot: ShotId): Point {
  const {curvature} = trajectoryStyle(shot)
  return {
    x: rounded((from.x + to.x) / 2 + (to.y - from.y) * curvature),
    y: rounded((from.y + to.y) / 2 - (to.x - from.x) * curvature),
  }
}

export function trajectoryPath(from: Point, to: Point, shot: ShotId): string {
  const control = controlPoint(from, to, shot)
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`
}

export function trajectoryMiddle(from: Point, to: Point, shot: ShotId): Point {
  const control = controlPoint(from, to, shot)
  return {x: rounded((from.x + 2 * control.x + to.x) / 4), y: rounded((from.y + 2 * control.y + to.y) / 4)}
}
