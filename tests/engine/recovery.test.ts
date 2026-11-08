import {afterEach, describe, expect, it} from 'vitest'
import {distance} from '../../src/engine/court'
import {recoveredPosition} from '../../src/engine/recovery'
import {B_BASE, RECOVERY_MIN_FRACTION} from '../../src/engine/rules'
import {SHOTS} from '../../src/engine/shots'

describe('recoveredPosition', () => {
  it('biases B backwards after a clear and forwards after a net shot', () => {
    const hit = {x: 3, y: 1}
    expect(recoveredPosition(hit, 'clear-high', 'ligne').y).toBeLessThan(recoveredPosition({x: 3, y: 6}, 'net', 'ligne').y)
  })

  it('recovers less after a cross-court shot', () => {
    const hit = {x: 1, y: 1}
    const straight = recoveredPosition(hit, 'drop-fast', 'ligne')
    const cross = recoveredPosition(hit, 'drop-fast', 'croise')
    expect(distance(cross, hit)).toBeLessThan(distance(straight, hit))
  })

  it('reaches the base fully after a slow shot', () => {
    expect(recoveredPosition({x: 1, y: 1}, 'clear-high', 'ligne')).toEqual(B_BASE.back)
  })

  it('targets the neutral base after a smash', () => {
    const hit = {x: 3.05, y: 3.9}
    expect(recoveredPosition(hit, 'smash', 'ligne')).toEqual(B_BASE.neutral)
  })

  it('moves toward the back base after a clear and the front base after a net shot from the same point', () => {
    const hit = {x: 3.05, y: 3.9}
    expect(recoveredPosition(hit, 'clear-high', 'ligne').y).toBeLessThan(hit.y)
    expect(recoveredPosition(hit, 'clear-high', 'ligne')).toEqual(B_BASE.back)
    expect(recoveredPosition(hit, 'net', 'ligne').y).toBeGreaterThan(hit.y)
  })

  it('targets the front base after serve-short and block', () => {
    const hit = {x: 3.05, y: 1}
    const fullFraction = (shot: 'serve-short' | 'block') => (recoveredPosition(hit, shot, 'ligne').y - hit.y) / (B_BASE.front.y - hit.y)
    expect(fullFraction('serve-short')).toBeCloseTo(SHOTS['serve-short'].flightTime / 1.2, 10)
    expect(fullFraction('block')).toBeCloseTo(SHOTS.block.flightTime / 1.2, 10)
  })

  it('targets the back base after lob-defensive', () => {
    expect(recoveredPosition({x: 1, y: 6}, 'lob-defensive', 'ligne')).toEqual(B_BASE.back)
  })

  describe('with a very short flight', () => {
    const originalFlightTime = SHOTS.smash.flightTime

    afterEach(() => {
      SHOTS.smash.flightTime = originalFlightTime
    })

    it('covers at least the minimum fraction of the path', () => {
      SHOTS.smash.flightTime = 0.1
      const hit = {x: 3.05, y: 1}
      const recovered = recoveredPosition(hit, 'smash', 'ligne')
      expect(recovered.y).toBeCloseTo(hit.y + (B_BASE.neutral.y - hit.y) * RECOVERY_MIN_FRACTION, 10)
    })
  })
})
