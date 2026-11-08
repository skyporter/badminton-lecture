// @vitest-environment jsdom
import {describe, expect, it} from 'vitest'
import {analyse, scoreChoice} from '../../src/engine/analysis'
import {generateSituation} from '../../src/engine/generator'
import {canValidate, nextState} from '../../src/ui/app'
import type {QuizState} from '../../src/ui/app'

const state: QuizState = {situation: generateSituation(7), level: 'intermediaire', target: null, shot: null, result: null, popoverOpen: false, drawerExpanded: false}
const point = {x: 1.5, y: 2.0}
const answeredState = nextState(nextState(state, {type: 'set-target', point}), {type: 'set-shot', shot: 'clear-high'})
const revealedState = nextState(answeredState, {type: 'validate'})

describe('canValidate', () => {
  it('cannot validate without a target and a shot (Review Focus 2)', () => {
    expect(canValidate({...state, target: null, shot: 'smash'})).toBe(false)
    expect(canValidate({...state, target: point, shot: null})).toBe(false)
  })

  it('can validate once both are chosen', () => {
    expect(canValidate(answeredState)).toBe(true)
  })

  it('cannot validate twice', () => {
    expect(canValidate(revealedState)).toBe(false)
  })
})

describe('nextState', () => {
  it('records the target and the shot', () => {
    expect(answeredState).toMatchObject({target: point, shot: 'clear-high', result: null})
  })

  it('scores the answer on validation', () => {
    expect(revealedState.result).toEqual(scoreChoice(state.situation, 'intermediaire', point, 'clear-high'))
  })

  it('ignores a validation without a shot', () => {
    const withoutShot = nextState(state, {type: 'set-target', point})
    expect(nextState(withoutShot, {type: 'validate'})).toBe(withoutShot)
  })

  it('keeps the answer frozen after the reveal', () => {
    expect(nextState(revealedState, {type: 'set-target', point: {x: 4, y: 1}})).toBe(revealedState)
    expect(nextState(revealedState, {type: 'set-shot', shot: 'smash'})).toBe(revealedState)
  })

  it('resets the answer on a new situation (Review Focus 3)', () => {
    expect(nextState(answeredState, {type: 'new-situation', seed: 3})).toMatchObject({target: null, shot: null, result: null})
    expect(nextState(revealedState, {type: 'new-situation', seed: 3})).toMatchObject({target: null, shot: null, result: null})
  })

  it('generates the situation of the given seed and keeps the level', () => {
    const renewed = nextState({...answeredState, level: 'avance'}, {type: 'new-situation', seed: 3})
    expect(renewed.situation).toEqual(generateSituation(3))
    expect(renewed.level).toBe('avance')
  })

  it('rounds the target to the centimetre so the url restores the same score', () => {
    expect(nextState(state, {type: 'set-target', point: {x: 1.23456, y: 2.34567}}).target).toEqual({x: 1.23, y: 2.35})
  })

  it('restores a validated choice as the reveal', () => {
    const restored = nextState(state, {type: 'restore-situation', seed: 3, level: 'avance', choice: {point, shot: 'clear-high'}})
    expect(restored).toMatchObject({target: point, shot: 'clear-high', popoverOpen: false, drawerExpanded: true})
    expect(restored.result).toEqual(scoreChoice(generateSituation(3), 'avance', point, 'clear-high'))
  })

  it('restores the situation and level of a history entry as a fresh question', () => {
    const restored = nextState(revealedState, {type: 'restore-situation', seed: 3, level: 'debutant', choice: null})
    expect(restored.situation).toEqual(generateSituation(3))
    expect(restored).toMatchObject({level: 'debutant', target: null, shot: null, result: null, popoverOpen: false, drawerExpanded: false})
  })

  it('resets the answer when the level changes before validation (Review Focus 3)', () => {
    expect(nextState(answeredState, {type: 'set-level', level: 'debutant'})).toMatchObject({level: 'debutant', target: null, shot: null, result: null})
  })

  it('recomputes the reveal when the level changes after validation (Review Focus 3)', () => {
    const changed = nextState(revealedState, {type: 'set-level', level: 'avance'})
    expect(changed.result?.analysis).toEqual(analyse(revealedState.situation, 'avance'))
    expect(changed.result).toEqual(scoreChoice(state.situation, 'avance', point, 'clear-high'))
    expect(changed).toMatchObject({situation: state.situation, target: point, shot: 'clear-high'})
  })
})

describe('on-court ui state', () => {
  it('opens the shot popover when a target is placed', () => {
    expect(nextState(state, {type: 'set-target', point})).toMatchObject({target: point, popoverOpen: true})
  })

  it('closes the popover and keeps the cross', () => {
    const closed = nextState(answeredState, {type: 'close-popover'})
    expect(closed).toMatchObject({target: point, shot: 'clear-high', popoverOpen: false})
  })

  it('reopens the popover when the target is placed again', () => {
    const closed = nextState(answeredState, {type: 'close-popover'})
    expect(nextState(closed, {type: 'set-target', point}).popoverOpen).toBe(true)
  })

  it('closes the popover and opens the drawer detail on validation', () => {
    expect(revealedState).toMatchObject({popoverOpen: false, drawerExpanded: true})
    expect(revealedState.result).not.toBeNull()
  })

  it('toggles the drawer only after the reveal', () => {
    const collapsed = nextState(revealedState, {type: 'toggle-drawer'})
    expect(collapsed.drawerExpanded).toBe(false)
    expect(nextState(collapsed, {type: 'toggle-drawer'}).drawerExpanded).toBe(true)
    expect(nextState(answeredState, {type: 'toggle-drawer'})).toBe(answeredState)
  })

  it('keeps the drawer state when the level changes after the reveal', () => {
    const collapsed = nextState(revealedState, {type: 'toggle-drawer'})
    expect(nextState(collapsed, {type: 'set-level', level: 'avance'}).drawerExpanded).toBe(false)
  })

  it('closes the popover when the level changes before validation', () => {
    expect(nextState(answeredState, {type: 'set-level', level: 'debutant'}).popoverOpen).toBe(false)
  })

  it('resets the popover and the drawer on a new situation', () => {
    expect(nextState(revealedState, {type: 'new-situation', seed: 3})).toMatchObject({popoverOpen: false, drawerExpanded: false})
    expect(nextState(answeredState, {type: 'new-situation', seed: 3}).popoverOpen).toBe(false)
  })
})
