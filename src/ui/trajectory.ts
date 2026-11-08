import type {Point} from '../engine/types'
import {SHOTS} from '../engine/shots'
import type {Arc, ShotId, Speed} from '../engine/shots'

export const RETURN_COLOR = '#ffd54a'
export const BEST_RETURN_COLOR = '#ffffff'
export const BEST_RETURN_DASH_ARRAY = '0.2 0.12'

const DASH_ARRAYS: Record<Speed, string> = {
  'very-fast': '',
  'fast': '0.4 0.1',
  'medium': '0.2 0.2',
  'slow': '0.06 0.3',
}

const CURVATURES: Record<Arc, number> = {
  flat: 0,
  low: 0.08,
  high: 0.2,
}

function rounded(value: number): number {
  return Number(value.toFixed(3))
}

export function trajectoryStyle(shot: ShotId): {dashArray: string; curvature: number} {
  const {speed, arc} = SHOTS[shot]
  return {dashArray: DASH_ARRAYS[speed], curvature: CURVATURES[arc]}
}

export function trajectoryPath(from: Point, to: Point, shot: ShotId): string {
  const {curvature} = trajectoryStyle(shot)
  const deltaX = to.x - from.x
  const deltaY = to.y - from.y
  const controlX = rounded((from.x + to.x) / 2 + deltaY * curvature)
  const controlY = rounded((from.y + to.y) / 2 - deltaX * curvature)
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`
}
