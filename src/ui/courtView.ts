import {
  CENTER_X,
  COURT_LENGTH,
  COURT_WIDTH,
  DOUBLES_LONG_SERVICE_INSET,
  NET_Y,
  SHORT_SERVICE_DISTANCE,
  SINGLES_LEFT,
  SINGLES_RIGHT,
} from '../engine/court'
import type {Situation} from '../engine/generator'
import type {Point} from '../engine/types'
import {LANDING_COLOR, PLAYER_A_COLOR, PLAYER_B_COLOR, SHOT_B_COLOR, STROKE_PIXELS, constantStroke, trajectoryPath} from './trajectory'

export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const PLAYER_RADIUS = 0.35
export const BANNER_RESERVED_METRES = 0.75
const COURT_MARGIN = 0.6
const FOOTSTEP_SPACING = 0.42
const FOOTSTEP_SIDE_OFFSET = 0.08
const FOOTSTEP_SOLE_CENTER_Y = -0.04
const FOOTSTEP_SOLE_RADIUS_X = 0.055
const FOOTSTEP_SOLE_RADIUS_Y = 0.095
const FOOTSTEP_HEEL_CENTER_Y = 0.11
const FOOTSTEP_HEEL_RADIUS_X = 0.042
const FOOTSTEP_HEEL_RADIUS_Y = 0.045
const FOOTSTEP_OPACITY = 0.35
const OUT_ZONE_BELOW_BANNER = 0.4

export function svgElement(name: string, attributes: Record<string, string | number>): SVGElement {
  const element = document.createElementNS(SVG_NAMESPACE, name)
  Object.entries(attributes).forEach(([attribute, value]) => element.setAttribute(attribute, String(value)))
  return element
}

function line(x1: number, y1: number, x2: number, y2: number, stroke: Record<string, string | number> = {}): SVGElement {
  return svgElement('line', {x1, y1, x2, y2, ...stroke})
}

function courtLine(x1: number, y1: number, x2: number, y2: number): SVGElement {
  return line(x1, y1, x2, y2, constantStroke(STROKE_PIXELS.courtLine))
}

export function renderCourt(svg: SVGSVGElement): void {
  const top = -(OUT_ZONE_BELOW_BANNER + BANNER_RESERVED_METRES)
  svg.setAttribute('viewBox', `${-COURT_MARGIN} ${top} ${COURT_WIDTH + 2 * COURT_MARGIN} ${COURT_LENGTH + COURT_MARGIN - top}`)
  svg.classList.add('court')

  const lines = svgElement('g', {stroke: '#fff', fill: 'none'})
  const shortServiceFar = NET_Y - SHORT_SERVICE_DISTANCE
  const shortServiceNear = NET_Y + SHORT_SERVICE_DISTANCE
  lines.append(
    svgElement('rect', {x: 0, y: 0, width: COURT_WIDTH, height: COURT_LENGTH, ...constantStroke(STROKE_PIXELS.courtLine)}),
    courtLine(SINGLES_LEFT, 0, SINGLES_LEFT, COURT_LENGTH),
    courtLine(SINGLES_RIGHT, 0, SINGLES_RIGHT, COURT_LENGTH),
    courtLine(0, shortServiceFar, COURT_WIDTH, shortServiceFar),
    courtLine(0, shortServiceNear, COURT_WIDTH, shortServiceNear),
    courtLine(0, DOUBLES_LONG_SERVICE_INSET, COURT_WIDTH, DOUBLES_LONG_SERVICE_INSET),
    courtLine(0, COURT_LENGTH - DOUBLES_LONG_SERVICE_INSET, COURT_WIDTH, COURT_LENGTH - DOUBLES_LONG_SERVICE_INSET),
    courtLine(CENTER_X, 0, CENTER_X, shortServiceFar),
    courtLine(CENTER_X, shortServiceNear, CENTER_X, COURT_LENGTH),
  )

  const net = line(-0.4, NET_Y, COURT_WIDTH + 0.4, NET_Y, {stroke: '#ddd', ...constantStroke(STROKE_PIXELS.net, STROKE_PIXELS.netDashArray)})

  svg.replaceChildren(lines, net)
}

function playerDisc(position: Point, side: 'A' | 'B'): SVGElement {
  const group = svgElement('g', {})
  const text = svgElement('text', {
    x: position.x,
    y: position.y + 0.15,
    'font-size': 0.4,
    'text-anchor': 'middle',
    fill: '#fff',
    'font-weight': 'bold',
  })
  text.textContent = side
  group.append(
    svgElement('circle', {cx: position.x, cy: position.y, r: PLAYER_RADIUS, fill: side === 'A' ? PLAYER_A_COLOR : PLAYER_B_COLOR}),
    text,
  )
  return group
}

function playerGhost(position: Point, side: 'A' | 'B'): SVGElement {
  const group = svgElement('g', {class: 'player-ghost'})
  const text = svgElement('text', {
    x: position.x,
    y: position.y + 0.15,
    'font-size': 0.35,
    'text-anchor': 'middle',
    fill: '#fff',
    opacity: 0.8,
  })
  text.textContent = side
  group.append(
    svgElement('circle', {
      cx: position.x,
      cy: position.y,
      r: PLAYER_RADIUS,
      fill: 'none',
      stroke: '#fff',
      ...constantStroke(STROKE_PIXELS.ghost, STROKE_PIXELS.ghostDashArray),
      opacity: 0.8,
    }),
    text,
  )
  return group
}

function footsteps(from: Point, to: Point): SVGElement[] {
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  const unit = {x: (to.x - from.x) / length, y: (to.y - from.y) / length}
  const angle = (Math.atan2(unit.y, unit.x) * 180) / Math.PI + 90
  const steps: SVGElement[] = []
  for (let along = PLAYER_RADIUS + FOOTSTEP_SPACING / 2, index = 0; along < length - PLAYER_RADIUS; along += FOOTSTEP_SPACING, index++) {
    const side = index % 2 === 0 ? 1 : -1
    const center = {
      x: Number((from.x + unit.x * along - unit.y * side * FOOTSTEP_SIDE_OFFSET).toFixed(3)),
      y: Number((from.y + unit.y * along + unit.x * side * FOOTSTEP_SIDE_OFFSET).toFixed(3)),
    }
    const step = svgElement('g', {
      class: 'footstep',
      transform: `translate(${center.x} ${center.y}) rotate(${Number(angle.toFixed(1))})`,
      fill: '#fff',
      opacity: FOOTSTEP_OPACITY,
    })
    step.append(
      svgElement('ellipse', {cx: 0, cy: FOOTSTEP_SOLE_CENTER_Y, rx: FOOTSTEP_SOLE_RADIUS_X, ry: FOOTSTEP_SOLE_RADIUS_Y}),
      svgElement('ellipse', {cx: 0, cy: FOOTSTEP_HEEL_CENTER_Y, rx: FOOTSTEP_HEEL_RADIUS_X, ry: FOOTSTEP_HEEL_RADIUS_Y}),
    )
    steps.push(step)
  }
  return steps
}

export function renderPlayers(layer: SVGGElement, situation: Situation, phase: 'question' | 'reveal'): void {
  if (phase === 'question') {
    layer.replaceChildren(playerDisc(situation.playerBHit, 'B'), playerDisc(situation.playerA, 'A'))
  } else {
    layer.replaceChildren(
      ...footsteps(situation.playerBHit, situation.playerBRecovered),
      ...footsteps(situation.playerA, situation.impact),
      playerGhost(situation.playerBHit, 'B'),
      playerGhost(situation.playerA, 'A'),
      playerDisc(situation.playerBRecovered, 'B'),
      playerDisc(situation.impact, 'A'),
    )
  }
}

export function renderShotB(layer: SVGGElement, situation: Situation): void {
  const path = svgElement('path', {
    d: trajectoryPath(situation.playerBHit, situation.landing, situation.shotB),
    stroke: SHOT_B_COLOR,
    fill: 'none',
    ...constantStroke(STROKE_PIXELS.trajectory),
  })
  const landingDot = svgElement('circle', {cx: situation.landing.x, cy: situation.landing.y, r: 0.18, fill: LANDING_COLOR})
  layer.replaceChildren(path, landingDot)
}
