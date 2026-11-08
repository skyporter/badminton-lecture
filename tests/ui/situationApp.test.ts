// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {describeShotB} from '../../src/engine/explain'
import {generateSituation} from '../../src/engine/generator'
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

  it('adds a history entry when a new situation is requested', () => {
    const root = started('?seed=123&level=debutant')
    const historyLength = history.length
    root.querySelector<HTMLButtonElement>('.controls .button')!.click()
    expect(window.location.search).toMatch(/^\?seed=\d+&level=debutant$/)
    expect(window.location.search).not.toBe('?seed=123&level=debutant')
    expect(history.length).toBe(historyLength + 1)
  })

  it('keeps one history entry when the level changes', () => {
    const root = started('?seed=123&level=debutant')
    const historyLength = history.length
    const select = root.querySelector<HTMLSelectElement>('.controls select')!
    select.value = 'avance'
    select.dispatchEvent(new Event('change'))
    expect(window.location.search).toBe('?seed=123&level=avance')
    expect(history.length).toBe(historyLength)
  })

  it('shows the situation of the address bar when navigating back or forward', () => {
    const root = started('?seed=123&level=debutant')
    root.querySelector<HTMLButtonElement>('.controls .button')!.click()
    history.replaceState(null, '', '/?seed=123&level=avance')
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(root.querySelector('.banner-shot')!.textContent).toBe(describeShotB(generateSituation(123)))
    expect(root.querySelector<HTMLSelectElement>('.controls select')!.value).toBe('avance')
    expect(window.location.search).toBe('?seed=123&level=avance')
  })

  it('draws every stroke with a constant on-screen width', () => {
    const root = started('?seed=5&level=debutant')
    const strokes = [...root.querySelectorAll('svg.court [stroke-width]')]
    expect(strokes.length).toBeGreaterThan(10)
    strokes.forEach((stroke) => expect(stroke.getAttribute('vector-effect')).toBe('non-scaling-stroke'))
  })
})
