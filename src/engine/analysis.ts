import {NET_Y, SINGLES_LEFT, SINGLES_RIGHT, distance} from './court'
import {allowedShots, evaluatePair} from './evaluate'
import type {PairEvaluation} from './evaluate'
import type {Situation} from './generator'
import {
  ALTERNATIVE_MINIMUM_DISTANCE,
  MAP_BRIGHT_GREEN,
  MAP_BRIGHT_GREEN_RATIO,
  MAP_CELL_STEP,
  MAP_LIGHT_GREEN,
  MAP_LIGHT_GREEN_RATIO,
  MAP_RED,
  MAP_RED_RATIO,
  SHOT_FAMILIES,
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

export interface Analysis {
  map: ValueMap
  best: PairEvaluation
  alternative: PairEvaluation
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
  return {map, best, alternative}
}

export function scoreChoice(situation: Situation, level: Level, point: Point, shot: ShotId): ChoiceResult {
  const analysis = analyse(situation, level)
  const choice = evaluatePair(situation, level, point, shot)
  const score = analysis.best.value === 0 ? 0 : Math.min(100, Math.max(0, Math.round(100 * choice.value / analysis.best.value)))
  return {score, choice, analysis}
}

export function mapColor(ratio: number): string {
  if (ratio >= MAP_BRIGHT_GREEN_RATIO) return MAP_BRIGHT_GREEN
  if (ratio >= MAP_LIGHT_GREEN_RATIO) return MAP_LIGHT_GREEN
  if (ratio <= MAP_RED_RATIO) return MAP_RED
  return mixColors(MAP_LIGHT_GREEN, MAP_RED, (MAP_LIGHT_GREEN_RATIO - ratio) / (MAP_LIGHT_GREEN_RATIO - MAP_RED_RATIO))
}

function mixColors(from: string, to: string, fraction: number): string {
  const channels = [1, 3, 5].map((offset) => {
    const start = parseInt(from.slice(offset, offset + 2), 16)
    const end = parseInt(to.slice(offset, offset + 2), 16)
    return Math.round(start + (end - start) * fraction).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
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
  let alternative: PairEvaluation | undefined
  for (let index = 0; index < map.values.length; index++) {
    const point = cellCentre(map, index)
    const farFromBest = distance(point, best.point) >= ALTERNATIVE_MINIMUM_DISTANCE
    for (const shot of shots) {
      if (farFromBest || familyOf(shot) !== bestFamily) {
        const evaluation = evaluatePair(situation, level, point, shot)
        if (alternative === undefined || evaluation.value > alternative.value) alternative = evaluation
      }
    }
  }
  return alternative ?? best
}
