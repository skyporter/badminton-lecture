import {describe, expect, it} from 'vitest'
import {buildSituation, generateSituation} from '../../src/engine/generator'
import {depthFromNet, isInSinglesHalf, NET_Y} from '../../src/engine/court'
import {SHOTS, hitZoneOf} from '../../src/engine/shots'

describe('generateSituation', () => {
  it('is deterministic for a seed', () => expect(generateSituation(7)).toEqual(generateSituation(7)))

  it('always produces playable, in-bounds situations', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const situation = generateSituation(seed)
      expect(situation.seed).toBe(seed)
      expect(isInSinglesHalf(situation.landing, 'A')).toBe(true)
      expect(isInSinglesHalf(situation.playerA, 'A')).toBe(true)
      expect(isInSinglesHalf(situation.playerBHit, 'B')).toBe(true)
      expect(isInSinglesHalf(situation.playerBRecovered, 'B')).toBe(true)
      expect(SHOTS[situation.shotB].serve).toBe(situation.isServe)
      if (!situation.isServe) expect(SHOTS[situation.shotB].playableFrom).toContain(hitZoneOf(situation.playerBHit))
    }
  })

  it('produces both serves and rallies', () => {
    const serves = Array.from({length: 2000}, (_, seed) => generateSituation(seed)).filter((situation) => situation.isServe)
    expect(serves.length).toBeGreaterThan(200)
    expect(serves.length).toBeLessThan(400)
  })

  it('lands serves diagonally in the receiving service box', () => {
    for (let seed = 0; seed < 2000; seed++) {
      const situation = generateSituation(seed)
      if (!situation.isServe) continue
      expect(depthFromNet(situation.landing)).toBeGreaterThanOrEqual(1.98)
      expect(Math.sign(situation.landing.x - 3.05)).toBe(-Math.sign(situation.playerBHit.x - 3.05))
      expect(Math.sign(situation.playerA.x - 3.05)).toBe(-Math.sign(situation.playerBHit.x - 3.05))
      expect(depthFromNet(situation.playerBHit)).toBeGreaterThanOrEqual(2.28)
      expect(depthFromNet(situation.playerBHit)).toBeLessThanOrEqual(2.98)
    }
  })

  it('never lets a net shot come from the rear court', () => {
    const rearHit = {x: 3, y: 0.5}
    const landing = {x: 3, y: NET_Y + 1}
    const playerA = {x: 3.05, y: 10.6}
    expect(() => buildSituation({playerA, playerBHit: rearHit, shotB: 'net', landing})).toThrow(Error)
    for (let seed = 0; seed < 2000; seed++) {
      const situation = generateSituation(seed)
      if (situation.shotB === 'net') expect(hitZoneOf(situation.playerBHit)).toBe('front')
    }
  })

  it('rejects mismatches between serve flag and shot', () => {
    const playerA = {x: 4, y: 10.6}
    const playerBHit = {x: 2, y: 4}
    const landing = {x: 4, y: NET_Y + 2.2}
    expect(() => buildSituation({playerA, playerBHit, shotB: 'serve-short', landing})).toThrow(Error)
    expect(() => buildSituation({playerA, playerBHit, shotB: 'clear-high', landing, isServe: true})).toThrow(Error)
    expect(buildSituation({playerA, playerBHit, shotB: 'serve-short', landing, isServe: true}).isServe).toBe(true)
  })
})

describe('buildSituation', () => {
  const playerBHit = {x: 3, y: 1}
  const landing = {x: 3, y: 12.8}

  it('advances the impact toward the net for high arrivals', () => {
    const situation = buildSituation({playerA: {x: 3.05, y: 10.6}, playerBHit, shotB: 'clear-high', landing})
    expect(situation.arrival).toBe('high')
    expect(situation.impact).toEqual({x: 3, y: 12.5})
  })

  it('keeps the impact at the landing otherwise', () => {
    const situation = buildSituation({playerA: {x: 3.05, y: 10.6}, playerBHit, shotB: 'smash', landing: {x: 3, y: 10}})
    expect(situation.impact).toEqual({x: 3, y: 10})
  })

  it('derives contact from the side of the impact', () => {
    const base = {playerA: {x: 3.05, y: 10.6}, playerBHit}
    expect(buildSituation({...base, shotB: 'smash', landing: {x: 4.5, y: 10}}).contact).toBe('coup-droit')
    expect(buildSituation({...base, shotB: 'smash', landing: {x: 1.5, y: 10}}).contact).toBe('revers')
    expect(buildSituation({...base, shotB: 'clear-high', landing: {x: 1.5, y: 12.8}}).contact).toBe('tour-de-tete')
  })
})
