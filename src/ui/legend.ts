import {MAP_BRIGHT_GREEN, MAP_LIGHT_GREEN, MAP_RED} from '../engine/rules'
import {SHOTS} from '../engine/shots'
import type {ShotId} from '../engine/shots'
import {PLAYER_A_COLOR, PLAYER_B_COLOR, SHOT_B_COLOR, racket} from './courtView'
import {BEST_RETURN_COLOR, RETURN_COLOR, STROKE_PIXELS, constantStroke, trajectoryPath, trajectoryStyle} from './trajectory'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const STORAGE_KEY = 'badminton-lecture:legend-visible'
const SWATCH_WIDTH = 1.6
const SWATCH_HEIGHT = 0.5
const TRAJECTORY_CODE_SHOTS: ShotId[] = ['smash', 'drive', 'clear-attack', 'drop-slow', 'clear-high', 'net']

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
  const stroke = document.createElementNS(SVG_NAMESPACE, 'path')
  stroke.setAttribute('d', path)
  stroke.setAttribute('stroke', color)
  stroke.setAttribute('fill', 'none')
  Object.entries(constantStroke(strokeWidth, dashArray)).forEach(([attribute, value]) => stroke.setAttribute(attribute, String(value)))
  svg.append(stroke)
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

function racketSwatch(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  svg.setAttribute('viewBox', '0.2 -0.95 0.8 1')
  svg.classList.add('legend-racket')
  svg.append(racket({x: 0, y: 0}, 'A'))
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
    row(racketSwatch(), 'raquette = côté coup droit'),
    row(straightLine(SHOT_B_COLOR, trajectoryStyle('clear-attack').dashArray), 'coup de B'),
    row(shapeSwatch('disc', SHOT_B_COLOR), 'point de chute du volant'),
    row(straightLine(RETURN_COLOR, ''), 'ton retour au survol (✕ = point visé)'),
  ]
}

function revealRows(): HTMLElement[] {
  const ghost = shapeSwatch('disc ghost', 'transparent')
  return [
    row(ghost, 'B au moment de sa frappe'),
    row(shapeSwatch('disc', PLAYER_B_COLOR), 'B replacé quand tu frappes'),
    row(straightLine(RETURN_COLOR, ''), 'ton retour (✕ = point visé)'),
    row(straightLine(BEST_RETURN_COLOR, STROKE_PIXELS.bestReturnDashArray, STROKE_PIXELS.bestReturn), 'meilleur retour'),
    row(shapeSwatch('square', MAP_BRIGHT_GREEN), 'meilleur spot'),
    row(shapeSwatch('square', MAP_LIGHT_GREEN), 'bonne alternative'),
    row(shapeSwatch('square', MAP_RED), 'à éviter'),
  ]
}

function trajectoryCode(wasOpen: boolean): HTMLDetailsElement {
  const details = document.createElement('details')
  details.className = 'legend-code'
  details.open = wasOpen
  const summary = document.createElement('summary')
  summary.textContent = 'Code des trajectoires'
  const explanation = document.createElement('p')
  explanation.textContent = 'Le pointillé dit la vitesse, la courbe dit la hauteur.'
  const middle = SWATCH_HEIGHT / 2
  const from = {x: 0.1, y: middle + 0.1}
  const to = {x: SWATCH_WIDTH - 0.1, y: middle + 0.1}
  details.append(
    summary,
    explanation,
    ...TRAJECTORY_CODE_SHOTS.map((shot) => row(lineSwatch(trajectoryPath(from, to, shot), RETURN_COLOR, trajectoryStyle(shot).dashArray), SHOTS[shot].label)),
  )
  return details
}

export function renderLegend(container: HTMLElement, phase: Phase): void {
  const wasOpen = container.querySelector('details')?.open ?? false
  container.replaceChildren(...(phase === 'question' ? questionRows() : revealRows()), trajectoryCode(wasOpen))
}
