import type {Level} from '../engine/types'

const LEVELS: Level[] = ['debutant', 'intermediaire', 'avance']

export function readSituationParams(search: string): {seed: number | null; level: Level | null} {
  const params = new URLSearchParams(search)
  const seedText = params.get('seed')
  const levelText = params.get('level')
  const seed = seedText !== null && /^\d+$/.test(seedText) && Number.isSafeInteger(Number(seedText)) ? Number(seedText) : null
  const level = LEVELS.find((candidate) => candidate === levelText) ?? null
  return {seed, level}
}

export function situationSearch(seed: number, level: Level): string {
  return `?seed=${seed}&level=${level}`
}
