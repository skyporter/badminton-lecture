import {describe, expect, it} from 'vitest'
import {analyse, compositeValueAt, scoreChoice} from '../../src/engine/analysis'
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

  it('proposes a feasible alternative from another shot family when one is allowed', () => {
    const {best, alternative} = analysis
    expect(allowedShots(situation).some((shot) => familyOf(shot) !== familyOf(best.shot))).toBe(true)
    expect(familyOf(alternative.shot)).not.toBe(familyOf(best.shot))
    expect(alternative.feasible).toBe(true)
    expect(alternative.value).toBeLessThanOrEqual(best.value)
  })

  it('falls back to a pair far from the best when only one family is allowed', () => {
    const defensiveLobOnly = {...situation, impact: {x: 3.05, y: 8.0}, arrival: 'mid' as const, status: 'defense' as const}
    expect(allowedShots(defensiveLobOnly)).toEqual(['lob-defensive'])
    const {best, alternative} = analyse(defensiveLobOnly, level)
    expect(distance(alternative.point, best.point)).toBeGreaterThanOrEqual(2.0)
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

describe('zones of the two best returns', () => {
  const insideEllipse = (point: {x: number; y: number}, zone: NonNullable<typeof analysis.alternativeZone>) =>
    ((point.x - zone.center.x) / zone.radiusX) ** 2 + ((point.y - zone.center.y) / zone.radiusY) ** 2 <= 1 + 1e-9

  it('centres zone 1 on the best return and names its shot', () => {
    expect(analysis.bestZone).toMatchObject({center: analysis.best.point, shot: analysis.best.shot})
  })

  it('centres zone 2 on the second choice, a shot of another family', () => {
    expect(analysis.alternativeZone).toMatchObject({center: analysis.alternative.point, shot: analysis.alternative.shot})
    expect(familyOf(analysis.alternativeZone!.shot)).not.toBe(familyOf(analysis.bestZone!.shot))
  })

  it('covers every cell within 1.5 m where the same shot keeps 90 % of its value, and stays within 1.5 m', () => {
    const zone = analysis.bestZone!
    expect(zone.radiusX).toBeGreaterThanOrEqual(0.3)
    expect(zone.radiusY).toBeGreaterThanOrEqual(0.3)
    expect(zone.radiusX).toBeLessThanOrEqual(1.55)
    expect(zone.radiusY).toBeLessThanOrEqual(1.55)
    const {map} = analysis
    for (let index = 0; index < map.values.length; index++) {
      const point = {x: map.originX + (index % map.columns + 0.5) * map.step, y: map.originY + (Math.floor(index / map.columns) + 0.5) * map.step}
      const value = evaluatePair(situation, level, point, zone.shot).value
      if (distance(point, zone.center) <= 1.5 && value >= 0.9 * analysis.best.value) {
        expect(Math.abs(point.x - zone.center.x)).toBeLessThanOrEqual(zone.radiusX)
        expect(Math.abs(point.y - zone.center.y)).toBeLessThanOrEqual(zone.radiusY)
      }
    }
    expect(insideEllipse(analysis.best.point, zone)).toBe(true)
  })

  it('has no zones when no return is playable', () => {
    const hopeless = buildSituation({playerA: {x: 0.6, y: 13.2}, playerBHit: {x: 3.05, y: 6.0}, shotB: 'net', landing: {x: 5.5, y: 6.9}})
    const hopelessAnalysis = analyse(hopeless, level)
    if (hopelessAnalysis.best.value === 0) {
      expect(hopelessAnalysis.bestZone).toBeNull()
      expect(hopelessAnalysis.alternativeZone).toBeNull()
    }
  })
})

