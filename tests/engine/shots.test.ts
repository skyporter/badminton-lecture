import {describe, expect, it} from 'vitest'
import {NET_Y} from '../../src/engine/court'
import {RETURN_SHOTS, SHOTS, hitZoneOf} from '../../src/engine/shots'
import type {ShotId} from '../../src/engine/shots'
import {
  ALLOWED_BY_STATUS,
  RULE_SOURCES,
  SHOT_PRESSURE,
  SHOT_RECOVERY,
  SHOT_RISK,
  SOURCES,
  WEIGHTS,
} from '../../src/engine/rules'

const shotIds = Object.keys(SHOTS) as ShotId[]

describe('shot catalogue', () => {
  it('defines every shot of the spec catalogue', () => {
    expect(Object.keys(SHOTS)).toHaveLength(12)
    expect(RETURN_SHOTS).not.toContain('serve-short')
    expect(RETURN_SHOTS).not.toContain('serve-long')
    expect(RETURN_SHOTS).toHaveLength(10)
  })

  it('keeps each shot id equal to its key', () => {
    for (const shotId of shotIds) expect(SHOTS[shotId].id).toBe(shotId)
  })

  it('classifies a point by its depth from the net', () => {
    expect(hitZoneOf({x: 3, y: NET_Y - 5})).toBe('rear')
    expect(hitZoneOf({x: 3, y: NET_Y + 3})).toBe('mid')
    expect(hitZoneOf({x: 3, y: NET_Y + 1})).toBe('front')
    expect(hitZoneOf({x: 3, y: NET_Y + 4.5})).toBe('mid')
    expect(hitZoneOf({x: 3, y: NET_Y + 2.2})).toBe('front')
    expect(hitZoneOf({x: 3, y: NET_Y + 2.4})).toBe('mid')
  })
})

describe('rules', () => {
  it('keeps weights summing to 1 for every level', () => {
    for (const level of ['debutant', 'intermediaire', 'avance'] as const)
      expect(Object.values(WEIGHTS[level]).reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1)
  })

  it('never allows a smash on a low arrival', () => {
    for (const status of ['attaque', 'neutre', 'defense'] as const)
      expect(ALLOWED_BY_STATUS[status].low).not.toContain('smash')
  })

  it('only allows catalogue shots', () => {
    for (const status of ['attaque', 'neutre', 'defense'] as const)
      for (const arrival of ['high', 'mid', 'low'] as const)
        for (const shotId of ALLOWED_BY_STATUS[status][arrival]) expect(shotIds).toContain(shotId)
  })

  it('keeps shot risk, recovery and pressure within [0, 1] for every shot', () => {
    for (const table of [SHOT_RISK, SHOT_RECOVERY, SHOT_PRESSURE])
      for (const shotId of shotIds) {
        expect(table[shotId]).toBeGreaterThanOrEqual(0)
        expect(table[shotId]).toBeLessThanOrEqual(1)
      }
  })

  it('links every rule table to a known source', () => {
    const tableNames = ['WEIGHTS', 'SHOT_RISK', 'SHOT_RECOVERY', 'SHOT_PRESSURE', 'ALLOWED_BY_STATUS', 'B_BASE', 'ATTACK_MARGIN', 'NEUTRAL_MARGIN_BY_ARRIVAL', 'RECOVERY_BASE_BY_SHOT']
    for (const tableName of tableNames) {
      expect(RULE_SOURCES[tableName].length).toBeGreaterThan(0)
      for (const sourceKey of RULE_SOURCES[tableName]) expect(SOURCES).toHaveProperty(sourceKey)
    }
  })
})
