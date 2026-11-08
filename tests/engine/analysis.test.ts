import {describe, expect, it} from 'vitest'
import {analyse, compositeValueAt, mapColor, scoreChoice} from '../../src/engine/analysis'
import {distance, isInSinglesHalf} from '../../src/engine/court'
import {allowedShots, evaluatePair} from '../../src/engine/evaluate'
import {buildSituation} from '../../src/engine/generator'
import {SHOT_FAMILIES} from '../../src/engine/rules'
import {createRng, randomBetween} from '../../src/engine/rng'
import {RETURN_SHOTS} from '../../src/engine/shots'
import type {ShotId} from '../../src/engine/shots'
import type {Level} from '../../src/engine/types'

const situation = buildSituation({playerA: {x: 3.05, y: 10.6}, playerBHit: {x: 3.05, y: 1.5}, shotB: 'clear-high', landing: {x: 3.05, y: 12.7}})
const level: Level = 'intermediaire'
const analysis = analyse(situation, level)

function familyOf(shot: ShotId): string {
  return Object.entries(SHOT_FAMILIES).find(([, shots]) => shots.includes(shot))![0]
}

describe('analyse', () => {
  it('covers the singles half of B in 0.1 m cells', () => {
    const {map} = analysis
    expect(map).toMatchObject({originX: 0.46, originY: 0, step: 0.1, columns: 52, rows: 67})
    expect(map.values).toHaveLength(52 * 67)
    expect(map.bestShots).toHaveLength(52 * 67)
  })

  it('has a best pair that is the maximum of the map', () => {
    expect(Math.fround(analysis.best.value)).toBe(Math.max(...analysis.map.values))
    expect(analysis.best.feasible).toBe(true)
  })

  it('is deterministic', () => {
    expect(analyse(situation, level)).toEqual(analysis)
  })

  it('proposes an alternative distinct from the best', () => {
    const {best, alternative} = analysis
    const farAway = distance(alternative.point, best.point) >= 2.0
    const otherFamily = familyOf(alternative.shot) !== familyOf(best.shot)
    expect(farAway || otherFamily).toBe(true)
    expect(alternative.value).toBeLessThanOrEqual(best.value)
  })

  it('analyses a situation in under 50 ms', () => {
    const durations = Array.from({length: 5}, () => {
      const start = performance.now()
      analyse(situation, level)
      return performance.now() - start
    }).sort((first, second) => first - second)
    expect(durations[2]).toBeLessThan(50)
  })
})

describe('scoreChoice', () => {
  it('gives 100 to the best pair', () => {
    expect(scoreChoice(situation, level, analysis.best.point, analysis.best.shot).score).toBe(100)
  })

  it('scores an out-of-court click 0', () => {
    const result = scoreChoice(situation, level, {x: 3, y: 7.5}, 'clear-high')
    expect(result.score).toBe(0)
    expect(result.choice.infeasibility).toBe('dehors')
  })

  it('scores a shot not allowed by the status 0', () => {
    expect(scoreChoice(situation, level, {x: 3, y: 1}, 'net').score).toBe(0)
  })

  it('returns 0 instead of dividing by zero when the best value is 0', () => {
    const noShotAllowed = {...situation, impact: {x: 3.05, y: 6.0}, arrival: 'high' as const, status: 'defense' as const}
    expect(allowedShots(noShotAllowed)).toEqual([])
    const result = scoreChoice(noShotAllowed, level, {x: 3, y: 1}, 'clear-high')
    expect(result.analysis.best.value).toBe(0)
    expect(result.score).toBe(0)
  })
})

describe('map and score consistency', () => {
  it('never lets the map contradict the score', () => {
    const rng = createRng(2026)
    const {map} = analysis
    for (let iteration = 0; iteration < 200; iteration++) {
      const point = {x: randomBetween(rng, 0.46, 5.64), y: randomBetween(rng, 0, 6.7)}
      const shot = RETURN_SHOTS[Math.floor(rng() * RETURN_SHOTS.length)]
      const pairValue = evaluatePair(situation, level, point, shot).value
      expect(compositeValueAt(situation, level, point)).toBeGreaterThanOrEqual(pairValue)

      const column = Math.min(map.columns - 1, Math.floor((point.x - map.originX) / map.step))
      const row = Math.min(map.rows - 1, Math.floor((point.y - map.originY) / map.step))
      const centre = {x: map.originX + (column + 0.5) * map.step, y: map.originY + (row + 0.5) * map.step}
      expect(isInSinglesHalf(centre, 'B')).toBe(true)
      expect(map.values[row * map.columns + column]).toBe(Math.fround(compositeValueAt(situation, level, centre)))
    }
  })
})

describe('mapColor', () => {
  it('is bright green from 0.9', () => {
    expect(mapColor(1)).toBe('#00e676')
    expect(mapColor(0.9)).toBe('#00e676')
  })

  it('is light green from 0.7', () => {
    expect(mapColor(0.89)).toBe('#b2ff59')
    expect(mapColor(0.7)).toBe('#b2ff59')
  })

  it('is red at 0.4 and below', () => {
    expect(mapColor(0.4)).toBe('#ff5252')
    expect(mapColor(0)).toBe('#ff5252')
  })

  it('blends between light green and red', () => {
    expect(mapColor(0.55)).toBe('#d9a956')
  })
})
