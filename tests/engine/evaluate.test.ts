import {describe, expect, it} from 'vitest'
import {allowedShots, evaluatePair, reachableLanding} from '../../src/engine/evaluate'
import {buildSituation} from '../../src/engine/generator'

const situation = buildSituation({playerA: {x: 3.05, y: 10.6}, playerBHit: {x: 3.05, y: 1.5}, shotB: 'clear-high', landing: {x: 3.05, y: 12.7}})
const lowSituation = buildSituation({playerA: {x: 3.05, y: 10.6}, playerBHit: {x: 3.05, y: 5.5}, shotB: 'net', landing: {x: 3.05, y: 7.7}})
const attackSituation = buildSituation({playerA: {x: 3.05, y: 12.2}, playerBHit: {x: 3.05, y: 1.5}, shotB: 'clear-high', landing: {x: 3.05, y: 12.7}})
const defenseSituation = buildSituation({playerA: {x: 0.6, y: 7.5}, playerBHit: {x: 3.05, y: 1.5}, shotB: 'clear-high', landing: {x: 3.05, y: 12.7}})

function criterionRaw(evaluation: ReturnType<typeof evaluatePair>, id: string): number {
  return evaluation.criteria.find((criterion) => criterion.id === id)!.raw
}

describe('evaluatePair', () => {
  it('has the expected test statuses', () => {
    expect(attackSituation.status).toBe('attaque')
    expect(defenseSituation.status).toBe('defense')
  })

  it('scores out-of-court points as zero', () => {
    const evaluation = evaluatePair(situation, 'intermediaire', {x: 0.2, y: 2}, 'clear-high')
    expect(evaluation).toMatchObject({feasible: false, infeasibility: 'dehors', value: 0})
    expect(evaluation.criteria).toHaveLength(5)
  })

  it('rejects a drop aimed at the back line', () => {
    expect(evaluatePair(situation, 'intermediaire', {x: 3, y: 0.3}, 'drop-slow').infeasibility).toBe('zone')
  })

  it('rejects a smash on a low arrival', () => {
    expect(evaluatePair(lowSituation, 'avance', {x: 3, y: 3}, 'smash')).toMatchObject({feasible: false, infeasibility: 'statut', value: 0})
  })

  it('accepts a feasible pair with value equal to the sum of contributions', () => {
    const evaluation = evaluatePair(situation, 'intermediaire', {x: 3, y: 0.7}, 'clear-high')
    expect(evaluation.feasible).toBe(true)
    expect(evaluation.value).toBeCloseTo(evaluation.criteria.reduce((total, criterion) => total + criterion.contribution, 0))
    expect(evaluation.value).toBeGreaterThan(0)
  })

  it('limits allowed shots to the status and the impact zone', () => {
    expect(allowedShots(lowSituation).every((shotId) => ['lob-defensive', 'lob-attack', 'net'].includes(shotId))).toBe(true)
    expect(allowedShots(situation)).toContain('clear-high')
  })

  it('values points far from recovered B more', () => {
    const recovered = situation.playerBRecovered
    const near = evaluatePair(situation, 'avance', {x: recovered.x, y: recovered.y}, 'clear-high')
    const far = evaluatePair(situation, 'avance', {x: 5.4, y: 0.7}, 'clear-high')
    expect(criterionRaw(far, 'reachTime')).toBeGreaterThan(criterionRaw(near, 'reachTime'))
  })

  it('adds a behind-the-back penalty only beyond the threshold', () => {
    const recovered = situation.playerBRecovered
    const reachOf = (point: {x: number; y: number}) => criterionRaw(evaluatePair(situation, 'avance', point, 'smash'), 'reachTime')
    expect(reachOf({x: recovered.x, y: recovered.y - 0.2})).toBe(reachOf({x: recovered.x + 0.2, y: recovered.y}))
    expect(reachOf({x: recovered.x, y: recovered.y - 1.5})).toBeGreaterThan(reachOf({x: recovered.x, y: recovered.y + 1.5}))
  })

  it('penalises cross-court more in defence than in attack', () => {
    const point = {x: 5.2, y: 1}
    const inDefense = evaluatePair(defenseSituation, 'intermediaire', point, 'clear-high')
    const inAttack = evaluatePair(attackSituation, 'intermediaire', point, 'clear-high')
    expect(inDefense.direction).toBe('croise')
    expect(criterionRaw(inDefense, 'risk')).toBeLessThan(criterionRaw(inAttack, 'risk'))
  })

  it('scores the weak side of B on the backhand rear quarter', () => {
    const weakSideOf = (point: {x: number; y: number}) => criterionRaw(evaluatePair(situation, 'avance', point, 'clear-high'), 'weakSide')
    expect(weakSideOf({x: 4.5, y: 1})).toBe(1)
    expect(weakSideOf({x: 1.5, y: 1})).toBe(0.5)
    expect(weakSideOf({x: 4.5, y: 4})).toBe(0)
  })

  it('is deterministic', () => {
    const point = {x: 4, y: 1}
    expect(evaluatePair(situation, 'avance', point, 'clear-high')).toEqual(evaluatePair(situation, 'avance', point, 'clear-high'))
  })
})

describe('reachableLanding', () => {
  const from = {x: 3, y: 11}

  it('keeps a target the shot can reach', () => {
    expect(reachableLanding(from, {x: 4, y: 3}, 'smash')).toEqual({x: 4, y: 3})
  })

  it('stops a smash aimed at the back line at its deepest landing, on the same line', () => {
    const landing = reachableLanding(from, {x: 5.3, y: 0.5}, 'smash')
    expect(landing.y).toBeCloseTo(1.4)
    expect(landing.x).toBeCloseTo(3 + 2.3 * (9.6 / 10.5))
  })

  it('carries a smash aimed too short to its shortest landing', () => {
    expect(reachableLanding(from, {x: 3, y: 5.7}, 'smash').y).toBeCloseTo(5.0)
  })
})
