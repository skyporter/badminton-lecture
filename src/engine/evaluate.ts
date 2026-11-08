import {CENTER_X, NET_Y, SINGLES_LEFT, SINGLES_RIGHT, depthFromNet, directionBetween, distance, forehandIsPositiveX, isInSinglesHalf} from './court'
import type {CriterionId} from './rules'
import {
  ALLOWED_BY_STATUS,
  B_REACH,
  B_SPEED,
  BEHIND_PENALTY_PER_METER,
  BEHIND_THRESHOLD,
  CROSS_FLIGHT_TIME_FACTOR,
  CROSS_PENALTY_FULL_LATERAL,
  CROSS_PENALTY_START_LATERAL,
  CROSS_RISK,
  LANDING_DEPTH_TOLERANCE,
  LINE_RISK_DISTANCE,
  PRESSURE_MULTIPLIER_BY_STATUS,
  REACH_REFERENCE_TIME,
  REAR_MINIMUM_DEPTH,
  SHOT_PRESSURE,
  SHOT_RECOVERY,
  SHOT_RISK,
  WEAK_SIDE_BACKHAND_VALUE,
  WEAK_SIDE_FOREHAND_REAR_VALUE,
  WEIGHTS,
} from './rules'
import type {Situation} from './generator'
import {SHOTS, hitZoneOf} from './shots'
import type {ShotId} from './shots'
import type {Direction, Level, Point} from './types'

export interface CriterionScore {
  id: CriterionId
  raw: number
  weight: number
  contribution: number
}

export type Infeasibility = 'dehors' | 'statut' | 'zone'

export interface PairEvaluation {
  point: Point
  shot: ShotId
  direction: Direction
  feasible: boolean
  infeasibility?: Infeasibility
  value: number
  criteria: CriterionScore[]
}

export function allowedShots(situation: Situation): ShotId[] {
  const hitZone = hitZoneOf(situation.impact)
  return (ALLOWED_BY_STATUS[situation.status][situation.arrival] ?? []).filter((shotId) => SHOTS[shotId].playableFrom.includes(hitZone))
}

export function evaluatePair(situation: Situation, level: Level, point: Point, shot: ShotId): PairEvaluation {
  const direction = directionBetween(situation.impact, point)
  const rawByCriterion: Record<CriterionId, number> = {
    reachTime: reachTimeScore(situation, point, shot),
    weakSide: weakSideScore(point),
    risk: riskScore(situation, point, shot),
    recoveryTime: SHOT_RECOVERY[shot],
    pressure: SHOT_PRESSURE[shot] * PRESSURE_MULTIPLIER_BY_STATUS[situation.status],
  }
  const criteria = (Object.keys(rawByCriterion) as CriterionId[]).map((id) => {
    const weight = WEIGHTS[level][id]
    return {id, raw: rawByCriterion[id], weight, contribution: rawByCriterion[id] * weight}
  })
  const infeasibility = infeasibilityOf(situation, point, shot)
  const value = infeasibility ? 0 : criteria.reduce((total, criterion) => total + criterion.contribution, 0)

  return {point, shot, direction, feasible: infeasibility === undefined, infeasibility, value, criteria}
}

export function reachableLanding(from: Point, target: Point, shot: ShotId): Point {
  const [minimumDepth, maximumDepth] = SHOTS[shot].landingDepth
  const depth = depthFromNet(target)
  const reachableDepth = Math.min(Math.max(depth, minimumDepth - LANDING_DEPTH_TOLERANCE), maximumDepth + LANDING_DEPTH_TOLERANCE)
  if (reachableDepth === depth) {
    return target
  } else {
    const landingY = NET_Y - reachableDepth
    const fraction = (from.y - landingY) / (from.y - target.y)
    return {x: from.x + (target.x - from.x) * fraction, y: landingY}
  }
}

function infeasibilityOf(situation: Situation, point: Point, shot: ShotId): Infeasibility | undefined {
  const [minimumDepth, maximumDepth] = SHOTS[shot].landingDepth
  const depth = depthFromNet(point)
  if (!isInSinglesHalf(point, 'B')) {
    return 'dehors'
  } else if (!allowedShots(situation).includes(shot)) {
    return 'statut'
  } else if (depth < minimumDepth - LANDING_DEPTH_TOLERANCE || depth > maximumDepth + LANDING_DEPTH_TOLERANCE) {
    return 'zone'
  } else {
    return undefined
  }
}

function reachTimeScore(situation: Situation, point: Point, shot: ShotId): number {
  const recovered = situation.playerBRecovered
  const behindDistance = Math.max(0, recovered.y - point.y)
  const behindPenalty = Math.max(0, behindDistance - BEHIND_THRESHOLD) * BEHIND_PENALTY_PER_METER
  const reachTime = Math.max(0, distance(recovered, point) - B_REACH) / B_SPEED + behindPenalty
  const flightTime = SHOTS[shot].flightTime * (1 + (CROSS_FLIGHT_TIME_FACTOR - 1) * crossFraction(situation, point))
  return clamp(0.5 + (reachTime - flightTime) / (2 * REACH_REFERENCE_TIME))
}

function weakSideScore(point: Point): number {
  if (depthFromNet(point) <= REAR_MINIMUM_DEPTH) {
    return 0
  } else if ((point.x > CENTER_X) === forehandIsPositiveX('B')) {
    return WEAK_SIDE_FOREHAND_REAR_VALUE
  } else {
    return WEAK_SIDE_BACKHAND_VALUE
  }
}

function riskScore(situation: Situation, point: Point, shot: ShotId): number {
  const distanceToLine = Math.max(0, Math.min(point.x - SINGLES_LEFT, SINGLES_RIGHT - point.x, point.y))
  const lineRisk = clamp(1 - distanceToLine / LINE_RISK_DISTANCE)
  const crossRisk = CROSS_RISK[situation.status === 'defense' ? 'defense' : 'neutral'] * crossFraction(situation, point)
  return clamp(1 - Math.max(lineRisk, SHOT_RISK[shot] + crossRisk))
}

function crossFraction(situation: Situation, point: Point): number {
  const lateralChange = Math.abs(point.x - situation.impact.x)
  return clamp((lateralChange - CROSS_PENALTY_START_LATERAL) / (CROSS_PENALTY_FULL_LATERAL - CROSS_PENALTY_START_LATERAL))
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}
