import {describe, expect, it} from 'vitest'
import {trajectoryPath, trajectoryStyle} from '../../src/ui/trajectory'

describe('trajectoryStyle', () => {
  it('draws a smash solid and straight', () => expect(trajectoryStyle('smash')).toEqual({dashArray: '', curvature: 0}))
  it('draws a high clear dotted and strongly curved', () => expect(trajectoryStyle('clear-high')).toEqual({dashArray: '0.06 0.3', curvature: 0.2}))
  it('draws an attacking lob with long dashes and a slight curve', () => expect(trajectoryStyle('lob-attack')).toEqual({dashArray: '0.4 0.1', curvature: 0.08}))
  it('draws a medium speed shot with even dashes', () => expect(trajectoryStyle('drop-slow').dashArray).toBe('0.2 0.2'))
})

describe('trajectoryPath', () => {
  it('uses a straight quadratic for flat shots', () => expect(trajectoryPath({x: 1, y: 12}, {x: 1, y: 2}, 'drive')).toBe('M 1 12 Q 1 7 1 2'))
  it('offsets the control point to the left of the travel direction for a curved shot', () => {
    expect(trajectoryPath({x: 1, y: 12}, {x: 1, y: 2}, 'clear-high')).toBe('M 1 12 Q -1 7 1 2')
  })
  it('keeps the same side when travelling the other way', () => {
    expect(trajectoryPath({x: 1, y: 2}, {x: 1, y: 12}, 'clear-high')).toBe('M 1 2 Q 3 7 1 12')
  })
})
