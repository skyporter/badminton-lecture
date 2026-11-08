import {describe, expect, it} from 'vitest'
import {statusFor, timeMargin} from '../../src/engine/status'
import {PLAYER_SPEED, REACTION_TIME} from '../../src/engine/rules'
import {SHOTS} from '../../src/engine/shots'

describe('timeMargin', () => {
  it('is the flight time minus reaction and running time', () => {
    const playerA = {x: 3, y: 10}
    const impact = {x: 3, y: 8}
    expect(timeMargin(playerA, impact, 'clear-high')).toBeCloseTo(SHOTS['clear-high'].flightTime - (REACTION_TIME + 2 / PLAYER_SPEED), 10)
  })
})

describe('statusFor', () => {
  it('gives attack when a high shuttle is reached early', () => expect(statusFor('high', 0.5)).toBe('attaque'))
  it('gives neutral when a high shuttle is reached just in time', () => expect(statusFor('high', 0.1)).toBe('neutre'))
  it('gives defence when a high shuttle is reached late', () => expect(statusFor('high', -0.1)).toBe('defense'))
  it('gives neutral when a mid shuttle is reached with enough margin', () => expect(statusFor('mid', 0.2)).toBe('neutre'))
  it('gives defence when a mid shuttle is reached with little margin', () => expect(statusFor('mid', 0.1)).toBe('defense'))
  it('gives defence when a low shuttle is reached late', () => expect(statusFor('low', 0.1)).toBe('defense'))
  it('gives neutral when a low shuttle is reached with enough margin', () => expect(statusFor('low', 0.4)).toBe('neutre'))
  it('gives attack exactly at the attack margin', () => expect(statusFor('high', 0.3)).toBe('attaque'))
  it('gives neutral exactly at zero margin on a high shuttle', () => expect(statusFor('high', 0)).toBe('neutre'))
})
