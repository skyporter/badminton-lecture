import {B_BASE, RECOVERY_BASE_BY_SHOT, RECOVERY_CROSS_PENALTY, RECOVERY_FULL_TIME, RECOVERY_MIN_FRACTION} from './rules'
import {SHOTS} from './shots'
import type {ShotId} from './shots'
import type {Direction, Point} from './types'

export function recoveredPosition(hit: Point, shot: ShotId, direction: Direction): Point {
  const target = B_BASE[RECOVERY_BASE_BY_SHOT[shot]]
  const reachedFraction = Math.min(1, Math.max(RECOVERY_MIN_FRACTION, SHOTS[shot].flightTime / RECOVERY_FULL_TIME))
  const crossPenalty = direction === 'croise' ? RECOVERY_CROSS_PENALTY : 0
  const fraction = reachedFraction - crossPenalty
  return {
    x: hit.x + (target.x - hit.x) * fraction,
    y: hit.y + (target.y - hit.y) * fraction,
  }
}
