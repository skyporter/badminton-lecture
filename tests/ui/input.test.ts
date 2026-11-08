// @vitest-environment jsdom
import {describe, expect, it} from 'vitest'
import {clientToCourt} from '../../src/ui/input'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

function svgDisplayedAt(scale: number, offsetX: number, offsetY: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg') as SVGSVGElement
  const screenMatrix = {a: scale, b: 0, c: 0, d: scale, e: offsetX, f: offsetY}
  const inverseMatrix = {a: 1 / scale, b: 0, c: 0, d: 1 / scale, e: -offsetX / scale, f: -offsetY / scale}
  svg.getScreenCTM = () => ({...screenMatrix, inverse: () => inverseMatrix}) as unknown as DOMMatrix
  return svg
}

function screenPosition(scale: number, offsetX: number, offsetY: number, x: number, y: number): [number, number] {
  return [scale * x + offsetX, scale * y + offsetY]
}

describe('clientToCourt', () => {
  it('converts client coordinates through the current transform (Review Focus 5)', () => {
    const courtPoint = {x: 4.2, y: 1.3}
    const portrait = svgDisplayedAt(50, 10, 30)
    const landscape = svgDisplayedAt(22, 300, 4)
    const portraitResult = clientToCourt(portrait, ...screenPosition(50, 10, 30, courtPoint.x, courtPoint.y))
    const landscapeResult = clientToCourt(landscape, ...screenPosition(22, 300, 4, courtPoint.x, courtPoint.y))
    expect(portraitResult.x).toBeCloseTo(courtPoint.x, 9)
    expect(portraitResult.y).toBeCloseTo(courtPoint.y, 9)
    expect(landscapeResult.x).toBeCloseTo(courtPoint.x, 9)
    expect(landscapeResult.y).toBeCloseTo(courtPoint.y, 9)
  })

  it('reads the transform at each call, so a resize after placing the cross is taken into account', () => {
    const svg = svgDisplayedAt(50, 0, 0)
    expect(clientToCourt(svg, 100, 100)).toEqual({x: 2, y: 2})
    const resized = svgDisplayedAt(25, 0, 0)
    svg.getScreenCTM = resized.getScreenCTM
    expect(clientToCourt(svg, 100, 100)).toEqual({x: 4, y: 4})
  })
})
