// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {scoreChoice} from '../../src/engine/analysis'
import {SHOT_DESCRIPTIONS, describeReturn, describeShotB, explainBest, explainChoice} from '../../src/engine/explain'
import {RETURN_SHOTS, SHOTS} from '../../src/engine/shots'
import {generateSituation} from '../../src/engine/generator'
import {startApp} from '../../src/ui/app'
import {BANNER_RESERVED_METRES, renderCourt} from '../../src/ui/courtView'
import {BEST_RETURN_COLOR, PLAYER_A_COLOR, PLAYER_B_COLOR, RETURN_COLOR, STROKE_PIXELS, UNREACHABLE_COLOR, trajectoryMiddle, trajectoryPath} from '../../src/ui/trajectory'
import {reachableLanding} from '../../src/engine/evaluate'

const SEED = 5

beforeEach(() => {
  vi.stubGlobal('localStorage', {getItem: () => null, setItem: () => undefined})
  vi.stubGlobal('matchMedia', () => ({matches: false}))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.replaceChildren()
  history.replaceState(null, '', '/')
})

function startedApp(seed = SEED): HTMLElement {
  history.replaceState(null, '', `/?seed=${seed}&level=debutant`)
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
    expect(drawer(root).querySelector('.drawer-body .choice-box')).not.toBeNull()
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
    expect(hint.textContent).toBe('Clique sur le terrain de B pour répondre.')
    expect(hint.hidden).toBe(false)
    expect(root.querySelector('.shot-banner .banner-hint')).toBeNull()
    revealed(root)
    expect(hint.hidden).toBe(true)
  })
})

describe('players', () => {
  it('draws no forehand arc around the players', () => {
    const root = startedApp()
    expect(root.querySelector('svg.court .forehand-arc')).toBeNull()
  })

  it('puts a small « D » tag, like the other court tags, on the forehand side of each right-handed player: right of A, left of B', () => {
    const root = startedApp()
    const situation = generateSituation(SEED)
    const viewBox = root.querySelector<SVGSVGElement>('svg.court')!.viewBox.baseVal
    const leftPercent = (x: number) => (100 * (x - viewBox.x)) / viewBox.width
    const tagOf = (kind: string) => root.querySelector<HTMLElement>(`.trajectory-tags > .handedness-tag[data-kind="${kind}"]`)!
    expect(tagOf('handedness-a').textContent).toBe('D')
    expect(tagOf('handedness-b').textContent).toBe('D')
    expect(parseFloat(tagOf('handedness-a').style.left)).toBeGreaterThan(leftPercent(situation.playerA.x))
    expect(parseFloat(tagOf('handedness-b').style.left)).toBeLessThan(leftPercent(situation.playerBHit.x))
    expect(root.querySelector('svg.court .handedness-badge')).toBeNull()
  })

  it('follows A to its impact point and B to its recovered position in the reveal', () => {
    const root = revealed(startedApp())
    const situation = generateSituation(SEED)
    const viewBox = root.querySelector<SVGSVGElement>('svg.court')!.viewBox.baseVal
    const topPercent = (y: number) => (100 * (y - viewBox.y)) / viewBox.height
    const tagOf = (kind: string) => root.querySelector<HTMLElement>(`.trajectory-tags > .handedness-tag[data-kind="${kind}"]`)!
    expect(parseFloat(tagOf('handedness-a').style.top)).toBeLessThan(topPercent(situation.impact.y))
    expect(parseFloat(tagOf('handedness-a').style.top)).toBeGreaterThan(topPercent(situation.impact.y - 0.6))
    expect(parseFloat(tagOf('handedness-b').style.top)).toBeGreaterThan(topPercent(situation.playerBRecovered.y - 0.6))
  })

})

describe('second choice wording', () => {
  it('starts the second choice line with « Deuxième choix : » to match zone 2', () => {
    const root = revealed(startedApp())
    const text = drawer(root).querySelector('.alternative')!.textContent!
    expect(text.startsWith('Deuxième choix\u00a0: ')).toBe(true)
  })
})

describe('trajectory colours and dashes', () => {
  it('draws B shot as a solid line in B colour, landing on a blue dot', () => {
    const root = startedApp()
    const situation = generateSituation(SEED)
    const path = root.querySelector<SVGPathElement>(`svg.court path[stroke="${PLAYER_B_COLOR}"]`)!
    expect(path.getAttribute('d')).toBe(trajectoryPath(situation.playerBHit, situation.landing, situation.shotB))
    expect(path.getAttribute('stroke-dasharray')).toBeNull()
    const landingDot = [...root.querySelectorAll('svg.court circle')].find((circle) => Number(circle.getAttribute('cx')) === situation.landing.x)!
    expect(landingDot.getAttribute('fill')).toBe(PLAYER_A_COLOR)
  })

  it('draws the student return dashed in A colour, and the best return dashed in white', () => {
    const root = revealed(startedApp())
    const {best} = scoreChoice(generateSituation(SEED), 'debutant', {x: 3, y: 3}, 'clear-attack').analysis
    const situation = generateSituation(SEED)
    const studentPath = root.querySelector<SVGPathElement>(`svg.court path[stroke="${PLAYER_A_COLOR}"]`)!
    const bestPath = root.querySelector<SVGPathElement>(`svg.court path[stroke="${BEST_RETURN_COLOR}"]`)!
    expect(studentPath.getAttribute('stroke-dasharray')).toBe(STROKE_PIXELS.returnDashArray)
    expect(bestPath.getAttribute('d')).toBe(trajectoryPath(situation.impact, best.point, best.shot))
    expect(bestPath.getAttribute('stroke-dasharray')).toBe(STROKE_PIXELS.returnDashArray)
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

  it('keeps the summary line to the score and the best shot, the reason staying in « Ton choix »', () => {
    const root = revealedNetToBackLine()
    expect(drawer(root).querySelector('.drawer-summary')!.textContent).toMatch(/^Score\u00a0: 0 \/ 100 — Meilleur\u00a0: /)
    expect(drawer(root).querySelector('.choice-box')!.textContent).toContain('Coup impossible jusque-là.')
  })

  it('draws no red segment for a reachable choice', () => {
    const root = revealed(startedApp())
    expect(root.querySelector(`svg.court path[stroke="${UNREACHABLE_COLOR}"]`)).toBeNull()
  })
})

describe('shot tags on the court', () => {
  function tags(root: HTMLElement): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('.court-frame > .trajectory-tags > .trajectory-tag')].filter((tag) => !tag.dataset.kind!.startsWith('handedness'))
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

  it('names the student return and the two zones after validation, not B shot', () => {
    const root = answered(startedApp())
    const chosen = popover(root).querySelector('.shot.selected')!.textContent!
    popover(root).querySelector<HTMLButtonElement>('.validate')!.click()
    const {bestZone, alternativeZone} = scoreChoice(generateSituation(SEED), 'debutant', {x: 3, y: 3}, 'drop-slow').analysis
    expect(described(root)).toEqual([
      {text: chosen, kind: 'return'},
      {text: `1 · ${SHOTS[bestZone!.shot].label}`, kind: 'zone-1'},
      ...(alternativeZone === null ? [] : [{text: `2 · ${SHOTS[alternativeZone.shot].label}`, kind: 'zone-2'}]),
    ])
  })
})

describe('best return point', () => {
  it('marks the end of the white line with a white dot instead of a cross', () => {
    const root = revealed(startedApp())
    const {best} = scoreChoice(generateSituation(SEED), 'debutant', {x: 3, y: 3}, 'drop-slow').analysis
    expect(root.querySelectorAll(`svg.court line[stroke="${BEST_RETURN_COLOR}"]`)).toHaveLength(0)
    const dot = root.querySelector(`svg.court circle.best-point[fill="${BEST_RETURN_COLOR}"]`)!
    expect(Number(dot.getAttribute('cx'))).toBeCloseTo(best.point.x)
    expect(Number(dot.getAttribute('cy'))).toBeCloseTo(best.point.y)
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

  it('puts the reasons of each return inside its own box, with no separate « Pourquoi » section', () => {
    const root = revealed(startedApp())
    const situation = generateSituation(SEED)
    const result = scoreChoice(situation, 'debutant', {x: 3, y: 3}, 'drop-slow')
    const bulletsOf = (box: Element) => [...box.querySelectorAll('li')].map((item) => item.textContent)
    expect(bulletsOf(drawer(root).querySelector('.choice-box')!)).toEqual(explainChoice(situation, result))
    expect(bulletsOf(drawer(root).querySelector('.best-box')!)).toEqual(explainBest(situation, result.analysis))
    expect(drawer(root).textContent).not.toContain('Pourquoi')
    expect(drawer(root).querySelector('.drawer-body > :last-child')!.className).toBe('alternative')
  })
})

describe('best return zones', () => {
  it('draws an oval around the best return and the second choice instead of a heat map', () => {
    const root = startedApp()
    expect(root.querySelector('svg.court .zone')).toBeNull()
    revealed(root)
    const {bestZone, alternativeZone} = scoreChoice(generateSituation(SEED), 'debutant', {x: 3, y: 3}, 'drop-slow').analysis
    const zoneOne = root.querySelector('svg.court ellipse.zone[data-rank="1"]')!
    expect(Number(zoneOne.getAttribute('cx'))).toBeCloseTo(bestZone!.center.x)
    expect(Number(zoneOne.getAttribute('rx'))).toBeCloseTo(bestZone!.radiusX)
    expect(Number(zoneOne.getAttribute('ry'))).toBeCloseTo(bestZone!.radiusY)
    expect(root.querySelectorAll('svg.court ellipse.zone')).toHaveLength(alternativeZone === null ? 1 : 2)
    expect(root.querySelector('canvas')).toBeNull()
  })

  it('never puts a zone tag on top of the cross that marks the zone point', () => {
    for (const seed of [SEED, 1794143594958, 1794142100907]) {
      document.body.replaceChildren()
      const root = revealed(startedApp(seed))
      const viewBox = root.querySelector<SVGSVGElement>('svg.court')!.viewBox.baseVal
      const {bestZone, alternativeZone} = scoreChoice(generateSituation(seed), 'debutant', {x: 3, y: 3}, 'drop-slow').analysis
      const zones = [bestZone, alternativeZone].filter((zone) => zone !== null)
      root.querySelectorAll<HTMLElement>('.trajectory-tag[data-kind^="zone"]').forEach((tag, index) => {
        const tagY = viewBox.y + (parseFloat(tag.style.top) / 100) * viewBox.height
        expect(Math.abs(tagY - zones[index]!.center.y)).toBeGreaterThanOrEqual(0.4)
      })
    }
  })

  it('keeps the zone tags on the side of B, above the net', () => {
    const root = revealed(startedApp())
    const viewBox = root.querySelector<SVGSVGElement>('svg.court')!.viewBox.baseVal
    const netTop = (100 * (6.7 - 0.35 - viewBox.y)) / viewBox.height
    root.querySelectorAll<HTMLElement>('.trajectory-tag[data-kind^="zone"]').forEach((tag) => expect(parseFloat(tag.style.top)).toBeLessThanOrEqual(netTop + 0.001))
  })

  it('clips the zones to the singles half of B', () => {
    const root = revealed(startedApp())
    const zoneLayer = root.querySelector('svg.court ellipse.zone')!.parentElement!
    const clipId = zoneLayer.getAttribute('clip-path')!.match(/url\(#(.+)\)/)![1]
    const clipRect = root.querySelector(`svg.court clipPath#${clipId} rect`)!
    expect([clipRect.getAttribute('x'), clipRect.getAttribute('y'), clipRect.getAttribute('width'), clipRect.getAttribute('height')].map(Number)).toEqual([0.46, 0, 5.18, 6.7])
  })
})

describe('player moves', () => {
  const distanceToSegment = (point: {x: number; y: number}, from: {x: number; y: number}, to: {x: number; y: number}) => {
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    const along = ((point.x - from.x) * (to.x - from.x) + (point.y - from.y) * (to.y - from.y)) / length
    const across = Math.abs((point.x - from.x) * (to.y - from.y) - (point.y - from.y) * (to.x - from.x)) / length
    return {along, across, length}
  }

  function footstepsBetween(root: HTMLElement, from: {x: number; y: number}, to: {x: number; y: number}): Element[] {
    return [...root.querySelectorAll('svg.court .footstep')].filter((step) => {
      const [x, y] = step.getAttribute('transform')!.match(/translate\(([-\d.]+) ([-\d.]+)\)/)!.slice(1).map(Number)
      const point = {x, y}
      const {along, across, length} = distanceToSegment(point, from, to)
      return across < 0.15 && along > 0 && along < length
    })
  }

  it('draws each footstep as a sole and a heel, the sole ahead in the walking direction', () => {
    const root = revealed(startedApp())
    const step = root.querySelector('svg.court .footstep')!
    const [sole, heel] = [...step.querySelectorAll('ellipse')]
    expect(Number(sole.getAttribute('cy'))).toBeLessThan(Number(heel.getAttribute('cy')))
    expect(Number(sole.getAttribute('ry'))).toBeGreaterThan(Number(heel.getAttribute('ry')))
  })

  it('shows no footsteps in the question phase', () => {
    expect(startedApp().querySelector('svg.court .footstep')).toBeNull()
  })

  it('shows where A started as a dashed ghost and footsteps from there to the impact point', () => {
    const root = revealed(startedApp())
    const situation = generateSituation(SEED)
    const ghostLetters = [...root.querySelectorAll('svg.court .player-ghost text')].map((text) => text.textContent)
    expect(ghostLetters.sort()).toEqual(['A', 'B'])
    const ghostA = [...root.querySelectorAll('svg.court .player-ghost')].find((ghost) => ghost.textContent === 'A')!
    expect(Number(ghostA.querySelector('circle')!.getAttribute('cx'))).toBeCloseTo(situation.playerA.x)
    expect(footstepsBetween(root, situation.playerA, situation.impact).length).toBeGreaterThanOrEqual(Math.floor(Math.hypot(situation.impact.x - situation.playerA.x, situation.impact.y - situation.playerA.y) / 0.42) - 2)
  })

  it('shows footsteps from where B hit to where B recovered', () => {
    const root = revealed(startedApp())
    const situation = generateSituation(SEED)
    const moved = Math.hypot(situation.playerBRecovered.x - situation.playerBHit.x, situation.playerBRecovered.y - situation.playerBHit.y)
    expect(footstepsBetween(root, situation.playerBHit, situation.playerBRecovered).length).toBeGreaterThanOrEqual(Math.max(0, Math.floor(moved / 0.42) - 2))
  })
})

describe('student target point', () => {
  it('marks the chosen point with a blue dot instead of a cross, before and after validation', () => {
    const root = answered(startedApp())
    const dotBefore = root.querySelector(`svg.court circle.target-point[fill="${RETURN_COLOR}"]`)!
    expect([Number(dotBefore.getAttribute('cx')), Number(dotBefore.getAttribute('cy'))]).toEqual([3, 3])
    expect(root.querySelectorAll(`svg.court line[stroke="${RETURN_COLOR}"]`)).toHaveLength(0)
    popover(root).querySelector<HTMLButtonElement>('.validate')!.click()
    expect(root.querySelector(`svg.court circle.target-point[fill="${RETURN_COLOR}"]`)).not.toBeNull()
    expect(root.querySelectorAll(`svg.court line[stroke="${RETURN_COLOR}"]`)).toHaveLength(0)
  })
})
