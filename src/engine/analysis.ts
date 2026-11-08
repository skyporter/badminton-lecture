import {NET_Y, SINGLES_LEFT, SINGLES_RIGHT, distance} from './court'
import {allowedShots, evaluatePair} from './evaluate'
import type {PairEvaluation} from './evaluate'
import type {Situation} from './generator'
import {
  ALTERNATIVE_MINIMUM_DISTANCE,
  MAP_CELL_STEP,
  SHOT_FAMILIES,
  ZONE_MAXIMUM_DISTANCE,
  ZONE_MINIMUM_RADIUS,
  ZONE_VALUE_RATIO,
} from './rules'
import type {ShotFamily} from './rules'
import {RETURN_SHOTS} from './shots'
import type {ShotId} from './shots'
import type {Level, Point} from './types'

export interface ValueMap {
  originX: number
  originY: number
  step: number
  columns: number
  rows: number
  values: Float32Array
  bestShots: ShotId[]
}

export interface Zone {
  center: Point
  radiusX: number
  radiusY: number
  shot: ShotId
}

export interface Analysis {
  map: ValueMap
  best: PairEvaluation
  alternative: PairEvaluation
  bestZone: Zone | null
  alternativeZone: Zone | null
}

export interface ChoiceResult {
  score: number
  choice: PairEvaluation
  analysis: Analysis
}

export function compositeValueAt(situation: Situation, level: Level, point: Point): number {
  return bestPairAt(situation, level, point).value
}

export function analyse(situation: Situation, level: Level): Analysis {
  const map = buildMap(situation, level)
  const bestIndex = map.values.indexOf(Math.max(...map.values))
  const best = evaluatePair(situation, level, cellCentre(map, bestIndex), map.bestShots[bestIndex])
  const alternative = findAlternative(situation, level, map, best)
  const hasPlayableReturn = best.value > 0
  const hasSecondChoice = hasPlayableReturn && alternative !== best
  return {
    map,
    best,
    alternative,
    bestZone: hasPlayableReturn ? zoneAround(situation, level, map, best) : null,
    alternativeZone: hasSecondChoice ? zoneAround(situation, level, map, alternative) : null,
  }
}

export function scoreChoice(situation: Situation, level: Level, point: Point, shot: ShotId): ChoiceResult {
  const analysis = analyse(situation, level)
  const choice = evaluatePair(situation, level, point, shot)
  const score = analysis.best.value === 0 ? 0 : Math.min(100, Math.max(0, Math.round(100 * choice.value / analysis.best.value)))
  return {score, choice, analysis}
}

function zoneAround(situation: Situation, level: Level, map: ValueMap, pair: PairEvaluation): Zone {
  let radiusX = ZONE_MINIMUM_RADIUS
  let radiusY = ZONE_MINIMUM_RADIUS
  for (let index = 0; index < map.values.length; index++) {
    const point = cellCentre(map, index)
    const isNear = distance(point, pair.point) <= ZONE_MAXIMUM_DISTANCE
    if (isNear && evaluatePair(situation, level, point, pair.shot).value >= ZONE_VALUE_RATIO * pair.value) {
      radiusX = Math.max(radiusX, Math.abs(point.x - pair.point.x) + map.step / 2)
      radiusY = Math.max(radiusY, Math.abs(point.y - pair.point.y) + map.step / 2)
    }
  }
  return {center: pair.point, radiusX, radiusY, shot: pair.shot}
}

function candidateShots(situation: Situation): ShotId[] {
  const shots = allowedShots(situation)
  return shots.length > 0 ? shots : [RETURN_SHOTS[0]]
}

function bestPairAt(situation: Situation, level: Level, point: Point): PairEvaluation {
  return candidateShots(situation)
    .map((shot) => evaluatePair(situation, level, point, shot))
    .reduce((leader, evaluation) => (evaluation.value > leader.value ? evaluation : leader))
}

function buildMap(situation: Situation, level: Level): ValueMap {
  const columns = Math.ceil((SINGLES_RIGHT - SINGLES_LEFT) / MAP_CELL_STEP)
  const rows = Math.ceil(NET_Y / MAP_CELL_STEP)
  const map: ValueMap = {
    originX: SINGLES_LEFT,
    originY: 0,
    step: MAP_CELL_STEP,
    columns,
    rows,
    values: new Float32Array(columns * rows),
    bestShots: [],
  }
  for (let index = 0; index < columns * rows; index++) {
    const evaluation = bestPairAt(situation, level, cellCentre(map, index))
    map.values[index] = evaluation.value
    map.bestShots.push(evaluation.shot)
  }
  return map
}

function cellCentre(map: ValueMap, index: number): Point {
  return {
    x: map.originX + ((index % map.columns) + 0.5) * map.step,
    y: map.originY + (Math.floor(index / map.columns) + 0.5) * map.step,
  }
}

function familyOf(shot: ShotId): ShotFamily {
  return (Object.keys(SHOT_FAMILIES) as ShotFamily[]).find((family) => SHOT_FAMILIES[family].includes(shot))!
}

function findAlternative(situation: Situation, level: Level, map: ValueMap, best: PairEvaluation): PairEvaluation {
  const bestFamily = familyOf(best.shot)
  const shots = candidateShots(situation)
  const otherFamilyShots = shots.filter((shot) => familyOf(shot) !== bestFamily)
  const otherFamily = bestFeasiblePair(situation, level, map, otherFamilyShots, () => true)
  if (otherFamily !== undefined) {
    return otherFamily
  } else {
    const farFromBest = (point: Point) => distance(point, best.point) >= ALTERNATIVE_MINIMUM_DISTANCE
    return bestFeasiblePair(situation, level, map, shots, farFromBest) ?? best
  }
}

function bestFeasiblePair(situation: Situation, level: Level, map: ValueMap, shots: ShotId[], accepts: (point: Point) => boolean): PairEvaluation | undefined {
  let leader: PairEvaluation | undefined
  for (let index = 0; index < map.values.length; index++) {
    const point = cellCentre(map, index)
    if (accepts(point)) {
      for (const shot of shots) {
        const evaluation = evaluatePair(situation, level, point, shot)
        if (evaluation.feasible && (leader === undefined || evaluation.value > leader.value)) leader = evaluation
      }
    }
  }
  return leader
}
