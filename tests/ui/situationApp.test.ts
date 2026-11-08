// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {describeShotB} from '../../src/engine/explain'
import {generateSituation} from '../../src/engine/generator'
import {startApp} from '../../src/ui/app'

beforeEach(() => {
  vi.stubGlobal('localStorage', {getItem: () => null, setItem: () => undefined})
  vi.stubGlobal('matchMedia', () => ({matches: false}))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({fillRect: () => undefined} as unknown as CanvasRenderingContext2D)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
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

  it('writes the validated choice in the address bar and restores the reveal on reload', () => {
    const root = started('?seed=5&level=debutant')
    const svg = root.querySelector<SVGSVGElement>('svg.court')!
    svg.getScreenCTM = () => ({inverse: () => ({a: 1, b: 0, c: 0, d: 1, e: 0, f: 0})}) as unknown as DOMMatrix
    svg.setPointerCapture = () => undefined
    for (const type of ['pointerdown', 'pointerup']) svg.dispatchEvent(new MouseEvent(type, {bubbles: true, clientX: 3.123, clientY: 3.456}))
    root.querySelector<HTMLButtonElement>('.shot-popover .shot')!.click()
    root.querySelector<HTMLButtonElement>('.shot-popover .validate')!.click()
    const search = window.location.search
    expect(search).toMatch(/^\?seed=5&level=debutant&shot=[a-z-]+&x=3\.12&y=3\.46$/)
    const summary = root.querySelector('.reveal-drawer')!.textContent
    document.body.replaceChildren()
    const reloaded = started(search)
    expect(reloaded.querySelector<HTMLElement>('.reveal-drawer')!.hidden).toBe(false)
    expect(reloaded.querySelector('.reveal-drawer')!.textContent).toBe(summary)
    expect(window.location.search).toBe(search)
  })

  it('drops the choice from the address bar on a new situation', () => {
    const root = started('?seed=5&level=debutant&shot=lob-defensive&x=3&y=1')
    root.querySelector<HTMLButtonElement>('.controls .button')!.click()
    expect(window.location.search).toMatch(/^\?seed=\d+&level=debutant$/)
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
