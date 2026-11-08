import type {ChoiceResult} from '../engine/analysis'
import {SHOTS} from '../engine/shots'
import type {QuizState} from './app'
import {SVG_NAMESPACE, handednessBadge, svgElement} from './courtView'
import {BEST_RETURN_COLOR, LANDING_COLOR, PLAYER_A_COLOR, PLAYER_B_COLOR, RETURN_COLOR, SHOT_B_COLOR, STROKE_PIXELS, UNREACHABLE_COLOR, ZONE_BEST_COLOR, ZONE_SECOND_COLOR, constantStroke} from './trajectory'

const STORAGE_KEY = 'badminton-lecture:legend-visible'
const SWATCH_WIDTH = 1.6
const SWATCH_HEIGHT = 0.5

export function loadLegendVisible(isMobile: boolean): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? !isMobile : stored === 'true'
  } catch {
    return !isMobile
  }
}

export function saveLegendVisible(visible: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(visible))
  } catch {
    return
  }
}

function lineSwatch(path: string, color: string, dashArray: string, strokeWidth = STROKE_PIXELS.trajectory): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  svg.setAttribute('viewBox', `0 0 ${SWATCH_WIDTH} ${SWATCH_HEIGHT}`)
  svg.classList.add('legend-line')
  svg.append(svgElement('path', {d: path, stroke: color, fill: 'none', ...constantStroke(strokeWidth, dashArray)}))
  return svg
}

function straightLine(color: string, dashArray: string, strokeWidth?: number): SVGSVGElement {
  const middle = SWATCH_HEIGHT / 2
  return lineSwatch(`M 0.1 ${middle} L ${SWATCH_WIDTH - 0.1} ${middle}`, color, dashArray, strokeWidth)
}

function shapeSwatch(className: string, color: string): HTMLSpanElement {
  const swatch = document.createElement('span')
  swatch.className = `legend-swatch ${className}`
  swatch.style.background = color
  return swatch
}

function row(swatch: Node | string, label: string): HTMLDivElement {
  const created = document.createElement('div')
  created.className = 'legend-row'
  const text = document.createElement('span')
  text.textContent = label
  const swatchHolder = document.createElement('span')
  swatchHolder.className = 'legend-holder'
  swatchHolder.append(swatch)
  created.append(swatchHolder, text)
  return created
}

function badgeSwatch(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  svg.setAttribute('viewBox', '-0.45 -0.5 1 0.95')
  svg.classList.add('legend-badge')
  svg.append(svgElement('circle', {cx: 0, cy: 0, r: 0.35, fill: PLAYER_A_COLOR}), handednessBadge({x: 0, y: 0}, 'A', 'droitier'))
  return svg
}

function questionRows(state: QuizState): HTMLElement[] {
  const studentReturn = state.shot === null ? 'ton retour au survol (✕ = point visé)' : `ton retour\u00a0: ${SHOTS[state.shot].label} (✕ = point visé)`
  return [
    row(shapeSwatch('disc', PLAYER_A_COLOR), 'A : toi (droitier)'),
    row(shapeSwatch('disc', PLAYER_B_COLOR), "B : l'adversaire (droitier)"),
    row(badgeSwatch(), 'D = droitier, G = gaucher (côté coup droit)'),
    row(straightLine(SHOT_B_COLOR, ''), `coup de B\u00a0: ${SHOTS[state.situation.shotB].label}`),
    row(shapeSwatch('disc', LANDING_COLOR), 'point de chute du volant'),
    row(straightLine(RETURN_COLOR, STROKE_PIXELS.returnDashArray), studentReturn),
  ]
}

function revealRows(result: ChoiceResult): HTMLElement[] {
  const {choice, analysis} = result
  const {best, bestZone, alternativeZone} = analysis
  return [
    row(shapeSwatch('disc ghost', 'transparent'), 'B au moment de sa frappe'),
    row(shapeSwatch('disc', PLAYER_B_COLOR), 'B replacé quand tu frappes'),
    row(straightLine(RETURN_COLOR, STROKE_PIXELS.returnDashArray), `ton retour\u00a0: ${SHOTS[choice.shot].label} (✕ = point visé)`),
    ...(choice.infeasibility === 'zone' ? [row(straightLine(UNREACHABLE_COLOR, STROKE_PIXELS.unreachableDashArray, STROKE_PIXELS.unreachable), 'au-delà de la portée de ton coup')] : []),
    ...(best.value === 0 ? [] : [row(straightLine(BEST_RETURN_COLOR, STROKE_PIXELS.returnDashArray, STROKE_PIXELS.bestReturn), `meilleur retour\u00a0: ${SHOTS[best.shot].label} (✕ = point idéal)`)]),
    ...(bestZone === null ? [] : [row(shapeSwatch('zone', ZONE_BEST_COLOR), `zone 1 · meilleur coup\u00a0: ${SHOTS[bestZone.shot].label}`)]),
    ...(alternativeZone === null ? [] : [row(shapeSwatch('zone', ZONE_SECOND_COLOR), `zone 2 · deuxième choix\u00a0: ${SHOTS[alternativeZone.shot].label}`)]),
  ]
}

export function renderLegend(container: HTMLElement, state: QuizState): void {
  container.replaceChildren(...(state.result === null ? questionRows(state) : revealRows(state.result)))
}
