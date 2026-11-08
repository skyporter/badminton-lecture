import {distance} from './court'
import {PLAYER_SPEED, REACTION_TIME, STATUS_MARGIN} from './rules'
import {SHOTS} from './shots'
import type {Arrival, ShotId} from './shots'
import type {Point, Status} from './types'

export function timeMargin(playerA: Point, impact: Point, shot: ShotId): number {
  return SHOTS[shot].flightTime - (REACTION_TIME + distance(playerA, impact) / PLAYER_SPEED)
}

export function statusFor(arrival: Arrival, margin: number): Status {
  switch (arrival) {
    case 'high':
      if (margin >= STATUS_MARGIN.attaque) return 'attaque'
      return margin >= 0 ? 'neutre' : 'defense'
    case 'mid':
      return margin >= STATUS_MARGIN.neutre ? 'neutre' : 'defense'
    case 'low':
      return margin >= STATUS_MARGIN.defense ? 'neutre' : 'defense'
  }
}
