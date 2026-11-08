import {describe, expect, it} from 'vitest'
import {distance} from '../../src/engine/court'
import {recoveredPosition} from '../../src/engine/recovery'
import {B_BASE} from '../../src/engine/rules'

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
})
