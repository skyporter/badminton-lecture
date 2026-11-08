import {describe, expect, it} from 'vitest'
import {readSituationParams, situationSearch} from '../../src/ui/situationUrl'

describe('readSituationParams', () => {
  it('reads a valid seed and level', () => expect(readSituationParams('?seed=42&level=avance')).toEqual({seed: 42, level: 'avance'}))
  it('accepts zero as a seed', () => expect(readSituationParams('?seed=0&level=debutant').seed).toBe(0))
  it('returns nulls when both are missing', () => expect(readSituationParams('')).toEqual({seed: null, level: null}))
  it('rejects a negative seed', () => expect(readSituationParams('?seed=-3&level=avance').seed).toBeNull())
  it('rejects a non-integer seed', () => {
    expect(readSituationParams('?seed=1.5').seed).toBeNull()
    expect(readSituationParams('?seed=abc').seed).toBeNull()
    expect(readSituationParams('?seed=').seed).toBeNull()
  })
  it('rejects an unknown level', () => expect(readSituationParams('?seed=5&level=expert')).toEqual({seed: 5, level: null}))
})

describe('situationSearch', () => {
  it('writes the seed and level', () => expect(situationSearch(42, 'intermediaire')).toBe('?seed=42&level=intermediaire'))
  it('round-trips through readSituationParams', () => expect(readSituationParams(situationSearch(7, 'debutant'))).toEqual({seed: 7, level: 'debutant'}))
})
