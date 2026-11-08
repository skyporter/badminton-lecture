import {scoreChoice} from '../engine/analysis'
import type {ChoiceResult} from '../engine/analysis'
import type {PairEvaluation} from '../engine/evaluate'
import {generateSituation} from '../engine/generator'
import type {Situation} from '../engine/generator'
import type {ShotId} from '../engine/shots'
import type {Level, Point} from '../engine/types'
import {renderCourt, renderPlayers, renderShotB} from './courtView'
import {placeOverHalfOfB, renderHeatmap} from './heatmap'
import {listenToCourt} from './input'
import {renderPanel} from './panel'
import {trajectoryPath, trajectoryStyle} from './trajectory'

export type QuizState = {situation: Situation; level: Level; target: Point | null; shot: ShotId | null; result: ChoiceResult | null}

export type QuizAction =
  | {type: 'new-situation'; seed: number}
  | {type: 'set-level'; level: Level}
  | {type: 'set-target'; point: Point}
  | {type: 'set-shot'; shot: ShotId}
  | {type: 'validate'}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const RETURN_COLOR = '#ffd54a'
const BEST_RETURN_COLOR = '#ffffff'
const BEST_RETURN_DASH_ARRAY = '0.2 0.12'
const CROSS_HALF_SIZE = 0.15
const PREVIEW_OPACITY = 0.7
const DEFAULT_LEVEL: Level = 'intermediaire'

export function canValidate(state: QuizState): state is QuizState & {target: Point; shot: ShotId} {
  return state.result === null && state.target !== null && state.shot !== null
}

export function nextState(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'new-situation':
      return {...state, situation: generateSituation(action.seed), target: null, shot: null, result: null}
    case 'set-level':
      if (state.result === null) {
        return {...state, level: action.level, target: null, shot: null}
      } else {
        const {point, shot} = state.result.choice
        return {...state, level: action.level, result: scoreChoice(state.situation, action.level, point, shot)}
      }
    case 'set-target':
      return state.result === null ? {...state, target: action.point} : state
    case 'set-shot':
      return state.result === null ? {...state, shot: action.shot} : state
    case 'validate':
      return canValidate(state) ? {...state, result: scoreChoice(state.situation, state.level, state.target, state.shot)} : state
  }
}

function svgElement(name: string, attributes: Record<string, string | number>): SVGElement {
  const created = document.createElementNS(SVG_NAMESPACE, name)
  Object.entries(attributes).forEach(([attribute, value]) => created.setAttribute(attribute, String(value)))
  return created
}

function layer(): SVGGElement {
  return document.createElementNS(SVG_NAMESPACE, 'g')
}

function cross(point: Point): SVGElement[] {
  const style = {stroke: RETURN_COLOR, 'stroke-width': 0.08}
  return [
    svgElement('line', {x1: point.x - CROSS_HALF_SIZE, y1: point.y - CROSS_HALF_SIZE, x2: point.x + CROSS_HALF_SIZE, y2: point.y + CROSS_HALF_SIZE, ...style}),
    svgElement('line', {x1: point.x + CROSS_HALF_SIZE, y1: point.y - CROSS_HALF_SIZE, x2: point.x - CROSS_HALF_SIZE, y2: point.y + CROSS_HALF_SIZE, ...style}),
  ]
}

function studentReturn(from: Point, target: Point, shot: ShotId | null): SVGElement[] {
  const path = shot === null ? `M ${from.x} ${from.y} L ${target.x} ${target.y}` : trajectoryPath(from, target, shot)
  const dashArray = shot === null ? '' : trajectoryStyle(shot).dashArray
  const trajectory = svgElement('path', {d: path, stroke: RETURN_COLOR, 'stroke-width': 0.08, fill: 'none', 'stroke-dasharray': dashArray || 'none'})
  return [trajectory, ...cross(target)]
}

function bestReturn(from: Point, best: PairEvaluation): SVGElement {
  return svgElement('path', {
    d: trajectoryPath(from, best.point, best.shot),
    stroke: BEST_RETURN_COLOR,
    'stroke-width': 0.06,
    fill: 'none',
    'stroke-dasharray': BEST_RETURN_DASH_ARRAY,
  })
}

export function startApp(root: HTMLElement): void {
  let state: QuizState = {situation: generateSituation(Date.now()), level: DEFAULT_LEVEL, target: null, shot: null, result: null}
  let preview: Point | null = null

  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  const shotLayer = layer()
  const playerLayer = layer()
  const returnLayer = layer()
  const previewLayer = layer()
  previewLayer.setAttribute('opacity', String(PREVIEW_OPACITY))
  renderCourt(svg)
  svg.append(shotLayer, playerLayer, returnLayer, previewLayer)

  const heatmap = document.createElement('canvas')
  heatmap.className = 'heatmap'
  placeOverHalfOfB(heatmap, svg)
  const courtFrame = document.createElement('div')
  courtFrame.className = 'court-frame'
  courtFrame.append(heatmap, svg)
  const panel = document.createElement('div')
  panel.className = 'panel'
  const layout = document.createElement('div')
  layout.className = 'layout'
  layout.append(courtFrame, panel)
  root.replaceChildren(layout)

  function renderPreview(): void {
    if (preview === null || state.result !== null) {
      previewLayer.replaceChildren()
    } else {
      previewLayer.replaceChildren(...studentReturn(state.situation.impact, preview, state.shot))
    }
  }

  function renderBoard(): void {
    const {situation, result} = state
    heatmap.hidden = result === null
    if (result === null) {
      renderShotB(shotLayer, situation)
      renderPlayers(playerLayer, situation, 'question')
      returnLayer.replaceChildren(...(state.target === null ? [] : studentReturn(situation.impact, state.target, state.shot)))
    } else {
      const {map, best} = result.analysis
      shotLayer.replaceChildren()
      renderPlayers(playerLayer, situation, 'reveal')
      renderHeatmap(heatmap, map, best.value)
      returnLayer.replaceChildren(
        ...(best.value === 0 ? [] : [bestReturn(situation.impact, best)]),
        ...studentReturn(situation.impact, result.choice.point, result.choice.shot),
      )
    }
  }

  function dispatch(action: QuizAction): void {
    state = nextState(state, action)
    renderBoard()
    renderPreview()
    renderPanel(panel, state, dispatch)
  }

  listenToCourt(svg, {
    onPreview: (point) => {
      preview = point
      renderPreview()
    },
    onTarget: (point) => dispatch({type: 'set-target', point}),
  })
  renderBoard()
  renderPanel(panel, state, dispatch)
}
