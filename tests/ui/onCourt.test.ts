// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {scoreChoice} from '../../src/engine/analysis'
import {SHOT_DESCRIPTIONS, describeReturn, describeShotB} from '../../src/engine/explain'
import {RETURN_SHOTS, SHOTS} from '../../src/engine/shots'
import {generateSituation} from '../../src/engine/generator'
import {startApp} from '../../src/ui/app'
import {BANNER_RESERVED_METRES, renderCourt} from '../../src/ui/courtView'
import {BEST_RETURN_COLOR, RETURN_COLOR, UNREACHABLE_COLOR, trajectoryMiddle, trajectoryPath, trajectoryStyle} from '../../src/ui/trajectory'
import {reachableLanding} from '../../src/engine/evaluate'

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
  it('explains each shot in a tooltip', () => {
    const root = startedApp()
    press(root.querySelector('svg.court')!, 3, 3)
    const buttons = [...popover(root).querySelectorAll<HTMLButtonElement>('.shot')]
    expect(buttons).toHaveLength(RETURN_SHOTS.length)
    buttons.forEach((button) => {
      const shot = RETURN_SHOTS.find((candidate) => SHOTS[candidate].label === button.textContent)!
      expect(button.title).toBe(SHOT_DESCRIPTIONS[shot])
    })
  })

  it('shows the description of the selected shot under the buttons, for touch screens', () => {
    const root = startedApp()
    press(root.querySelector('svg.court')!, 3, 3)
    expect(popover(root).querySelector('.shot-description')).toBeNull()
    const netButton = [...popover(root).querySelectorAll<HTMLButtonElement>('.shot')].find((button) => button.textContent === 'Filet')!
    netButton.click()
    expect(popover(root).querySelector('.shot-description')!.textContent).toBe(`Filet\u00a0: ${SHOT_DESCRIPTIONS.net}`)
  })

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

  it('opens on the detail right after validation, with the score on its summary line', () => {
    const root = revealed(startedApp())
    const situation = generateSituation(SEED)
    const result = scoreChoice(situation, 'debutant', {x: 3, y: 3}, 'drop-slow')
    expect(drawer(root).classList.contains('expanded')).toBe(true)
    expect(drawer(root).querySelector('.drawer-summary')!.textContent).toContain(`Score : ${result.score} / 100`)
    expect(drawer(root).querySelector('.drawer-body')!.textContent).toContain('Pourquoi')
  })

  it('collapses and expands with its toggle', () => {
    const root = revealed(startedApp())
    drawer(root).querySelector<HTMLButtonElement>('.drawer-toggle')!.click()
    expect(drawer(root).classList.contains('expanded')).toBe(false)
    expect(drawer(root).querySelector('.drawer-body')).toBeNull()
    drawer(root).querySelector<HTMLButtonElement>('.drawer-toggle')!.click()
    expect(drawer(root).classList.contains('expanded')).toBe(true)
  })

  it('keeps its state when the level changes after the reveal', () => {
    const root = revealed(startedApp())
    drawer(root).querySelector<HTMLButtonElement>('.drawer-toggle')!.click()
    const levelSelect = root.querySelector<HTMLSelectElement>('.controls .level')!
    levelSelect.value = 'avance'
    levelSelect.dispatchEvent(new Event('change'))
    expect(drawer(root).classList.contains('expanded')).toBe(false)
  })

  it('stacks the legend above the drawer', () => {
    const root = revealed(startedApp())
    const stack = root.querySelector('.court-frame .bottom-stack')!
    expect([...stack.children].map((child) => child.classList[0])).toEqual(['legend-overlay', 'reveal-drawer'])
  })
})

describe('banner reservation', () => {
  it('keeps B back line and at least 0.4 m of out zone below the banner', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    renderCourt(svg)
    const viewBox = svg.viewBox.baseVal
    expect(-viewBox.y).toBeGreaterThanOrEqual(BANNER_RESERVED_METRES + 0.4)
  })

  it('reserves just the two lines of the banner and 0.4 m of out zone above B back line', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    renderCourt(svg)
    const viewBox = svg.viewBox.baseVal
    const twoLinesAndPadding = viewBox.width * (2 * 0.03 * 1.3 + 2 * 0.01)
    expect(BANNER_RESERVED_METRES).toBeGreaterThanOrEqual(twoLinesAndPadding)
    expect(BANNER_RESERVED_METRES).toBeLessThan(twoLinesAndPadding + 0.1)
    expect(-viewBox.y - BANNER_RESERVED_METRES).toBeCloseTo(0.4)
  })

  it('sizes the banner to the reserved strip', () => {
    const root = startedApp()
    const viewBox = root.querySelector<SVGSVGElement>('svg.court')!.viewBox.baseVal
    expect(parseFloat(root.querySelector<HTMLElement>('.shot-banner')!.style.height)).toBeCloseTo((100 * BANNER_RESERVED_METRES) / viewBox.height, 4)
  })

  it('shows the instruction at the bottom right of the court only in the question phase', () => {
    const root = startedApp()
    const hint = root.querySelector<HTMLElement>('.court-frame > .court-hint')!
    expect(hint.textContent).toBe('Clique sur le terrain de B pour choisir ton retour.')
    expect(hint.hidden).toBe(false)
    expect(root.querySelector('.shot-banner .banner-hint')).toBeNull()
    revealed(root)
    expect(hint.hidden).toBe(true)
  })
})

describe('forehand arc', () => {
  it('draws a white arc on the -x side of B and on the +x side of A, with no racket', () => {
    const root = startedApp()
    const situation = generateSituation(SEED)
    const [playerBGroup, playerAGroup] = [...root.querySelectorAll('svg.court > g')].pop()!.children
    const arcEndsX = (group: Element) => {
      const numbers = group.querySelector('.forehand-arc')!.getAttribute('d')!.match(/-?[\d.]+/g)!.map(Number)
      return [numbers[0], numbers[numbers.length - 2]]
    }
    arcEndsX(playerBGroup).forEach((x) => expect(x).toBeLessThan(situation.playerBHit.x))
    arcEndsX(playerAGroup).forEach((x) => expect(x).toBeGreaterThan(situation.playerA.x))
    expect(playerAGroup.querySelector('.forehand-arc')!.getAttribute('stroke')).toBe('#ffffff')
    expect(root.querySelector('svg.court ellipse')).toBeNull()
  })
})

describe('alternative wording', () => {
  it('starts the alternative line with « Alternative : » and never mentions light green', () => {
    const root = revealed(startedApp())
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

describe('unreachable choice', () => {
  const backLine = {x: 3, y: 0.3}

  function revealedNetToBackLine(): HTMLElement {
    const root = startedApp()
    press(root.querySelector('svg.court')!, backLine.x, backLine.y)
    const netButton = [...popover(root).querySelectorAll<HTMLButtonElement>('.shot')].find((button) => button.textContent === 'Filet')!
    netButton.click()
    popover(root).querySelector<HTMLButtonElement>('.validate')!.click()
    return root
  }

  it('stops the yellow trajectory where the shot really lands and draws the rest in red', () => {
    const root = revealedNetToBackLine()
    const {impact} = generateSituation(SEED)
    const landing = reachableLanding(impact, backLine, 'net')
    const yellow = root.querySelector<SVGPathElement>(`svg.court path[stroke="${RETURN_COLOR}"]`)!
    const red = root.querySelector<SVGPathElement>(`svg.court path[stroke="${UNREACHABLE_COLOR}"]`)!
    expect(yellow.getAttribute('d')).toBe(trajectoryPath(impact, landing, 'net'))
    expect(red.getAttribute('d')).toBe(`M ${landing.x} ${landing.y} L ${backLine.x} ${backLine.y}`)
  })

  it('says the shot cannot go that far on the collapsed drawer line', () => {
    const text = drawer(revealedNetToBackLine()).textContent!
    expect(text).toContain('Score\u00a0: 0 / 100 — Filet impossible jusque-là — Meilleur')
  })

  it('draws no red segment for a reachable choice', () => {
    const root = revealed(startedApp())
    expect(root.querySelector(`svg.court path[stroke="${UNREACHABLE_COLOR}"]`)).toBeNull()
  })
})

describe('shot tags on the court', () => {
  function tags(root: HTMLElement): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('.court-frame > .trajectory-tags > .trajectory-tag')]
  }

  function described(root: HTMLElement): Array<{text: string; kind: string}> {
    return tags(root).map((tag) => ({text: tag.textContent!, kind: tag.dataset.kind!}))
  }

  it('sits in the middle of the trajectory, as an html tag like the legend button', () => {
    const root = startedApp()
    const situation = generateSituation(SEED)
    const viewBox = root.querySelector<SVGSVGElement>('svg.court')!.viewBox.baseVal
    const middle = trajectoryMiddle(situation.playerBHit, situation.landing, situation.shotB)
    const [tag] = tags(root)
    expect(parseFloat(tag.style.left)).toBeCloseTo((100 * (middle.x - viewBox.x)) / viewBox.width, 3)
    expect(parseFloat(tag.style.top)).toBeCloseTo((100 * (middle.y - viewBox.y)) / viewBox.height, 3)
    expect(root.querySelector('svg.court .trajectory-label')).toBeNull()
  })

  it('names B shot in the question phase', () => {
    const root = startedApp()
    expect(described(root)).toEqual([{text: SHOTS[generateSituation(SEED).shotB].label, kind: 'shot-b'}])
  })

  it('names the chosen shot before validation', () => {
    const root = answered(startedApp())
    const chosen = popover(root).querySelector('.shot.selected')!.textContent!
    expect(described(root)).toContainEqual({text: chosen, kind: 'return'})
  })

  it('names the student return and the best return after validation, not B shot', () => {
    const root = answered(startedApp())
    const chosen = popover(root).querySelector('.shot.selected')!.textContent!
    popover(root).querySelector<HTMLButtonElement>('.validate')!.click()
    const {best} = scoreChoice(generateSituation(SEED), 'debutant', {x: 3, y: 3}, 'drop-slow').analysis
    expect(described(root)).toEqual([{text: chosen, kind: 'return'}, {text: SHOTS[best.shot].label, kind: 'best'}])
  })
})

describe('best return cross', () => {
  it('marks the end of the white line with a white cross', () => {
    const root = revealed(startedApp())
    const {best} = scoreChoice(generateSituation(SEED), 'debutant', {x: 3, y: 3}, 'drop-slow').analysis
    const whiteLines = [...root.querySelectorAll(`svg.court line[stroke="${BEST_RETURN_COLOR}"]`)]
    expect(whiteLines).toHaveLength(2)
    const centerX = whiteLines.map((line) => (Number(line.getAttribute('x1')) + Number(line.getAttribute('x2'))) / 2)
    const centerY = whiteLines.map((line) => (Number(line.getAttribute('y1')) + Number(line.getAttribute('y2'))) / 2)
    centerX.forEach((x) => expect(x).toBeCloseTo(best.point.x))
    centerY.forEach((y) => expect(y).toBeCloseTo(best.point.y))
  })
})

describe('reveal boxes', () => {
  it('frames the student choice with its score, and sets the best return apart', () => {
    const root = revealed(startedApp())
    const result = scoreChoice(generateSituation(SEED), 'debutant', {x: 3, y: 3}, 'drop-slow')
    const choiceBox = drawer(root).querySelector('.choice-box')!
    const bestBox = drawer(root).querySelector('.best-box')!
    expect(choiceBox.textContent).toContain('Ton choix')
    expect(choiceBox.textContent).toContain(`${result.score} / 100`)
    expect(bestBox.textContent).toContain('Meilleur retour')
    expect(bestBox.textContent).toContain(describeReturn(result.analysis.best))
    expect(choiceBox.compareDocumentPosition(bestBox) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
