import type {ChoiceResult} from '../engine/analysis'
import {describeReturn, describeShotB, explainBest, explainChoice} from '../engine/explain'
import type {Situation} from '../engine/generator'
import {RETURN_SHOTS, SHOTS} from '../engine/shots'
import type {Level} from '../engine/types'
import {canValidate} from './app'
import type {QuizAction, QuizState} from './app'

const LEVEL_LABELS: Record<Level, string> = {debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé'}
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

function controls(state: QuizState, dispatch: Dispatch): HTMLElement {
  const levelSelect = element('select', 'level')
  levelSelect.setAttribute('aria-label', 'Niveau')
  levelSelect.append(...(Object.keys(LEVEL_LABELS) as Level[]).map((level) => new Option(LEVEL_LABELS[level], level, false, level === state.level)))
  levelSelect.addEventListener('change', () => dispatch({type: 'set-level', level: levelSelect.value as Level}))

  const newSituationButton = element('button', 'button', 'Nouvelle situation')
  newSituationButton.addEventListener('click', () => dispatch({type: 'new-situation', seed: Date.now()}))

  const bar = element('div', 'controls')
  bar.append(levelSelect, newSituationButton)
  return bar
}

function questionSection(state: QuizState, dispatch: Dispatch): HTMLElement[] {
  const shotButtons = element('div', 'shots')
  shotButtons.append(...RETURN_SHOTS.map((shot) => {
    const button = element('button', shot === state.shot ? 'button shot selected' : 'button shot', SHOTS[shot].label)
    button.addEventListener('click', () => dispatch({type: 'set-shot', shot}))
    return button
  }))

  const validateButton = element('button', 'button validate', 'Valider')
  validateButton.disabled = !canValidate(state)
  validateButton.addEventListener('click', () => dispatch({type: 'validate'}))

  return [
    element('div', 'label', 'Coup de B'),
    element('p', '', describeShotB(state.situation)),
    element('div', 'label', 'À toi'),
    element('p', 'step', '1. Clique sur le terrain de B, là où tu renvoies.'),
    element('p', 'step', '2. Choisis ton coup :'),
    shotButtons,
    validateButton,
  ]
}

function revealSection(situation: Situation, result: ChoiceResult): HTMLElement[] {
  const {best, alternative} = result.analysis
  const hasPlayableReturn = best.value > 0
  const choiceSection = [
    element('div', 'label', 'Ton choix'),
    element('p', '', `✕ ${describeReturn(result.choice)}`),
    element('div', 'label', 'Score'),
    element('p', 'score', `${result.score} / 100`),
    element('div', 'label', 'Meilleur retour'),
  ]
  if (hasPlayableReturn) {
    return [
      ...choiceSection,
      element('p', '', describeReturn(best)),
      element('div', 'label', 'Pourquoi'),
      element('div', 'sublabel', 'Meilleur retour'),
      bulletList(explainBest(situation, result.analysis)),
      element('div', 'sublabel', 'Ton choix'),
      bulletList(explainChoice(situation, result)),
      element('p', 'alternative', `Alternative (vert clair) : ${describeReturn(alternative)}`),
    ]
  } else {
    return [
      ...choiceSection,
      element('p', '', NO_PLAYABLE_RETURN),
      element('div', 'label', 'Pourquoi'),
      bulletList(explainChoice(situation, result)),
    ]
  }
}

export function renderPanel(container: HTMLElement, state: QuizState, dispatch: Dispatch): void {
  const section = state.result === null ? questionSection(state, dispatch) : revealSection(state.situation, state.result)
  container.replaceChildren(controls(state, dispatch), ...section)
}
