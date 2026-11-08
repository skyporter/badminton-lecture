// @vitest-environment jsdom
import {describe, expect, it} from 'vitest'
import {generateSituation} from '../../src/engine/generator'
import {SHOT_FAMILIES} from '../../src/engine/rules'
import {SHOTS} from '../../src/engine/shots'
import type {QuizState} from '../../src/ui/app'
import {renderShotPopover} from '../../src/ui/panel'

describe('shot buttons', () => {
  const state: QuizState = {situation: generateSituation(1), level: 'intermediaire', target: null, shot: null, result: null, popoverOpen: true, drawerExpanded: false}

  function renderedGroups(): HTMLElement[] {
    const container = document.createElement('div')
    renderShotPopover(container, state, () => undefined)
    return [...container.querySelectorAll<HTMLElement>('.shot-group')]
  }

  it('shows three labelled groups in order', () => {
    const headings = renderedGroups().map((group) => group.querySelector('.label')!.textContent)
    expect(headings).toEqual(["Vers l'avant", 'Vers le fond', 'Rapides'])
  })

  it('puts exactly the family members in each group', () => {
    const labelsPerGroup = renderedGroups().map((group) => [...group.querySelectorAll('button')].map((button) => button.textContent))
    expect(labelsPerGroup).toEqual([
      SHOT_FAMILIES.front.map((shot) => SHOTS[shot].label),
      SHOT_FAMILIES.rear.map((shot) => SHOTS[shot].label),
      SHOT_FAMILIES.flat.map((shot) => SHOTS[shot].label),
    ])
    expect(labelsPerGroup.flat()).toHaveLength(10)
  })
})
