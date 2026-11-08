import type {ChoiceResult} from '../engine/analysis'
import {SHOT_DESCRIPTIONS, describeReturn, describeShotB, explainBest, explainChoice} from '../engine/explain'
import type {Situation} from '../engine/generator'
import {SHOT_FAMILIES} from '../engine/rules'
import type {ShotFamily} from '../engine/rules'
import {SHOTS} from '../engine/shots'
import type {Level} from '../engine/types'
import {canValidate} from './app'
import type {QuizAction, QuizState} from './app'

const LEVEL_LABELS: Record<Level, string> = {debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé'}
const SHOT_FAMILY_HEADINGS: Record<ShotFamily, string> = {front: "Vers l'avant", rear: 'Vers le fond', flat: 'Rapides'}
const NO_PLAYABLE_RETURN = "Aucun coup n'est jouable ici : tous les retours sont à éviter."

type Dispatch = (action: QuizAction) => void

function element<K extends keyof HTMLElementTagNameMap>(name: K, className: string, text = ''): HTMLElementTagNameMap[K] {
  const created = document.createElement(name)
  created.className = className
  created.textContent = text
  return created
}

function bulletList(bullets: string[]): HTMLUListElement {
  const list = element('ul', 'bullets')
  list.append(...bullets.map((bullet) => element('li', '', bullet)))
  return list
}

export function renderControls(container: HTMLElement, state: QuizState, dispatch: Dispatch): void {
  const levelSelect = element('select', 'level')
  levelSelect.setAttribute('aria-label', 'Niveau')
  levelSelect.append(...(Object.keys(LEVEL_LABELS) as Level[]).map((level) => new Option(LEVEL_LABELS[level], level, false, level === state.level)))
  levelSelect.addEventListener('change', () => dispatch({type: 'set-level', level: levelSelect.value as Level}))

  const newSituationButton = element('button', 'button', 'Nouvelle situation')
  newSituationButton.addEventListener('click', () => dispatch({type: 'new-situation', seed: Date.now()}))

  container.replaceChildren(levelSelect, newSituationButton)
}

export function renderBanner(container: HTMLElement, state: QuizState): void {
  container.replaceChildren(element('div', 'banner-shot', describeShotB(state.situation)))
}

export function renderShotPopover(container: HTMLElement, state: QuizState, dispatch: Dispatch): void {
  const closeButton = element('button', 'popover-close', '✕')
  closeButton.setAttribute('aria-label', 'Fermer')
  closeButton.addEventListener('click', () => dispatch({type: 'close-popover'}))

  const shotButtons = element('div', 'shots')
  shotButtons.append(...(Object.keys(SHOT_FAMILIES) as ShotFamily[]).map((family) => {
    const group = element('div', 'shot-group')
    const buttons = element('div', 'shot-buttons')
    buttons.append(...SHOT_FAMILIES[family].map((shot) => {
      const button = element('button', shot === state.shot ? 'button shot selected' : 'button shot', SHOTS[shot].label)
      button.title = SHOT_DESCRIPTIONS[shot]
      button.addEventListener('click', () => dispatch({type: 'set-shot', shot}))
      return button
    }))
    group.append(element('div', 'label', SHOT_FAMILY_HEADINGS[family]), buttons)
    return group
  }))

  const validateButton = element('button', 'button validate', 'Valider')
  validateButton.disabled = !canValidate(state)
  validateButton.addEventListener('click', () => dispatch({type: 'validate'}))

  if (state.shot === null) {
    container.replaceChildren(closeButton, shotButtons, validateButton)
  } else {
    const description = element('p', 'shot-description', `${SHOTS[state.shot].label}\u00a0: ${SHOT_DESCRIPTIONS[state.shot]}`)
    container.replaceChildren(closeButton, shotButtons, description, validateButton)
  }
}

function revealSection(situation: Situation, result: ChoiceResult): HTMLElement[] {
  const {best, alternative} = result.analysis
  const hasPlayableReturn = best.value > 0
  const choiceBox = element('div', 'choice-box')
  choiceBox.append(
    element('div', 'label', 'Ton choix'),
    element('p', '', `✕ ${describeReturn(result.choice)}`),
    element('p', 'score', `${result.score} / 100`),
  )
  const bestBox = element('div', 'best-box')
  bestBox.append(element('div', 'label', 'Meilleur retour'), element('p', '', hasPlayableReturn ? describeReturn(best) : NO_PLAYABLE_RETURN))
  if (hasPlayableReturn) {
    return [
      choiceBox,
      bestBox,
      element('div', 'label', 'Pourquoi'),
      element('div', 'sublabel', 'Meilleur retour'),
      bulletList(explainBest(situation, result.analysis)),
      element('div', 'sublabel', 'Ton choix'),
      bulletList(explainChoice(situation, result)),
      element('p', 'alternative', `Alternative : ${describeReturn(alternative)}`),
    ]
  } else {
    return [
      choiceBox,
      bestBox,
      element('div', 'label', 'Pourquoi'),
      bulletList(explainChoice(situation, result)),
    ]
  }
}

function drawerSummary(result: ChoiceResult): string {
  const {best} = result.analysis
  const bestReturn = best.value > 0 ? `Meilleur : ${SHOTS[best.shot].label}` : 'Aucun coup jouable'
  if (result.choice.infeasibility === 'zone') {
    return `Score : ${result.score} / 100 — ${SHOTS[result.choice.shot].label} impossible jusque-là — ${bestReturn}`
  } else {
    return `Score : ${result.score} / 100 — ${bestReturn}`
  }
}

export function renderDrawer(container: HTMLElement, state: QuizState, dispatch: Dispatch): void {
  container.hidden = state.result === null
  container.classList.toggle('expanded', state.drawerExpanded)
  if (state.result === null) {
    container.replaceChildren()
  } else {
    const toggle = element('button', 'drawer-toggle')
    toggle.setAttribute('aria-expanded', String(state.drawerExpanded))
    toggle.append(element('span', 'drawer-summary', drawerSummary(state.result)), element('span', 'drawer-chevron', state.drawerExpanded ? '▾' : '▴'))
    toggle.addEventListener('click', () => dispatch({type: 'toggle-drawer'}))
    if (state.drawerExpanded) {
      const body = element('div', 'drawer-body')
      body.append(...revealSection(state.situation, state.result))
      container.replaceChildren(toggle, body)
    } else {
      container.replaceChildren(toggle)
    }
  }
}
