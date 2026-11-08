// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {scoreChoice} from '../../src/engine/analysis'
import {describeShotB} from '../../src/engine/explain'
import {generateSituation} from '../../src/engine/generator'
import {startApp} from '../../src/ui/app'
import {BANNER_RESERVED_METRES, renderCourt} from '../../src/ui/courtView'
import {trajectoryPath, trajectoryStyle} from '../../src/ui/trajectory'

const SEED = 5

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

function startedApp(): HTMLElement {
  history.replaceState(null, '', `/?seed=${SEED}&level=debutant`)
  const root = document.createElement('div')
  document.body.append(root)
  startApp(root)
  const svg = root.querySelector<SVGSVGElement>('svg.court')!
  svg.getScreenCTM = () => ({inverse: () => ({a: 1, b: 0, c: 0, d: 1, e: 0, f: 0})}) as unknown as DOMMatrix
  svg.setPointerCapture = () => undefined
  return root
}

function press(target: Element, clientX: number, clientY: number): void {
  target.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true, clientX, clientY}))
  target.dispatchEvent(new MouseEvent('pointerup', {bubbles: true, clientX, clientY}))
}

function popover(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>('.shot-popover')!
}

function drawer(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>('.reveal-drawer')!
}

function answered(root: HTMLElement): HTMLElement {
  press(root.querySelector('svg.court')!, 3, 3)
  popover(root).querySelector<HTMLButtonElement>('.shot')!.click()
  return root
}

function revealed(root: HTMLElement): HTMLElement {
  answered(root)
  popover(root).querySelector<HTMLButtonElement>('.validate')!.click()
  return root
}

describe('on-court layout', () => {
  it('has no side panel anymore', () => {
    const root = startedApp()
    expect(root.querySelector('.panel')).toBeNull()
    expect(revealed(root).querySelector('.panel')).toBeNull()
  })

  it('shows the shot banner of B in both phases', () => {
    const root = startedApp()
    const expected = describeShotB(generateSituation(SEED))
    expect(root.querySelector('.court-frame .shot-banner .banner-shot')!.textContent).toBe(expected)
    revealed(root)
    expect(root.querySelector('.court-frame .shot-banner .banner-shot')!.textContent).toBe(expected)
  })
})

describe('shot popover', () => {
  it('is closed before a target is placed', () => {
    expect(popover(startedApp()).hidden).toBe(true)
  })

  it('opens when the court is pressed, with the three shot groups and a disabled « Valider »', () => {
    const root = startedApp()
    press(root.querySelector('svg.court')!, 3, 3)
    expect(popover(root).hidden).toBe(false)
    expect(popover(root).querySelectorAll('.shot-group')).toHaveLength(3)
    expect(popover(root).querySelector<HTMLButtonElement>('.validate')!.disabled).toBe(true)
  })

  it('enables « Valider » once a shot is chosen', () => {
    const root = answered(startedApp())
    expect(popover(root).querySelector<HTMLButtonElement>('.validate')!.disabled).toBe(false)
  })

  it('closes with the close button and with Escape, keeping the cross', () => {
    const root = answered(startedApp())
    const board = root.querySelector('svg.court')!.innerHTML
    popover(root).querySelector<HTMLButtonElement>('.popover-close')!.click()
    expect(popover(root).hidden).toBe(true)
    expect(root.querySelector('svg.court')!.innerHTML).toBe(board)

    press(root.querySelector('svg.court')!, 3, 3)
    expect(popover(root).hidden).toBe(false)
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))
    expect(popover(root).hidden).toBe(true)
  })

  it('closes on validation and reveals the result', () => {
    const root = revealed(startedApp())
    expect(popover(root).hidden).toBe(true)
    expect(drawer(root).hidden).toBe(false)
  })
})

describe('pointer events on overlays', () => {
  it('do not set a target inside the popover, the banner or the drawer', () => {
    const root = answered(startedApp())
    const svg = root.querySelector('svg.court')!
    const board = svg.innerHTML
    ;[popover(root), root.querySelector('.shot-banner')!].forEach((overlay) => press(overlay, 1, 1))
    expect(svg.innerHTML).toBe(board)

    popover(root).querySelector<HTMLButtonElement>('.validate')!.click()
    const revealedBoard = svg.innerHTML
    press(drawer(root), 1, 1)
    expect(svg.innerHTML).toBe(revealedBoard)
  })
})

describe('reveal drawer', () => {
  it('is hidden before the reveal', () => {
    expect(drawer(startedApp()).hidden).toBe(true)
  })

  it('starts collapsed with the score on its one line', () => {
    const root = revealed(startedApp())
    const situation = generateSituation(SEED)
    const result = scoreChoice(situation, 'debutant', {x: 3, y: 3}, 'drop-slow')
    expect(drawer(root).classList.contains('expanded')).toBe(false)
    expect(drawer(root).querySelector('.drawer-summary')!.textContent).toContain(`Score : ${result.score} / 100`)
    expect(drawer(root).querySelector('.drawer-body')).toBeNull()
  })

  it('expands and collapses with its toggle', () => {
    const root = revealed(startedApp())
    drawer(root).querySelector<HTMLButtonElement>('.drawer-toggle')!.click()
    expect(drawer(root).classList.contains('expanded')).toBe(true)
    expect(drawer(root).querySelector('.drawer-body')!.textContent).toContain('Pourquoi')
    drawer(root).querySelector<HTMLButtonElement>('.drawer-toggle')!.click()
    expect(drawer(root).classList.contains('expanded')).toBe(false)
  })

  it('keeps its state when the level changes after the reveal', () => {
    const root = revealed(startedApp())
    drawer(root).querySelector<HTMLButtonElement>('.drawer-toggle')!.click()
    const levelSelect = root.querySelector<HTMLSelectElement>('.controls .level')!
    levelSelect.value = 'avance'
    levelSelect.dispatchEvent(new Event('change'))
    expect(drawer(root).classList.contains('expanded')).toBe(true)
  })

  it('stacks the legend above the drawer', () => {
    const root = revealed(startedApp())
    const stack = root.querySelector('.court-frame .bottom-stack')!
    expect([...stack.children].map((child) => child.className)).toEqual(['legend-overlay', 'reveal-drawer'])
  })
})

describe('banner reservation', () => {
  it('keeps B back line and at least 0.4 m of out zone below the banner', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    renderCourt(svg)
    const viewBox = svg.viewBox.baseVal
    expect(-viewBox.y).toBeGreaterThanOrEqual(BANNER_RESERVED_METRES + 0.4)
  })

  it('sizes the banner to the reserved strip', () => {
    const root = startedApp()
    const viewBox = root.querySelector<SVGSVGElement>('svg.court')!.viewBox.baseVal
    expect(parseFloat(root.querySelector<HTMLElement>('.shot-banner')!.style.height)).toBeCloseTo((100 * BANNER_RESERVED_METRES) / viewBox.height, 4)
  })

  it('adds the instruction line only in the question phase', () => {
    const root = startedApp()
    expect(root.querySelector('.shot-banner .banner-hint')!.textContent).toBe('Clique sur le terrain de B pour choisir ton retour.')
    revealed(root)
    expect(root.querySelector('.shot-banner .banner-hint')).toBeNull()
  })
})

describe('racket orientation', () => {
  it('draws B racket on the -x side of B and A racket on the +x side of A', () => {
    const root = startedApp()
    const situation = generateSituation(SEED)
    const [playerBGroup, playerAGroup] = [...root.querySelectorAll('svg.court > g')].pop()!.children
    const handleX = (group: Element) => Number(group.querySelector('g line')!.getAttribute('x1'))
    expect(handleX(playerBGroup)).toBeLessThan(situation.playerBHit.x)
    expect(handleX(playerAGroup)).toBeGreaterThan(situation.playerA.x)
  })
})

describe('alternative wording', () => {
  it('starts the alternative line with « Alternative : » and never mentions light green', () => {
    const root = revealed(startedApp())
    drawer(root).querySelector<HTMLButtonElement>('.drawer-toggle')!.click()
    const text = drawer(root).querySelector('.alternative')!.textContent!
    expect(text.startsWith('Alternative : ')).toBe(true)
    expect(text).not.toContain('vert clair')
  })
})

describe('best return trajectory', () => {
  it('follows the trajectory code of the best shot', () => {
    const root = revealed(startedApp())
    const {best} = scoreChoice(generateSituation(SEED), 'debutant', {x: 3, y: 3}, 'clear-attack').analysis
    const path = root.querySelector<SVGPathElement>('svg.court path[stroke="#ffffff"]')!
    const situation = generateSituation(SEED)
    expect(path.getAttribute('d')).toBe(trajectoryPath(situation.impact, best.point, best.shot))
    expect(path.getAttribute('stroke-dasharray') ?? '').toBe(trajectoryStyle(best.shot).dashArray)
  })
})
