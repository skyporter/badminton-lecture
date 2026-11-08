import {describe, expect, it} from 'vitest'
import {analyse} from '../../src/engine/analysis'
import {CENTER_X, depthFromNet, distance} from '../../src/engine/court'
import {B_BASE} from '../../src/engine/rules'
import {hitZoneOf} from '../../src/engine/shots'
import type {Level} from '../../src/engine/types'
import {F1, F2, F3, F4, F5, F6, F7} from './reference-situations'

const LEVELS: Level[] = ['debutant', 'intermediaire', 'avance']

describe('reference situations are what the table describes', () => {
  it('F1: attacking clear of B in line to the rear backhand side of A, A at base, attack', () => {
    expect(F1).toMatchObject({shotB: 'clear-attack', directionB: 'ligne', playerBHit: {x: 2.2, y: 2.0}, playerA: {x: 3.05, y: 10.6}, arrival: 'high', status: 'attaque'})
    expect(F1.landing.x).toBeLessThan(CENTER_X)
    expect(hitZoneOf(F1.landing)).toBe('rear')
  })

  it('F2: fast drop of B to the front forehand side of A, A late, defence', () => {
    expect(F2).toMatchObject({shotB: 'drop-fast', arrival: 'low', status: 'defense'})
    expect(F2.landing.x).toBeGreaterThan(CENTER_X)
    expect(hitZoneOf(F2.landing)).toBe('front')
    expect(F2.margin).toBeLessThan(0)
  })

  it('F3: net shot of B, A early at the net, neutral', () => {
    expect(F3).toMatchObject({shotB: 'net', arrival: 'low', status: 'neutre'})
    expect(hitZoneOf(F3.impact)).toBe('front')
    expect(distance(F3.playerA, F3.impact)).toBeLessThan(1)
  })

  it('F4: smash of B at the body of A, defence', () => {
    expect(F4).toMatchObject({shotB: 'smash', arrival: 'mid', status: 'defense'})
    expect(distance(F4.playerA, F4.impact)).toBeLessThan(0.6)
  })

  it('F5: short serve of B', () => {
    expect(F5).toMatchObject({shotB: 'serve-short', isServe: true, arrival: 'low', status: 'neutre'})
  })

  it('F6: long serve of B, A in time, attack', () => {
    expect(F6).toMatchObject({shotB: 'serve-long', isServe: true, arrival: 'high', status: 'attaque'})
    expect(hitZoneOf(F6.impact)).toBe('rear')
  })

  it('F7: cross-court clear of B from its rear backhand side, B badly recovered', () => {
    expect(F7).toMatchObject({shotB: 'clear-attack', directionB: 'croise'})
    expect(F7.playerBHit.x).toBeGreaterThan(CENTER_X)
    expect(hitZoneOf(F7.playerBHit)).toBe('rear')
    expect(distance(F7.playerBRecovered, B_BASE.back)).toBeGreaterThan(0.5)
  })
})

describe('F1: attacking clear to the rear backhand side of A, A in attack', () => {
  it('débutant: clears deep', () => {
    const {best} = analyse(F1, 'debutant')
    expect(['clear-high', 'clear-attack']).toContain(best.shot)
    expect(depthFromNet(best.point)).toBeGreaterThan(5)
  })

  it('intermédiaire: fast drop, smash or attacking clear', () => {
    expect(['drop-fast', 'smash', 'clear-attack']).toContain(analyse(F1, 'intermediaire').best.shot)
  })

  it('avancé: fast drop or smash, never a high clear', () => {
    const {best} = analyse(F1, 'avance')
    expect(['drop-fast', 'smash']).toContain(best.shot)
    expect(best.shot).not.toBe('clear-high')
  })

  it('changes the best answer with the level on at least one reference case', () => {
    const beginner = analyse(F1, 'debutant').best
    const advanced = analyse(F1, 'avance').best
    expect(beginner.shot !== advanced.shot || distance(beginner.point, advanced.point) >= 2).toBe(true)
  })
})

describe('F2: fast drop to the front forehand side of A, A in defence', () => {
  it('débutant: defensive lob to the back', () => {
    const {best} = analyse(F2, 'debutant')
    expect(best.shot).toBe('lob-defensive')
    expect(depthFromNet(best.point)).toBeGreaterThan(5)
  })

  it('intermédiaire: defensive lob or net', () => {
    expect(['lob-defensive', 'net']).toContain(analyse(F2, 'intermediaire').best.shot)
  })

  it('avancé: defensive lob or net, never smash nor attacking clear', () => {
    const {best} = analyse(F2, 'avance')
    expect(['lob-defensive', 'net']).toContain(best.shot)
    expect(['smash', 'clear-attack']).not.toContain(best.shot)
  })
})

describe('F3: net shot of B, A early at the net, neutral', () => {
  it('débutant: defensive lob', () => {
    expect(analyse(F3, 'debutant').best.shot).toBe('lob-defensive')
  })

  it('intermédiaire: net, attacking lob or defensive lob', () => {
    expect(['net', 'lob-attack', 'lob-defensive']).toContain(analyse(F3, 'intermediaire').best.shot)
  })

  it('avancé: net or attacking lob', () => {
    expect(['net', 'lob-attack']).toContain(analyse(F3, 'avance').best.shot)
  })
})

describe('F4: smash at the body of A, defence', () => {
  it.each(LEVELS)('%s: block or defensive lob', (level) => {
    expect(['block', 'lob-defensive']).toContain(analyse(F4, level).best.shot)
  })

  it('avancé: never smash', () => {
    expect(analyse(F4, 'avance').best.shot).not.toBe('smash')
  })
})

describe('F5: short serve of B', () => {
  it.each(['debutant', 'intermediaire'] as Level[])('%s: net, defensive lob or attacking lob', (level) => {
    expect(['net', 'lob-defensive', 'lob-attack']).toContain(analyse(F5, level).best.shot)
  })

  it('avancé: net or attacking lob', () => {
    expect(['net', 'lob-attack']).toContain(analyse(F5, 'avance').best.shot)
  })
})

describe('F6: long serve of B, A in time', () => {
  it('débutant: clears deep, like F1', () => {
    const {best} = analyse(F6, 'debutant')
    expect(['clear-high', 'clear-attack']).toContain(best.shot)
    expect(depthFromNet(best.point)).toBeGreaterThan(5)
  })

  it('intermédiaire: fast drop, attacking clear or smash', () => {
    expect(['drop-fast', 'clear-attack', 'smash']).toContain(analyse(F6, 'intermediaire').best.shot)
  })

  it('avancé: fast drop or smash', () => {
    expect(['drop-fast', 'smash']).toContain(analyse(F6, 'avance').best.shot)
  })
})

describe('F7: cross-court clear of B from its rear backhand side, B badly recovered', () => {
  it.each(LEVELS)('%s: best point at least 3 m from recovered B', (level) => {
    expect(distance(analyse(F7, level).best.point, F7.playerBRecovered)).toBeGreaterThanOrEqual(3)
  })
})
