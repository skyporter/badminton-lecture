import {buildSituation} from '../../src/engine/generator'
import type {Situation} from '../../src/engine/generator'

export const F1: Situation = buildSituation({
  playerA: {x: 3.05, y: 10.6},
  playerBHit: {x: 2.2, y: 2.0},
  shotB: 'clear-attack',
  landing: {x: 1.8, y: 12.4},
})

export const F2: Situation = buildSituation({
  playerA: {x: 2.5, y: 11.5},
  playerBHit: {x: 3.0, y: 1.5},
  shotB: 'drop-fast',
  landing: {x: 4.8, y: 8.6},
})

export const F3: Situation = buildSituation({
  playerA: {x: 2.8, y: 8.5},
  playerBHit: {x: 3.0, y: 5.5},
  shotB: 'net',
  landing: {x: 2.5, y: 7.8},
})

export const F4: Situation = buildSituation({
  playerA: {x: 3.05, y: 10.6},
  playerBHit: {x: 3.5, y: 1.0},
  shotB: 'smash',
  landing: {x: 3.5, y: 10.4},
})

export const F5: Situation = buildSituation({
  playerA: {x: 3.6, y: 9.7},
  playerBHit: {x: 2.5, y: 4.2},
  shotB: 'serve-short',
  landing: {x: 3.5, y: 8.9},
  isServe: true,
})

export const F6: Situation = buildSituation({
  playerA: {x: 3.6, y: 9.7},
  playerBHit: {x: 2.5, y: 4.2},
  shotB: 'serve-long',
  landing: {x: 4.5, y: 13.0},
  isServe: true,
})

export const F7: Situation = buildSituation({
  playerA: {x: 3.05, y: 10.6},
  playerBHit: {x: 5.0, y: 0.8},
  shotB: 'clear-attack',
  landing: {x: 1.2, y: 12.6},
})
