// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {startApp} from '../../src/ui/app'

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'clear'> {
  const entries = new Map<string, string>()
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, value),
    clear: () => entries.clear(),
  }
}

function startedApp(): HTMLElement {
  const root = document.createElement('div')
  document.body.append(root)
  startApp(root)
  return root
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  vi.stubGlobal('matchMedia', () => ({matches: false}))
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('legend overlay', () => {
  it('lives inside the court frame', () => {
    const root = startedApp()
    const courtFrame = root.querySelector('.court-frame')!
    expect(courtFrame.contains(root.querySelector('.legend'))).toBe(true)
    expect(courtFrame.contains(root.querySelector('.legend-toggle'))).toBe(true)
  })

  it('does not change the court frame size when toggled', () => {
    const root = startedApp()
    const courtFrame = root.querySelector<HTMLElement>('.court-frame')!
    const layout = root.querySelector('.layout')!
    const legend = root.querySelector<HTMLElement>('.legend')!
    const toggle = root.querySelector<HTMLElement>('.legend-toggle')!
    const styleBefore = courtFrame.getAttribute('style')
    const frameClassBefore = courtFrame.className
    const layoutClassBefore = layout.className
    expect(legend.hidden).toBe(false)

    toggle.click()
    expect(legend.hidden).toBe(true)
    expect(courtFrame.getAttribute('style')).toBe(styleBefore)
    expect(courtFrame.className).toBe(frameClassBefore)
    expect(layout.className).toBe(layoutClassBefore)

    toggle.click()
    expect(legend.hidden).toBe(false)
    expect(courtFrame.getAttribute('style')).toBe(styleBefore)
    expect(courtFrame.className).toBe(frameClassBefore)
    expect(layout.className).toBe(layoutClassBefore)
  })

  it('does not set a target when the legend box or button is pressed', () => {
    const root = startedApp()
    const svg = root.querySelector('svg.court')!
    const legend = root.querySelector('.legend')!
    const toggle = root.querySelector('.legend-toggle')!
    const boardBefore = svg.innerHTML
    const popover = root.querySelector<HTMLElement>('.shot-popover')!

    ;[legend, toggle].forEach((pressed) => {
      pressed.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true, clientX: 50, clientY: 50}))
      pressed.dispatchEvent(new MouseEvent('pointerup', {bubbles: true, clientX: 50, clientY: 50}))
    })

    expect(svg.innerHTML).toBe(boardBefore)
    expect(popover.hidden).toBe(true)
  })

  it('does set a target when the court itself is pressed', () => {
    const root = startedApp()
    const svg = root.querySelector<SVGSVGElement>('svg.court')!
    svg.getScreenCTM = () => ({inverse: () => ({a: 1, b: 0, c: 0, d: 1, e: 0, f: 0})}) as unknown as DOMMatrix
    svg.setPointerCapture = () => undefined
    const boardBefore = svg.innerHTML

    svg.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true, clientX: 3, clientY: 3}))
    svg.dispatchEvent(new MouseEvent('pointerup', {bubbles: true, clientX: 3, clientY: 3}))

    expect(svg.innerHTML).not.toBe(boardBefore)
  })
})
