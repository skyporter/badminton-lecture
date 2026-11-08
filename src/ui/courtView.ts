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
import {trajectoryPath, trajectoryStyle} from './trajectory'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const PLAYER_RADIUS = 0.35
export const PLAYER_A_COLOR = '#3b82f6'
export const PLAYER_B_COLOR = '#e05252'
export const SHOT_B_COLOR = '#ff8a65'

function svgElement(name: string, attributes: Record<string, string | number>): SVGElement {
  const element = document.createElementNS(SVG_NAMESPACE, name)
  Object.entries(attributes).forEach(([attribute, value]) => element.setAttribute(attribute, String(value)))
  return element
}

function line(x1: number, y1: number, x2: number, y2: number): SVGElement {
  return svgElement('line', {x1, y1, x2, y2})
}

export function renderCourt(svg: SVGSVGElement): void {
  svg.setAttribute('viewBox', '-0.6 -0.6 7.3 14.6')
  svg.classList.add('court')

  const lines = svgElement('g', {stroke: '#fff', 'stroke-width': 0.05, fill: 'none'})
  const shortServiceFar = NET_Y - SHORT_SERVICE_DISTANCE
  const shortServiceNear = NET_Y + SHORT_SERVICE_DISTANCE
  lines.append(
    svgElement('rect', {x: 0, y: 0, width: COURT_WIDTH, height: COURT_LENGTH}),
    line(SINGLES_LEFT, 0, SINGLES_LEFT, COURT_LENGTH),
    line(SINGLES_RIGHT, 0, SINGLES_RIGHT, COURT_LENGTH),
    line(0, shortServiceFar, COURT_WIDTH, shortServiceFar),
    line(0, shortServiceNear, COURT_WIDTH, shortServiceNear),
    line(0, DOUBLES_LONG_SERVICE_INSET, COURT_WIDTH, DOUBLES_LONG_SERVICE_INSET),
    line(0, COURT_LENGTH - DOUBLES_LONG_SERVICE_INSET, COURT_WIDTH, COURT_LENGTH - DOUBLES_LONG_SERVICE_INSET),
    line(CENTER_X, 0, CENTER_X, shortServiceFar),
    line(CENTER_X, shortServiceNear, CENTER_X, COURT_LENGTH),
  )

  const net = line(-0.4, NET_Y, COURT_WIDTH + 0.4, NET_Y)
  net.setAttribute('stroke', '#ddd')
  net.setAttribute('stroke-width', '0.12')
  net.setAttribute('stroke-dasharray', '0.2 0.1')

  svg.replaceChildren(lines, net)
}

function racket(position: Point, side: 'A' | 'B'): SVGElement {
  const direction = forehandIsPositiveX(side) ? 1 : -1
  const racketGroup = svgElement('g', {})
  const handle = line(position.x + direction * 0.3, position.y, position.x + direction * 0.55, position.y - direction * 0.35)
  handle.setAttribute('stroke', '#222')
  handle.setAttribute('stroke-width', '0.06')
  const centerX = position.x + direction * 0.68
  const centerY = position.y - direction * 0.62
  const head = svgElement('ellipse', {
    cx: centerX,
    cy: centerY,
    rx: 0.17,
    ry: 0.26,
    transform: `rotate(35 ${centerX} ${centerY})`,
    fill: '#fffbe6',
    stroke: '#222',
    'stroke-width': 0.05,
  })
  racketGroup.append(handle, head)
  return racketGroup
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
    racket(position, side),
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
      'stroke-width': 0.05,
      'stroke-dasharray': '0.12 0.08',
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
  const {dashArray} = trajectoryStyle(situation.shotB)
  const path = svgElement('path', {
    d: trajectoryPath(situation.playerBHit, situation.landing, situation.shotB),
    stroke: SHOT_B_COLOR,
    'stroke-width': 0.08,
    fill: 'none',
  })
  if (dashArray !== '') path.setAttribute('stroke-dasharray', dashArray)
  const landingDot = svgElement('circle', {cx: situation.landing.x, cy: situation.landing.y, r: 0.18, fill: SHOT_B_COLOR})
  layer.replaceChildren(path, landingDot)
}
