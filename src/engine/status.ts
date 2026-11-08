import {distance} from './court'
import {PLAYER_SPEED, REACTION_TIME, ATTACK_MARGIN, NEUTRAL_MARGIN_BY_ARRIVAL} from './rules'
import {SHOTS} from './shots'
import type {Arrival, ShotId} from './shots'
import type {Point, Status} from './types'

export function timeMargin(playerA: Point, impact: Point, shot: ShotId): number {
  return SHOTS[shot].flightTime - (REACTION_TIME + distance(playerA, impact) / PLAYER_SPEED)
}

export function statusFor(arrival: Arrival, margin: number): Status {
  if (arrival === 'high' && margin >= ATTACK_MARGIN) return 'attaque'
  return margin >= NEUTRAL_MARGIN_BY_ARRIVAL[arrival] ? 'neutre' : 'defense'
}
