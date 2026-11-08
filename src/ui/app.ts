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
import {loadLegendVisible, renderLegend, saveLegendVisible} from './legend'
import {renderBanner, renderControls, renderDrawer, renderShotPopover} from './panel'
import {readSituationParams, situationSearch} from './situationUrl'
import {BEST_RETURN_COLOR, RETURN_COLOR, STROKE_PIXELS, constantStroke, trajectoryPath, trajectoryStyle} from './trajectory'

export type QuizState = {
  situation: Situation
  level: Level
  target: Point | null
  shot: ShotId | null
  result: ChoiceResult | null
  popoverOpen: boolean
  drawerExpanded: boolean
}

export type QuizAction =
  | {type: 'new-situation'; seed: number}
  | {type: 'set-level'; level: Level}
  | {type: 'set-target'; point: Point}
  | {type: 'set-shot'; shot: ShotId}
  | {type: 'validate'}
  | {type: 'close-popover'}
  | {type: 'toggle-drawer'}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const CROSS_HALF_SIZE = 0.15
const PREVIEW_OPACITY = 0.7
const DEFAULT_LEVEL: Level = 'intermediaire'
const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

export function canValidate(state: QuizState): state is QuizState & {target: Point; shot: ShotId} {
  return state.result === null && state.target !== null && state.shot !== null
}

export function nextState(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'new-situation':
      return {...state, situation: generateSituation(action.seed), target: null, shot: null, result: null, popoverOpen: false, drawerExpanded: false}
    case 'set-level':
      if (state.result === null) {
        return {...state, level: action.level, target: null, shot: null, popoverOpen: false}
      } else {
        const {point, shot} = state.result.choice
        return {...state, level: action.level, result: scoreChoice(state.situation, action.level, point, shot)}
      }
    case 'set-target':
      return state.result === null ? {...state, target: action.point, popoverOpen: true} : state
    case 'set-shot':
      return state.result === null ? {...state, shot: action.shot} : state
    case 'validate':
      if (canValidate(state)) {
        return {...state, result: scoreChoice(state.situation, state.level, state.target, state.shot), popoverOpen: false, drawerExpanded: false}
      } else {
        return state
      }
    case 'close-popover':
      return {...state, popoverOpen: false}
    case 'toggle-drawer':
      return state.result === null ? state : {...state, drawerExpanded: !state.drawerExpanded}
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
  const style = {stroke: RETURN_COLOR, ...constantStroke(STROKE_PIXELS.cross)}
  return [
    svgElement('line', {x1: point.x - CROSS_HALF_SIZE, y1: point.y - CROSS_HALF_SIZE, x2: point.x + CROSS_HALF_SIZE, y2: point.y + CROSS_HALF_SIZE, ...style}),
    svgElement('line', {x1: point.x + CROSS_HALF_SIZE, y1: point.y - CROSS_HALF_SIZE, x2: point.x - CROSS_HALF_SIZE, y2: point.y + CROSS_HALF_SIZE, ...style}),
  ]
}

function studentReturn(from: Point, target: Point, shot: ShotId | null): SVGElement[] {
  const path = shot === null ? `M ${from.x} ${from.y} L ${target.x} ${target.y}` : trajectoryPath(from, target, shot)
  const dashArray = shot === null ? '' : trajectoryStyle(shot).dashArray
  const trajectory = svgElement('path', {d: path, stroke: RETURN_COLOR, fill: 'none', ...constantStroke(STROKE_PIXELS.trajectory, dashArray)})
  return [trajectory, ...cross(target)]
}

function bestReturn(from: Point, best: PairEvaluation): SVGElement {
  return svgElement('path', {
    d: trajectoryPath(from, best.point, best.shot),
    stroke: BEST_RETURN_COLOR,
    fill: 'none',
    ...constantStroke(STROKE_PIXELS.bestReturn, STROKE_PIXELS.bestReturnDashArray),
  })
}

function placeNextTo(popover: HTMLElement, point: Point, svg: SVGSVGElement): void {
  const viewBox = svg.viewBox.baseVal
  popover.style.setProperty('--anchor-x', `${(100 * (point.x - viewBox.x)) / viewBox.width}%`)
  popover.style.setProperty('--anchor-y', `${(100 * (point.y - viewBox.y)) / viewBox.height}%`)
  popover.classList.toggle('to-left', point.x - viewBox.x > viewBox.width / 2)
  popover.classList.toggle('upward', point.y - viewBox.y > viewBox.height / 2)
}

export function startApp(root: HTMLElement): void {
  const params = readSituationParams(window.location.search)
  let state: QuizState = {
    situation: generateSituation(params.seed ?? Date.now()),
    level: params.level ?? DEFAULT_LEVEL,
    target: null,
    shot: null,
    result: null,
    popoverOpen: false,
    drawerExpanded: false,
  }
  history.replaceState(null, '', situationSearch(state.situation.seed, state.level))
  let preview: Point | null = null

  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  const shotLayer = layer()
  const playerLayer = layer()
  const returnLayer = layer()
  const previewLayer = layer()
  previewLayer.setAttribute('opacity', String(PREVIEW_OPACITY))
  renderCourt(svg)
  svg.append(shotLayer, returnLayer, previewLayer, playerLayer)

  const heatmap = document.createElement('canvas')
  heatmap.className = 'heatmap'
  placeOverHalfOfB(heatmap, svg)
  const courtFrame = document.createElement('div')
  courtFrame.className = 'court-frame'
  const banner = document.createElement('div')
  banner.className = 'shot-banner'
  const popover = document.createElement('div')
  popover.className = 'shot-popover'
  const legend = document.createElement('div')
  legend.className = 'legend'
  const legendOverlay = document.createElement('div')
  legendOverlay.className = 'legend-overlay'
  const legendToggle = document.createElement('button')
  legendToggle.className = 'button legend-toggle'
  legendToggle.textContent = 'Légende'
  legendToggle.addEventListener('click', () => toggleLegend())
  legendOverlay.append(legend, legendToggle)
  const drawer = document.createElement('div')
  drawer.className = 'reveal-drawer'
  const bottomStack = document.createElement('div')
  bottomStack.className = 'bottom-stack'
  bottomStack.append(legendOverlay, drawer)
  courtFrame.append(heatmap, svg, banner, popover, bottomStack)
  const controlsBar = document.createElement('div')
  controlsBar.className = 'controls'
  const layout = document.createElement('div')
  layout.className = 'layout'
  layout.append(controlsBar, courtFrame)
  root.replaceChildren(layout)

  let legendVisible = loadLegendVisible(window.matchMedia(MOBILE_MEDIA_QUERY).matches)

  function renderLegendVisibility(): void {
    legend.hidden = !legendVisible
    legendToggle.classList.toggle('selected', legendVisible)
    legendToggle.setAttribute('aria-pressed', String(legendVisible))
  }

  function toggleLegend(): void {
    legendVisible = !legendVisible
    saveLegendVisible(legendVisible)
    renderLegendVisibility()
  }

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
      renderPlayers(playerLayer, {...situation, playerA: situation.impact}, 'reveal')
      renderHeatmap(heatmap, map, best.value)
      returnLayer.replaceChildren(
        ...(best.value === 0 ? [] : [bestReturn(situation.impact, best)]),
        ...studentReturn(situation.impact, result.choice.point, result.choice.shot),
      )
    }
  }

  function dispatch(action: QuizAction): void {
    state = nextState(state, action)
    history.replaceState(null, '', situationSearch(state.situation.seed, state.level))
    renderBoard()
    renderPreview()
    renderChrome()
  }

  function renderChrome(): void {
    renderControls(controlsBar, state, dispatch)
    renderLegend(legend, state.result === null ? 'question' : 'reveal')
    renderBanner(banner, state.situation)
    renderPopover()
    renderDrawer(drawer, state, dispatch)
  }

  function renderPopover(): void {
    popover.hidden = !state.popoverOpen || state.target === null
    if (state.popoverOpen && state.target !== null) {
      placeNextTo(popover, state.target, svg)
      renderShotPopover(popover, state, dispatch)
    } else {
      popover.replaceChildren()
    }
  }

  listenToCourt(svg, {
    onPreview: (point) => {
      preview = point
      renderPreview()
    },
    onTarget: (point) => dispatch({type: 'set-target', point}),
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.popoverOpen) {
      dispatch({type: 'close-popover'})
    }
  })
  renderLegendVisibility()
  renderBoard()
  renderChrome()
}
