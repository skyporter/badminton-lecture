// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {startApp} from '../../src/ui/app'

beforeEach(() => {
  vi.stubGlobal('localStorage', {getItem: () => null, setItem: () => undefined})
  vi.stubGlobal('matchMedia', () => ({matches: false}))
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  history.replaceState(null, '', '/')
})

function started(search: string): HTMLElement {
  history.replaceState(null, '', `/${search}`)
  const root = document.createElement('div')
  document.body.append(root)
  startApp(root)
  return root
}

describe('shareable situation url', () => {
  it('keeps the seed and level of the address bar', () => {
    started('?seed=123&level=avance')
    expect(window.location.search).toBe('?seed=123&level=avance')
  })

  it('writes a seed and the default level when the address bar has none', () => {
    started('?seed=-1&level=expert')
    expect(window.location.search).toMatch(/^\?seed=\d+&level=intermediaire$/)
  })

  it('replaces the seed when a new situation is requested', () => {
    const root = started('?seed=123&level=debutant')
    const historyLength = history.length
    root.querySelector<HTMLButtonElement>('.controls .button')!.click()
    expect(window.location.search).toMatch(/^\?seed=\d+&level=debutant$/)
    expect(window.location.search).not.toBe('?seed=123&level=debutant')
    expect(history.length).toBe(historyLength)
  })

  it('draws every stroke with a constant on-screen width', () => {
    const root = started('?seed=5&level=debutant')
    const strokes = [...root.querySelectorAll('svg.court [stroke-width]')]
    expect(strokes.length).toBeGreaterThan(10)
    strokes.forEach((stroke) => expect(stroke.getAttribute('vector-effect')).toBe('non-scaling-stroke'))
  })
})
