import {
  CENTER_X,
  COURT_LENGTH,
  COURT_WIDTH,
  DOUBLES_LONG_SERVICE_INSET,
  NET_Y,
  SHORT_SERVICE_DISTANCE,
  SINGLES_LEFT,
  SINGLES_RIGHT,
  forehandIsPositiveX,
} from '../engine/court'
import type {Situation} from '../engine/generator'
import type {Point} from '../engine/types'
import {LANDING_COLOR, PLAYER_A_COLOR, PLAYER_B_COLOR, SHOT_B_COLOR, STROKE_PIXELS, constantStroke, trajectoryPath} from './trajectory'

export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const PLAYER_RADIUS = 0.35
export const BANNER_RESERVED_METRES = 0.75
const COURT_MARGIN = 0.6
const FOREHAND_ARC_COLOR = '#ffffff'
const FOREHAND_ARC_RADIUS = 0.45
const FOREHAND_ARC_HALF_SPAN = 45
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

export function forehandArc(position: Point, side: 'A' | 'B'): SVGElement {
  const centerAngle = forehandIsPositiveX(side) ? 0 : 180
  const pointAt = (angle: number): Point => ({
    x: Number((position.x + FOREHAND_ARC_RADIUS * Math.cos((angle * Math.PI) / 180)).toFixed(3)),
    y: Number((position.y + FOREHAND_ARC_RADIUS * Math.sin((angle * Math.PI) / 180)).toFixed(3)),
  })
  const start = pointAt(centerAngle - FOREHAND_ARC_HALF_SPAN)
  const end = pointAt(centerAngle + FOREHAND_ARC_HALF_SPAN)
  return svgElement('path', {
    class: 'forehand-arc',
    d: `M ${start.x} ${start.y} A ${FOREHAND_ARC_RADIUS} ${FOREHAND_ARC_RADIUS} 0 0 1 ${end.x} ${end.y}`,
    fill: 'none',
    stroke: FOREHAND_ARC_COLOR,
    'stroke-linecap': 'round',
    ...constantStroke(STROKE_PIXELS.forehandArc),
  })
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
    forehandArc(position, side),
    svgElement('circle', {cx: position.x, cy: position.y, r: PLAYER_RADIUS, fill: side === 'A' ? PLAYER_A_COLOR : PLAYER_B_COLOR}),
    text,
  )
  return group
}

function playerGhost(position: Point): SVGElement {
  const group = svgElement('g', {})
  const text = svgElement('text', {
    x: position.x,
    y: position.y + 0.15,
    'font-size': 0.35,
    'text-anchor': 'middle',
    fill: '#fff',
    opacity: 0.8,
  })
  text.textContent = 'B'
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

export function renderPlayers(layer: SVGGElement, situation: Situation, phase: 'question' | 'reveal'): void {
  const playerA = playerDisc(situation.playerA, 'A')
  if (phase === 'question') {
    layer.replaceChildren(playerDisc(situation.playerBHit, 'B'), playerA)
  } else {
    layer.replaceChildren(playerGhost(situation.playerBHit), playerDisc(situation.playerBRecovered, 'B'), playerA)
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
