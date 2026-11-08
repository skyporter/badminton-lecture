// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {scoreChoice} from '../../src/engine/analysis'
import {generateSituation} from '../../src/engine/generator'
import {SHOTS} from '../../src/engine/shots'
import type {QuizState} from '../../src/ui/app'
import {loadLegendVisible, renderLegend, saveLegendVisible} from '../../src/ui/legend'

const situation = generateSituation(5)
const questionState: QuizState = {situation, level: 'debutant', target: null, shot: null, result: null, popoverOpen: false, drawerExpanded: false}
const backLine = {x: 3, y: 0.3}
const revealedState: QuizState = {...questionState, target: backLine, shot: 'net', result: scoreChoice(situation, 'debutant', backLine, 'net')}

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'clear'> {
  const entries = new Map<string, string>()
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, value),
    clear: () => entries.clear(),
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('legend visibility storage', () => {
  it('hides the legend by default on mobile and shows it on desktop', () => {
    localStorage.clear()
    expect(loadLegendVisible(true)).toBe(false)
    expect(loadLegendVisible(false)).toBe(true)
  })

  it('remembers the choice', () => {
    saveLegendVisible(true)
    expect(loadLegendVisible(true)).toBe(true)
    saveLegendVisible(false)
    expect(loadLegendVisible(false)).toBe(false)
  })

  it('falls back to defaults when storage throws', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('localStorage', {getItem: blocked, setItem: blocked})
    expect(loadLegendVisible(true)).toBe(false)
    expect(loadLegendVisible(false)).toBe(true)
    expect(() => saveLegendVisible(true)).not.toThrow()
  })
})

describe('renderLegend', () => {
  function legendText(state: QuizState): string {
    const container = document.createElement('div')
    renderLegend(container, state)
    return container.textContent ?? ''
  }

  it('names B shot of the situation in the question phase', () => {
    const text = legendText(questionState)
    ;['A\u00a0: toi', `coup de B\u00a0: ${SHOTS[situation.shotB].label}`, 'point de chute', 'ton retour au survol'].forEach((entry) => expect(text).toContain(entry))
    expect(text).not.toContain('zone 1')
  })

  it('names the chosen shot once a shot is picked', () => {
    expect(legendText({...questionState, target: backLine, shot: 'net'})).toContain('ton retour\u00a0: Filet')
  })

  it('names the student return, the best return and both zones in the reveal', () => {
    const {best, bestZone, alternativeZone} = revealedState.result!.analysis
    const text = legendText(revealedState)
    expect(text).toContain('B au moment de sa frappe')
    expect(text).toContain('ton retour\u00a0: Filet')
    expect(text).toContain(`meilleur retour\u00a0: ${SHOTS[best.shot].label}`)
    expect(text).toContain(`zone 1 · meilleur coup\u00a0: ${SHOTS[bestZone!.shot].label}`)
    if (alternativeZone !== null) expect(text).toContain(`zone 2 · deuxième choix\u00a0: ${SHOTS[alternativeZone.shot].label}`)
    expect(text).not.toContain('point de chute')
    expect(text).not.toContain('meilleur spot')
  })

  it('explains the unreachable part only when the chosen shot falls short', () => {
    expect(legendText(revealedState)).toContain('au-delà de la portée de ton coup')
    const reachable = {...revealedState, result: scoreChoice(situation, 'debutant', {x: 3, y: 6}, 'net')}
    expect(legendText(reachable)).not.toContain('au-delà de la portée de ton coup')
  })

  it('explains the handedness badge', () => {
    expect(legendText(questionState)).toContain('D = droitier, G = gaucher (côté coup droit)')
  })

  it('has no trajectory code block anymore', () => {
    const container = document.createElement('div')
    renderLegend(container, questionState)
    expect(container.querySelector('details')).toBeNull()
  })
})
