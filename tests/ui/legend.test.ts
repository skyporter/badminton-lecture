// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {loadLegendVisible, renderLegend, saveLegendVisible} from '../../src/ui/legend'

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
  function legendText(phase: 'question' | 'reveal'): string {
    const container = document.createElement('div')
    renderLegend(container, phase)
    return container.textContent ?? ''
  }

  it('lists the question entries', () => {
    const text = legendText('question')
    ;['A : toi', 'arc blanc = côté coup droit', 'coup de B', 'point de chute', 'ton retour au survol'].forEach((entry) => expect(text).toContain(entry))
    expect(text).not.toContain('meilleur spot')
  })

  it('lists the reveal entries', () => {
    const text = legendText('reveal')
    ;['B au moment de sa frappe', 'B replacé', 'ton retour', 'meilleur retour', 'au-delà de la portée de ton coup', 'meilleur spot', 'bon retour', 'à éviter'].forEach((entry) => expect(text).toContain(entry))
    expect(text).not.toContain('point de chute')
  })

  it('shows the six trajectory styles in a collapsible block', () => {
    const container = document.createElement('div')
    renderLegend(container, 'question')
    const details = container.querySelector('details')!
    expect(details.querySelectorAll('.legend-row')).toHaveLength(6)
  })

  it('keeps the collapsible block open across phases', () => {
    const container = document.createElement('div')
    renderLegend(container, 'question')
    container.querySelector('details')!.open = true
    renderLegend(container, 'reveal')
    expect(container.querySelector('details')!.open).toBe(true)
  })
})
