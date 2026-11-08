import {MAP_BRIGHT_GREEN, MAP_LIGHT_GREEN, MAP_RED} from '../engine/rules'
import {SVG_NAMESPACE, forehandArc, svgElement} from './courtView'
import {BEST_RETURN_COLOR, LANDING_COLOR, PLAYER_A_COLOR, PLAYER_B_COLOR, RETURN_COLOR, SHOT_B_COLOR, STROKE_PIXELS, UNREACHABLE_COLOR, constantStroke} from './trajectory'

const STORAGE_KEY = 'badminton-lecture:legend-visible'
const SWATCH_WIDTH = 1.6
const SWATCH_HEIGHT = 0.5

type Phase = 'question' | 'reveal'

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

function forehandArcSwatch(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  svg.setAttribute('viewBox', '-0.55 -0.55 1.1 1.1')
  svg.classList.add('legend-forehand')
  svg.append(svgElement('circle', {cx: 0, cy: 0, r: 0.35, fill: PLAYER_A_COLOR}), forehandArc({x: 0, y: 0}, 'A'))
  return svg
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

function questionRows(): HTMLElement[] {
  return [
    row(shapeSwatch('disc', PLAYER_A_COLOR), 'A : toi (droitier)'),
    row(shapeSwatch('disc', PLAYER_B_COLOR), "B : l'adversaire (droitier)"),
    row(forehandArcSwatch(), 'arc blanc = côté coup droit'),
    row(straightLine(SHOT_B_COLOR, ''), 'coup de B'),
    row(shapeSwatch('disc', LANDING_COLOR), 'point de chute du volant'),
    row(straightLine(RETURN_COLOR, STROKE_PIXELS.returnDashArray), 'ton retour au survol (✕ = point visé)'),
  ]
}

function revealRows(): HTMLElement[] {
  const ghost = shapeSwatch('disc ghost', 'transparent')
  return [
    row(ghost, 'B au moment de sa frappe'),
    row(shapeSwatch('disc', PLAYER_B_COLOR), 'B replacé quand tu frappes'),
    row(straightLine(RETURN_COLOR, STROKE_PIXELS.returnDashArray), 'ton retour (✕ = point visé)'),
    row(straightLine(BEST_RETURN_COLOR, STROKE_PIXELS.returnDashArray, STROKE_PIXELS.bestReturn), 'meilleur retour (✕ = point idéal)'),
    row(straightLine(UNREACHABLE_COLOR, STROKE_PIXELS.unreachableDashArray, STROKE_PIXELS.unreachable), 'au-delà de la portée de ton coup'),
    row(shapeSwatch('square', MAP_BRIGHT_GREEN), 'meilleur spot'),
    row(shapeSwatch('square', MAP_LIGHT_GREEN), 'bon retour'),
    row(shapeSwatch('square', MAP_RED), 'à éviter'),
  ]
}

export function renderLegend(container: HTMLElement, phase: Phase): void {
  container.replaceChildren(...(phase === 'question' ? questionRows() : revealRows()))
}
