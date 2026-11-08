import type {Point} from '../engine/types'

export interface CourtInputHandlers {
  onPreview: (point: Point | null) => void
  onTarget: (point: Point) => void
}

export function clientToCourt(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const {a, b, c, d, e, f} = svg.getScreenCTM()!.inverse()
  return {x: a * clientX + c * clientY + e, y: b * clientX + d * clientY + f}
}

export function listenToCourt(svg: SVGSVGElement, handlers: CourtInputHandlers): void {
  let pressed = false

  svg.addEventListener('pointerdown', (event) => {
    pressed = true
    svg.setPointerCapture(event.pointerId)
    handlers.onPreview(clientToCourt(svg, event.clientX, event.clientY))
  })
  svg.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' || pressed) {
      handlers.onPreview(clientToCourt(svg, event.clientX, event.clientY))
    }
  })
  svg.addEventListener('pointerup', (event) => {
    if (pressed) {
      handlers.onTarget(clientToCourt(svg, event.clientX, event.clientY))
    }
    pressed = false
    if (event.pointerType !== 'mouse') {
      handlers.onPreview(null)
    }
  })
  svg.addEventListener('pointercancel', () => {
    pressed = false
    handlers.onPreview(null)
  })
  svg.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse' && !pressed) {
      handlers.onPreview(null)
    }
  })
}
