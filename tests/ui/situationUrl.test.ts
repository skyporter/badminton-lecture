import {describe, expect, it} from 'vitest'
import {readSituationParams, situationSearch} from '../../src/ui/situationUrl'

describe('readSituationParams', () => {
  it('reads a valid seed and level', () => expect(readSituationParams('?seed=42&level=avance')).toEqual({seed: 42, level: 'avance', choice: null}))
  it('accepts zero as a seed', () => expect(readSituationParams('?seed=0&level=debutant').seed).toBe(0))
  it('returns nulls when both are missing', () => expect(readSituationParams('')).toEqual({seed: null, level: null, choice: null}))
  it('rejects a negative seed', () => expect(readSituationParams('?seed=-3&level=avance').seed).toBeNull())
  it('rejects a non-integer seed', () => {
    expect(readSituationParams('?seed=1.5').seed).toBeNull()
    expect(readSituationParams('?seed=abc').seed).toBeNull()
    expect(readSituationParams('?seed=').seed).toBeNull()
  })
  it('rejects an unknown level', () => expect(readSituationParams('?seed=5&level=expert')).toEqual({seed: 5, level: null, choice: null}))
})

describe('situationSearch', () => {
  it('writes the seed and level', () => expect(situationSearch(42, 'intermediaire')).toBe('?seed=42&level=intermediaire'))
  it('round-trips through readSituationParams', () => expect(readSituationParams(situationSearch(7, 'debutant'))).toEqual({seed: 7, level: 'debutant', choice: null}))
})

describe('choice in the url', () => {
  it('reads the validated choice', () => {
    expect(readSituationParams('?seed=5&level=avance&shot=smash&x=3.12&y=1.05').choice).toEqual({point: {x: 3.12, y: 1.05}, shot: 'smash'})
  })

  it('ignores an unknown shot, a serve or a missing or non-numeric coordinate', () => {
    expect(readSituationParams('?seed=5&shot=bazooka&x=3&y=1').choice).toBeNull()
    expect(readSituationParams('?seed=5&shot=serve-long&x=3&y=1').choice).toBeNull()
    expect(readSituationParams('?seed=5&shot=smash&x=3').choice).toBeNull()
    expect(readSituationParams('?seed=5&shot=smash&x=abc&y=1').choice).toBeNull()
  })

  it('writes the choice to the centimetre and round-trips', () => {
    const choice = {point: {x: 3.12, y: 1.05}, shot: 'smash' as const}
    expect(situationSearch(5, 'avance', choice)).toBe('?seed=5&level=avance&shot=smash&x=3.12&y=1.05')
    expect(readSituationParams(situationSearch(5, 'avance', choice)).choice).toEqual(choice)
  })
})
