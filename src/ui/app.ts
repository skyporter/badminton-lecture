import {scoreChoice} from '../engine/analysis'
import type {ChoiceResult, Zone} from '../engine/analysis'
import {NET_Y, SINGLES_LEFT, SINGLES_RIGHT} from '../engine/court'
import {reachableLanding} from '../engine/evaluate'
import type {PairEvaluation} from '../engine/evaluate'
import {generateSituation} from '../engine/generator'
import type {Situation} from '../engine/generator'
import {SHOTS} from '../engine/shots'
import type {ShotId} from '../engine/shots'
import type {Level, Point} from '../engine/types'
import {BANNER_RESERVED_METRES, HANDEDNESS_LETTERS, SVG_NAMESPACE, handednessTagPoint, renderCourt, renderPlayers, renderShotB, svgElement} from './courtView'
import {listenToCourt} from './input'
import {loadLegendVisible, renderLegend, saveLegendVisible} from './legend'
import {renderBanner, renderControls, renderDrawer, renderShotPopover} from './panel'
import {readSituationParams, situationSearch} from './situationUrl'
import type {Choice} from './situationUrl'
import {BEST_RETURN_COLOR, RETURN_COLOR, STROKE_PIXELS, UNREACHABLE_COLOR, ZONE_BEST_COLOR, ZONE_OPACITY, ZONE_SECOND_COLOR, constantStroke, trajectoryMiddle, trajectoryPath} from './trajectory'

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
  | {type: 'restore-situation'; seed: number; level: Level; choice: Choice | null}
  | {type: 'set-level'; level: Level}
  | {type: 'set-target'; point: Point}
  | {type: 'set-shot'; shot: ShotId}
  | {type: 'validate'}
  | {type: 'close-popover'}
  | {type: 'toggle-drawer'}

const CROSS_HALF_SIZE = 0.15
const PREVIEW_OPACITY = 0.7
const HALF_OF_B_CLIP_ID = 'half-of-b'
const ZONE_TAG_NET_GAP = 0.35
const ZONE_TAG_OFFSET = 0.45
const BEST_POINT_RADIUS = 0.12
const DEFAULT_LEVEL: Level = 'intermediaire'
const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

export function canValidate(state: QuizState): state is QuizState & {target: Point; shot: ShotId} {
  return state.result === null && state.target !== null && state.shot !== null
}

export function nextState(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'new-situation':
      return {...state, situation: generateSituation(action.seed), target: null, shot: null, result: null, popoverOpen: false, drawerExpanded: false}
    case 'restore-situation':
      return restoredState(state, action.seed, action.level, action.choice)
    case 'set-level':
      if (state.result === null) {
        return {...state, level: action.level, target: null, shot: null, popoverOpen: false}
      } else {
        const {point, shot} = state.result.choice
        return {...state, level: action.level, result: scoreChoice(state.situation, action.level, point, shot)}
      }
    case 'set-target':
      return state.result === null ? {...state, target: roundedToCentimetre(action.point), popoverOpen: true} : state
    case 'set-shot':
      return state.result === null ? {...state, shot: action.shot} : state
    case 'validate':
      if (canValidate(state)) {
        return {...state, result: scoreChoice(state.situation, state.level, state.target, state.shot), popoverOpen: false, drawerExpanded: true}
      } else {
        return state
      }
    case 'close-popover':
      return {...state, popoverOpen: false}
    case 'toggle-drawer':
      return state.result === null ? state : {...state, drawerExpanded: !state.drawerExpanded}
  }
}

function layer(): SVGGElement {
  return document.createElementNS(SVG_NAMESPACE, 'g')
}

function cross(point: Point, color: string): SVGElement[] {
  const style = {stroke: color, ...constantStroke(STROKE_PIXELS.cross)}
  return [
    svgElement('line', {x1: point.x - CROSS_HALF_SIZE, y1: point.y - CROSS_HALF_SIZE, x2: point.x + CROSS_HALF_SIZE, y2: point.y + CROSS_HALF_SIZE, ...style}),
    svgElement('line', {x1: point.x + CROSS_HALF_SIZE, y1: point.y - CROSS_HALF_SIZE, x2: point.x - CROSS_HALF_SIZE, y2: point.y + CROSS_HALF_SIZE, ...style}),
  ]
}

function studentTrajectory(from: Point, target: Point, shot: ShotId | null): SVGElement {
  const path = shot === null ? `M ${from.x} ${from.y} L ${target.x} ${target.y}` : trajectoryPath(from, target, shot)
  return svgElement('path', {d: path, stroke: RETURN_COLOR, fill: 'none', ...constantStroke(STROKE_PIXELS.trajectory, STROKE_PIXELS.returnDashArray)})
}

function studentReturn(from: Point, target: Point, shot: ShotId | null): SVGElement[] {
  return [studentTrajectory(from, target, shot), ...cross(target, RETURN_COLOR)]
}

function revealedStudentReturn(from: Point, choice: PairEvaluation): SVGElement[] {
  if (choice.infeasibility === 'zone') {
    const landing = reachableLanding(from, choice.point, choice.shot)
    const unreachable = svgElement('path', {
      d: `M ${landing.x} ${landing.y} L ${choice.point.x} ${choice.point.y}`,
      stroke: UNREACHABLE_COLOR,
      fill: 'none',
      ...constantStroke(STROKE_PIXELS.unreachable, STROKE_PIXELS.unreachableDashArray),
    })
    return [studentTrajectory(from, landing, choice.shot), unreachable, ...cross(choice.point, RETURN_COLOR)]
  } else {
    return studentReturn(from, choice.point, choice.shot)
  }
}

function bestReturn(from: Point, best: PairEvaluation): SVGElement[] {
  const trajectory = svgElement('path', {
    d: trajectoryPath(from, best.point, best.shot),
    stroke: BEST_RETURN_COLOR,
    fill: 'none',
    ...constantStroke(STROKE_PIXELS.bestReturn, STROKE_PIXELS.returnDashArray),
  })
  return [trajectory, svgElement('circle', {class: 'best-point', cx: best.point.x, cy: best.point.y, r: BEST_POINT_RADIUS, fill: BEST_RETURN_COLOR})]
}

type CourtTag = {point: Point; text: string; kind: 'shot-b' | 'return' | 'zone-1' | 'zone-2' | 'handedness-a' | 'handedness-b'}

function trajectoryTag(from: Point, to: Point, shot: ShotId, kind: 'shot-b' | 'return'): CourtTag {
  return {point: trajectoryMiddle(from, to, shot), text: SHOTS[shot].label, kind}
}

function zoneTag(zone: Zone, rank: 1 | 2): CourtTag {
  const belowCenter = zone.center.y + ZONE_TAG_OFFSET
  const point = {x: zone.center.x, y: belowCenter <= NET_Y - ZONE_TAG_NET_GAP ? belowCenter : zone.center.y - ZONE_TAG_OFFSET}
  return {point, text: `${rank} · ${SHOTS[zone.shot].label}`, kind: rank === 1 ? 'zone-1' : 'zone-2'}
}

function handednessTags(situation: Situation, playerA: Point, playerB: Point): CourtTag[] {
  const letter = HANDEDNESS_LETTERS[situation.handedness]
  return [
    {point: handednessTagPoint(playerB, 'B'), text: letter, kind: 'handedness-b'},
    {point: handednessTagPoint(playerA, 'A'), text: letter, kind: 'handedness-a'},
  ]
}

function courtTags(state: QuizState): CourtTag[] {
  const {situation, result} = state
  if (result === null) {
    return [...handednessTags(situation, situation.playerA, situation.playerBHit), ...shotTags(state)]
  } else {
    return [...handednessTags(situation, situation.impact, situation.playerBRecovered), ...shotTags(state)]
  }
}

function shotTags(state: QuizState): CourtTag[] {
  const {situation, result} = state
  if (result === null) {
    const shotB = trajectoryTag(situation.playerBHit, situation.landing, situation.shotB, 'shot-b')
    const studentReturn = state.target === null || state.shot === null ? [] : [trajectoryTag(situation.impact, state.target, state.shot, 'return')]
    return [shotB, ...studentReturn]
  } else {
    const {choice, analysis} = result
    const landing = choice.infeasibility === 'zone' ? reachableLanding(situation.impact, choice.point, choice.shot) : choice.point
    const zones = [
      ...(analysis.bestZone === null ? [] : [zoneTag(analysis.bestZone, 1)]),
      ...(analysis.alternativeZone === null ? [] : [zoneTag(analysis.alternativeZone, 2)]),
    ]
    return [trajectoryTag(situation.impact, landing, choice.shot, 'return'), ...zones]
  }
}

function halfOfBClip(): SVGElement {
  const clip = svgElement('clipPath', {id: HALF_OF_B_CLIP_ID})
  clip.append(svgElement('rect', {x: SINGLES_LEFT, y: 0, width: Number((SINGLES_RIGHT - SINGLES_LEFT).toFixed(2)), height: NET_Y}))
  return clip
}

function zoneEllipse(zone: Zone, rank: 1 | 2): SVGElement {
  return svgElement('ellipse', {
    class: 'zone',
    'data-rank': rank,
    cx: zone.center.x,
    cy: zone.center.y,
    rx: zone.radiusX,
    ry: zone.radiusY,
    fill: rank === 1 ? ZONE_BEST_COLOR : ZONE_SECOND_COLOR,
    'fill-opacity': ZONE_OPACITY,
  })
}

function percentOfViewBox(point: Point, svg: SVGSVGElement): {left: string; top: string} {
  const viewBox = svg.viewBox.baseVal
  return {left: `${(100 * (point.x - viewBox.x)) / viewBox.width}%`, top: `${(100 * (point.y - viewBox.y)) / viewBox.height}%`}
}

function renderCourtTags(container: HTMLElement, state: QuizState, svg: SVGSVGElement): void {
  container.replaceChildren(...courtTags(state).map((tag) => {
    const element = document.createElement('div')
    element.className = tag.kind.startsWith('handedness') ? 'trajectory-tag handedness-tag' : 'trajectory-tag'
    element.dataset.kind = tag.kind
    element.textContent = tag.text
    const {left, top} = percentOfViewBox(tag.point, svg)
    element.style.left = left
    element.style.top = top
    return element
  }))
}

function placeNextTo(popover: HTMLElement, point: Point, svg: SVGSVGElement): void {
  const viewBox = svg.viewBox.baseVal
  const {left, top} = percentOfViewBox(point, svg)
  popover.style.setProperty('--anchor-x', left)
  popover.style.setProperty('--anchor-y', top)
  popover.classList.toggle('to-left', point.x - viewBox.x > viewBox.width / 2)
  popover.classList.toggle('upward', point.y - viewBox.y > viewBox.height / 2)
}

function restoredState(state: QuizState, seed: number, level: Level, choice: Choice | null): QuizState {
  const situation = generateSituation(seed)
  const question = {...state, situation, level, target: null, shot: null, result: null, popoverOpen: false, drawerExpanded: false}
  if (choice === null) {
    return question
  } else {
    return {...question, target: choice.point, shot: choice.shot, result: scoreChoice(situation, level, choice.point, choice.shot), drawerExpanded: true}
  }
}

function roundedToCentimetre(point: Point): Point {
  return {x: Math.round(point.x * 100) / 100, y: Math.round(point.y * 100) / 100}
}

function stateSearch(state: QuizState): string {
  return situationSearch(state.situation.seed, state.level, state.result === null ? null : {point: state.result.choice.point, shot: state.result.choice.shot})
}

let removeGlobalListeners = (): void => undefined

export function startApp(root: HTMLElement): void {
  const params = readSituationParams(window.location.search)
  const emptyState: QuizState = {
    situation: generateSituation(params.seed ?? Date.now()),
    level: params.level ?? DEFAULT_LEVEL,
    target: null,
    shot: null,
    result: null,
    popoverOpen: false,
    drawerExpanded: false,
  }
  let state = nextState(emptyState, {type: 'restore-situation', seed: emptyState.situation.seed, level: emptyState.level, choice: params.choice})
  history.replaceState(null, '', stateSearch(state))
  let preview: Point | null = null

  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  const zoneLayer = layer()
  zoneLayer.setAttribute('clip-path', `url(#${HALF_OF_B_CLIP_ID})`)
  const shotLayer = layer()
  const playerLayer = layer()
  const returnLayer = layer()
  const previewLayer = layer()
  previewLayer.setAttribute('opacity', String(PREVIEW_OPACITY))
  renderCourt(svg)
  svg.append(halfOfBClip(), zoneLayer, shotLayer, returnLayer, previewLayer, playerLayer)

  const courtFrame = document.createElement('div')
  courtFrame.className = 'court-frame'
  const viewBox = svg.viewBox.baseVal
  courtFrame.style.setProperty('--court-aspect', String(viewBox.width / viewBox.height))
  const banner = document.createElement('div')
  banner.className = 'shot-banner'
  banner.style.height = `${(100 * BANNER_RESERVED_METRES) / viewBox.height}%`
  const popover = document.createElement('div')
  popover.className = 'shot-popover'
  const tagLayer = document.createElement('div')
  tagLayer.className = 'trajectory-tags'
  const hint = document.createElement('div')
  hint.className = 'court-hint'
  hint.textContent = 'Clique sur le terrain de B pour choisir ton retour.'
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
  courtFrame.append(svg, tagLayer, banner, hint, popover, bottomStack)
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
    renderCourtTags(tagLayer, state, svg)
    if (result === null) {
      zoneLayer.replaceChildren()
      renderShotB(shotLayer, situation)
      renderPlayers(playerLayer, situation, 'question')
      returnLayer.replaceChildren(...(state.target === null ? [] : studentReturn(situation.impact, state.target, state.shot)))
    } else {
      const {best, bestZone, alternativeZone} = result.analysis
      shotLayer.replaceChildren()
      renderPlayers(playerLayer, {...situation, playerA: situation.impact}, 'reveal')
      zoneLayer.replaceChildren(
        ...(bestZone === null ? [] : [zoneEllipse(bestZone, 1)]),
        ...(alternativeZone === null ? [] : [zoneEllipse(alternativeZone, 2)]),
      )
      returnLayer.replaceChildren(
        ...(best.value === 0 ? [] : bestReturn(situation.impact, best)),
        ...revealedStudentReturn(situation.impact, result.choice),
      )
    }
  }

  function dispatch(action: QuizAction): void {
    state = nextState(state, action)
    const search = stateSearch(state)
    const answerJustRevealed = action.type === 'validate' && search !== window.location.search
    if (action.type === 'new-situation' || answerJustRevealed) {
      history.pushState(null, '', search)
    } else {
      history.replaceState(null, '', search)
    }
    renderBoard()
    renderPreview()
    renderChrome()
  }

  function renderChrome(): void {
    renderControls(controlsBar, state, dispatch)
    renderLegend(legend, state)
    renderBanner(banner, state)
    hint.hidden = state.result !== null
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
  removeGlobalListeners()
  const closePopoverOnEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && state.popoverOpen) {
      dispatch({type: 'close-popover'})
    }
  }
  document.addEventListener('keydown', closePopoverOnEscape)
  const showSituationOfAddressBar = (): void => {
    const restored = readSituationParams(window.location.search)
    dispatch({type: 'restore-situation', seed: restored.seed ?? state.situation.seed, level: restored.level ?? DEFAULT_LEVEL, choice: restored.choice})
  }
  window.addEventListener('popstate', showSituationOfAddressBar)
  removeGlobalListeners = () => {
    document.removeEventListener('keydown', closePopoverOnEscape)
    window.removeEventListener('popstate', showSituationOfAddressBar)
  }
  renderLegendVisibility()
  renderBoard()
  renderChrome()
}
