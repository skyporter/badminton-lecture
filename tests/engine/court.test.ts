import {describe, expect, it} from 'vitest'
import {
  CENTER_X,
  COURT_LENGTH,
  COURT_WIDTH,
  DOUBLES_LONG_SERVICE_INSET,
  NET_Y,
  SHORT_SERVICE_DISTANCE,
  SINGLES_LEFT,
  SINGLES_RIGHT,
  depthFromNet,
  directionBetween,
  distance,
  forehandIsPositiveX,
  isInSinglesHalf,
  pointAtDepth,
} from '../../src/engine/court'

describe('court constants', () => {
  it('uses official badminton dimensions', () => {
    expect(COURT_LENGTH).toBe(13.4)
    expect(COURT_WIDTH).toBe(6.1)
    expect(NET_Y).toBe(6.7)
    expect(SINGLES_LEFT).toBe(0.46)
    expect(SINGLES_RIGHT).toBe(5.64)
    expect(SHORT_SERVICE_DISTANCE).toBe(1.98)
    expect(DOUBLES_LONG_SERVICE_INSET).toBe(0.76)
    expect(CENTER_X).toBe(3.05)
  })
})

describe('isInSinglesHalf', () => {
  it('treats singles lines as in', () => {
    expect(isInSinglesHalf({x: 0.46, y: 0}, 'B')).toBe(true)
    expect(isInSinglesHalf({x: 0.40, y: 3}, 'B')).toBe(false)
    expect(isInSinglesHalf({x: 3, y: 7}, 'B')).toBe(false)
    expect(isInSinglesHalf({x: 3, y: 13.4}, 'A')).toBe(true)
  })

  it('rejects points beyond the baseline and the right tramline', () => {
    expect(isInSinglesHalf({x: 3, y: -0.1}, 'B')).toBe(false)
    expect(isInSinglesHalf({x: 3, y: 13.5}, 'A')).toBe(false)
    expect(isInSinglesHalf({x: 5.64, y: 10}, 'A')).toBe(true)
    expect(isInSinglesHalf({x: 5.7, y: 10}, 'A')).toBe(false)
  })

  it('includes the net line for both sides', () => {
    expect(isInSinglesHalf({x: 3, y: 6.7}, 'A')).toBe(true)
    expect(isInSinglesHalf({x: 3, y: 6.7}, 'B')).toBe(true)
  })
})

describe('depthFromNet', () => {
  it('measures depth from the net on both sides', () => {
    expect(depthFromNet({x: 3, y: 0})).toBeCloseTo(6.7)
    expect(depthFromNet({x: 3, y: 8.68})).toBeCloseTo(1.98)
    expect(depthFromNet({x: 3, y: 13.4})).toBeCloseTo(6.7)
  })
})

describe('pointAtDepth', () => {
  it('places points on each side of the net', () => {
    expect(pointAtDepth('B', 2, 3)).toEqual({x: 3, y: 4.7})
    expect(pointAtDepth('A', 2, 3).y).toBeCloseTo(8.7)
    expect(pointAtDepth('A', 2, 3).x).toBe(3)
  })

  it('is the inverse of depthFromNet', () => {
    expect(depthFromNet(pointAtDepth('A', 4.2, 1))).toBeCloseTo(4.2)
    expect(depthFromNet(pointAtDepth('B', 4.2, 1))).toBeCloseTo(4.2)
  })
})

describe('forehandIsPositiveX', () => {
  it('places forehands for right-handers facing each other', () => {
    expect(forehandIsPositiveX('A')).toBe(true)
    expect(forehandIsPositiveX('B')).toBe(false)
  })
})

describe('distance', () => {
  it('computes the euclidean distance', () => {
    expect(distance({x: 0, y: 0}, {x: 3, y: 4})).toBe(5)
  })
})

describe('directionBetween', () => {
  it('calls a shot cross-court beyond 2 m of lateral change', () => {
    expect(directionBetween({x: 1, y: 12}, {x: 1.5, y: 2})).toBe('ligne')
    expect(directionBetween({x: 1, y: 12}, {x: 4.5, y: 2})).toBe('croise')
  })

  it('keeps exactly 2 m as a line shot and ignores the direction of travel', () => {
    expect(directionBetween({x: 1, y: 12}, {x: 3, y: 2})).toBe('ligne')
    expect(directionBetween({x: 4.5, y: 12}, {x: 1, y: 2})).toBe('croise')
  })
})
