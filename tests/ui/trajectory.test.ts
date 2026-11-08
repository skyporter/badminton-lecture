import {describe, expect, it} from 'vitest'
import {trajectoryCurvature, trajectoryMiddle, trajectoryPath} from '../../src/ui/trajectory'

describe('trajectoryCurvature', () => {
  it('draws a smash straight', () => expect(trajectoryCurvature('smash')).toBe(0))
  it('curves a high clear strongly', () => expect(trajectoryCurvature('clear-high')).toBe(0.2))
  it('curves an attacking lob slightly', () => expect(trajectoryCurvature('lob-attack')).toBe(0.08))
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

describe('trajectoryMiddle', () => {
  it('is the middle of a straight trajectory', () => {
    expect(trajectoryMiddle({x: 1, y: 10}, {x: 3, y: 2}, 'smash')).toEqual({x: 2, y: 6})
  })

  it('follows the curve of a high trajectory', () => {
    const middle = trajectoryMiddle({x: 1, y: 10}, {x: 1, y: 2}, 'clear-high')
    expect(middle.y).toBeCloseTo(6)
    expect(middle.x).not.toBeCloseTo(1)
  })
})
