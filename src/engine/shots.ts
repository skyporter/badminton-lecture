import {depthFromNet} from './court'
import {FRONT_MAXIMUM_DEPTH} from './rules'
import type {Point} from './types'

export type ShotId =
  | 'serve-short'
  | 'serve-long'
  | 'clear-high'
  | 'clear-attack'
  | 'smash'
  | 'drop-slow'
  | 'drop-fast'
  | 'net'
  | 'lob-defensive'
  | 'lob-attack'
  | 'drive'
  | 'block'

export type Speed = 'very-fast' | 'fast' | 'medium' | 'slow'
export type Arc = 'flat' | 'low' | 'high'
export type Arrival = 'high' | 'mid' | 'low'
export type HitZone = 'rear' | 'mid' | 'front'

export interface Shot {
  id: ShotId
  label: string
  speed: Speed
  arc: Arc
  arrival: Arrival
  flightTime: number
  landingDepth: [number, number]
  playableFrom: HitZone[]
  serve: boolean
}

const REAR_MINIMUM_DEPTH = 4.7

export const SHOTS: Record<ShotId, Shot> = {
  'serve-short': {id: 'serve-short', label: 'Service court', speed: 'slow', arc: 'low', arrival: 'low', flightTime: 1.0, landingDepth: [1.98, 2.6], playableFrom: [], serve: true},
  'serve-long': {id: 'serve-long', label: 'Service long', speed: 'slow', arc: 'high', arrival: 'high', flightTime: 1.6, landingDepth: [5.9, 6.7], playableFrom: [], serve: true},
  'clear-high': {id: 'clear-high', label: 'Dégagement haut', speed: 'slow', arc: 'high', arrival: 'high', flightTime: 1.6, landingDepth: [5.4, 6.6], playableFrom: ['rear', 'mid'], serve: false},
  'clear-attack': {id: 'clear-attack', label: "Dégagement d'attaque", speed: 'fast', arc: 'low', arrival: 'high', flightTime: 1.1, landingDepth: [5.0, 6.5], playableFrom: ['rear', 'mid'], serve: false},
  'smash': {id: 'smash', label: 'Smash', speed: 'very-fast', arc: 'flat', arrival: 'mid', flightTime: 0.5, landingDepth: [2.0, 5.0], playableFrom: ['rear', 'mid'], serve: false},
  'drop-slow': {id: 'drop-slow', label: 'Amorti lent', speed: 'medium', arc: 'flat', arrival: 'low', flightTime: 1.1, landingDepth: [0.4, 2.0], playableFrom: ['rear', 'mid'], serve: false},
  'drop-fast': {id: 'drop-fast', label: 'Amorti rapide', speed: 'fast', arc: 'flat', arrival: 'low', flightTime: 0.8, landingDepth: [1.8, 3.2], playableFrom: ['rear', 'mid'], serve: false},
  'net': {id: 'net', label: 'Filet', speed: 'slow', arc: 'flat', arrival: 'low', flightTime: 0.9, landingDepth: [0.2, 1.8], playableFrom: ['front'], serve: false},
  'lob-defensive': {id: 'lob-defensive', label: 'Lob défensif', speed: 'slow', arc: 'high', arrival: 'high', flightTime: 1.6, landingDepth: [5.4, 6.6], playableFrom: ['front', 'mid'], serve: false},
  'lob-attack': {id: 'lob-attack', label: "Lob d'attaque", speed: 'fast', arc: 'low', arrival: 'high', flightTime: 1.0, landingDepth: [5.0, 6.5], playableFrom: ['front'], serve: false},
  'drive': {id: 'drive', label: 'Drive', speed: 'fast', arc: 'flat', arrival: 'mid', flightTime: 0.6, landingDepth: [2.5, 5.0], playableFrom: ['mid'], serve: false},
  'block': {id: 'block', label: 'Contre-amorti', speed: 'slow', arc: 'flat', arrival: 'low', flightTime: 0.7, landingDepth: [0.2, 1.8], playableFrom: ['mid'], serve: false},
}

export const RETURN_SHOTS: ShotId[] = (Object.keys(SHOTS) as ShotId[]).filter((shotId) => !SHOTS[shotId].serve)

export function hitZoneOf(point: Point): HitZone {
  const depth = depthFromNet(point)
  if (depth > REAR_MINIMUM_DEPTH) return 'rear'
  if (depth < FRONT_MAXIMUM_DEPTH) return 'front'
  return 'mid'
}
