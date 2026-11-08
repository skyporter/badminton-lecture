import {CENTER_X, NET_Y, SHORT_SERVICE_DISTANCE, SINGLES_LEFT, SINGLES_RIGHT, directionBetween, pointAtDepth} from './court'
import {
  HIGH_ARRIVAL_IMPACT_ADVANCE,
  LANDING_X_RANGE_BY_SIDE,
  LINE_DIRECTION_PROBABILITY,
  RECEIVER_BASE,
  RECEIVER_BASE_SPREAD,
  RECEIVER_DEPTH_RANGE,
  SERVER_DEPTH_BEHIND_SHORT_LINE,
  SERVER_SCORE_MAXIMUM,
  SERVER_X_RANGE_BY_SIDE,
  SERVE_LANDING_X_RANGE_BY_SIDE,
  SERVE_PROBABILITY,
  SERVE_SHOT_IDS,
} from './rules'
import {createRng, pick, randomBetween} from './rng'
import {recoveredPosition} from './recovery'
import {SHOTS, RETURN_SHOTS, hitZoneOf} from './shots'
import type {Arrival, ShotId} from './shots'
import {statusFor, timeMargin} from './status'
import type {Direction, Handedness, Point, Status} from './types'

export interface Situation {
  seed: number
  handedness: Handedness
  isServe: boolean
  playerA: Point
  playerBHit: Point
  playerBRecovered: Point
  shotB: ShotId
  directionB: Direction
  landing: Point
  impact: Point
  arrival: Arrival
  margin: number
  status: Status
  contact: 'coup-droit' | 'revers' | 'tour-de-tete'
}

interface SituationInput {
  playerA: Point
  playerBHit: Point
  shotB: ShotId
  landing: Point
  isServe?: boolean
}

export function buildSituation(input: SituationInput): Situation {
  const {playerA, playerBHit, shotB, landing, isServe = false} = input
  const shot = SHOTS[shotB]
  if (shot.serve !== isServe) throw new Error(`Shot ${shotB} does not match isServe=${isServe}`)
  if (!isServe && !shot.playableFrom.includes(hitZoneOf(playerBHit))) {
    throw new Error(`Shot ${shotB} is not playable from the ${hitZoneOf(playerBHit)} zone`)
  }

  const directionB = directionBetween(playerBHit, landing)
  const impactAdvance = shot.arrival === 'high' ? HIGH_ARRIVAL_IMPACT_ADVANCE : 0
  const impact = {x: landing.x, y: landing.y - impactAdvance}
  const margin = timeMargin(playerA, impact, shotB)
  const contact = contactFor(playerA, impact, shot.arrival)

  return {
    seed: 0,
    handedness: 'droitier',
    isServe,
    playerA,
    playerBHit,
    playerBRecovered: recoveredPosition(playerBHit, shotB, directionB),
    shotB,
    directionB,
    landing,
    impact,
    arrival: shot.arrival,
    margin,
    status: statusFor(shot.arrival, margin),
    contact,
  }
}

export function generateSituation(seed: number): Situation {
  const rng = createRng(seed)
  const input = rng() < SERVE_PROBABILITY ? serveInput(rng) : rallyInput(rng)
  return {...buildSituation(input), seed}
}

function contactFor(playerA: Point, impact: Point, arrival: Arrival): Situation['contact'] {
  if (impact.x > playerA.x) return 'coup-droit'
  return arrival === 'high' ? 'tour-de-tete' : 'revers'
}

function serveInput(rng: () => number): SituationInput {
  const serverScore = Math.floor(rng() * (SERVER_SCORE_MAXIMUM + 1))
  const serverSide = serverScore % 2 === 0 ? 'right' : 'left'
  const receiverSide = serverSide === 'right' ? 'left' : 'right'
  const [serverMinimumX, serverMaximumX] = SERVER_X_RANGE_BY_SIDE[serverSide]
  const [receiverMinimumX, receiverMaximumX] = SERVER_X_RANGE_BY_SIDE[receiverSide]
  const [minimumDepthBehind, maximumDepthBehind] = SERVER_DEPTH_BEHIND_SHORT_LINE
  const shotB = pick(rng, SERVE_SHOT_IDS)
  const [landingMinimumX, landingMaximumX] = SERVE_LANDING_X_RANGE_BY_SIDE[serverSide]

  const playerBHit = pointAtDepth('B', SHORT_SERVICE_DISTANCE + randomBetween(rng, minimumDepthBehind, maximumDepthBehind), randomBetween(rng, serverMinimumX, serverMaximumX))
  const playerA = pointAtDepth('A', randomBetween(rng, ...RECEIVER_DEPTH_RANGE), randomBetween(rng, receiverMinimumX, receiverMaximumX))
  const landing = pointAtDepth('A', randomBetween(rng, ...SHOTS[shotB].landingDepth), randomBetween(rng, landingMinimumX, landingMaximumX))

  return {playerA, playerBHit, shotB, landing, isServe: true}
}

function rallyInput(rng: () => number): SituationInput {
  const playerBHit = {x: randomBetween(rng, SINGLES_LEFT, SINGLES_RIGHT), y: randomBetween(rng, 0, NET_Y)}
  const shotB = pick(rng, RETURN_SHOTS.filter((shotId) => SHOTS[shotId].playableFrom.includes(hitZoneOf(playerBHit))))
  const direction: Direction = rng() < LINE_DIRECTION_PROBABILITY ? 'ligne' : 'croise'
  const hitsLeftOfCenter = playerBHit.x < CENTER_X
  const landsLow = (direction === 'ligne') === hitsLeftOfCenter
  const landing = pointAtDepth('A', randomBetween(rng, ...SHOTS[shotB].landingDepth), randomBetween(rng, ...LANDING_X_RANGE_BY_SIDE[landsLow ? 'low' : 'high']))
  const playerA = {
    x: RECEIVER_BASE.x + randomBetween(rng, -RECEIVER_BASE_SPREAD, RECEIVER_BASE_SPREAD),
    y: RECEIVER_BASE.y + randomBetween(rng, -RECEIVER_BASE_SPREAD, RECEIVER_BASE_SPREAD),
  }

  return {playerA, playerBHit, shotB, landing}
}
