import {RETURN_SHOTS} from '../engine/shots'
import type {ShotId} from '../engine/shots'
import type {Level, Point} from '../engine/types'

const LEVELS: Level[] = ['debutant', 'intermediaire', 'avance']
const COORDINATE_PATTERN = /^-?\d+(\.\d+)?$/

export type Choice = {point: Point; shot: ShotId}

export function readSituationParams(search: string): {seed: number | null; level: Level | null; choice: Choice | null} {
  const params = new URLSearchParams(search)
  const seedText = params.get('seed')
  const levelText = params.get('level')
  const seed = seedText !== null && /^\d+$/.test(seedText) && Number.isSafeInteger(Number(seedText)) ? Number(seedText) : null
  const level = LEVELS.find((candidate) => candidate === levelText) ?? null
  return {seed, level, choice: readChoice(params)}
}

function readChoice(params: URLSearchParams): Choice | null {
  const shot = RETURN_SHOTS.find((candidate) => candidate === params.get('shot'))
  const xText = params.get('x') ?? ''
  const yText = params.get('y') ?? ''
  if (shot !== undefined && COORDINATE_PATTERN.test(xText) && COORDINATE_PATTERN.test(yText)) {
    return {point: {x: Number(xText), y: Number(yText)}, shot}
  } else {
    return null
  }
}

export function situationSearch(seed: number, level: Level, choice: Choice | null = null): string {
  const situation = `?seed=${seed}&level=${level}`
  if (choice === null) {
    return situation
  } else {
    return `${situation}&shot=${choice.shot}&x=${Number(choice.point.x.toFixed(2))}&y=${Number(choice.point.y.toFixed(2))}`
  }
}
