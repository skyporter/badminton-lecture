import {describe, expect, it} from 'vitest'
import {createRng, pick, randomBetween} from '../../src/engine/rng'

describe('createRng', () => {
  it('is reproducible for a seed', () => {
    const first = createRng(42), second = createRng(42)
    expect([first(), first(), first()]).toEqual([second(), second(), second()])
  })

  it('differs between seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)())
  })

  it('stays within [0, 1[', () => {
    const rng = createRng(7)
    for (let index = 0; index < 1000; index++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('randomBetween', () => {
  it('stays within the bounds', () => {
    const rng = createRng(3)
    for (let index = 0; index < 1000; index++) {
      const value = randomBetween(rng, 2, 5)
      expect(value).toBeGreaterThanOrEqual(2)
      expect(value).toBeLessThan(5)
    }
  })
})

describe('pick', () => {
  it('returns an item of the list and reaches every item', () => {
    const rng = createRng(9)
    const items = ['a', 'b', 'c'] as const
    const seen = new Set<string>()
    for (let index = 0; index < 200; index++) {
      seen.add(pick(rng, items))
    }
    expect([...seen].sort()).toEqual(['a', 'b', 'c'])
  })
})
