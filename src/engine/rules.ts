import type {Arrival, ShotId} from './shots'
import type {Level, Point, Status} from './types'

export type CriterionId = 'distance' | 'weakSide' | 'risk' | 'recoveryTime' | 'pressure'

export const WEIGHTS: Record<Level, Record<CriterionId, number>> = {
  debutant: {risk: 0.35, recoveryTime: 0.25, distance: 0.2, weakSide: 0.15, pressure: 0.05},
  intermediaire: {distance: 0.3, pressure: 0.2, risk: 0.2, recoveryTime: 0.15, weakSide: 0.15},
  avance: {distance: 0.35, pressure: 0.25, weakSide: 0.2, risk: 0.1, recoveryTime: 0.1},
}

export const SHOT_RISK: Record<ShotId, number> = {
  'serve-short': 0.4,
  'serve-long': 0.1,
  'clear-high': 0.1,
  'clear-attack': 0.35,
  'smash': 0.5,
  'drop-slow': 0.5,
  'drop-fast': 0.45,
  'net': 0.5,
  'lob-defensive': 0.1,
  'lob-attack': 0.4,
  'drive': 0.5,
  'block': 0.5,
}

export const SHOT_RECOVERY: Record<ShotId, number> = {
  'serve-short': 0.7,
  'serve-long': 0.8,
  'clear-high': 0.9,
  'clear-attack': 0.6,
  'smash': 0.3,
  'drop-slow': 0.6,
  'drop-fast': 0.5,
  'net': 0.7,
  'lob-defensive': 0.9,
  'lob-attack': 0.6,
  'drive': 0.4,
  'block': 0.6,
}

export const SHOT_PRESSURE: Record<ShotId, number> = {
  'serve-short': 0.3,
  'serve-long': 0.2,
  'clear-high': 0.1,
  'clear-attack': 0.4,
  'smash': 0.95,
  'drop-slow': 0.45,
  'drop-fast': 0.7,
  'net': 0.5,
  'lob-defensive': 0.1,
  'lob-attack': 0.5,
  'drive': 0.6,
  'block': 0.5,
}

export const ALLOWED_BY_STATUS: Record<Status, Record<Arrival, ShotId[]>> = {
  attaque: {
    high: ['clear-high', 'clear-attack', 'smash', 'drop-slow', 'drop-fast'],
    mid: ['drive', 'smash', 'drop-fast', 'block'],
    low: ['net', 'lob-attack'],
  },
  neutre: {
    high: ['clear-high', 'clear-attack', 'drop-slow', 'drop-fast'],
    mid: ['drive', 'block', 'lob-defensive'],
    low: ['net', 'lob-attack', 'lob-defensive'],
  },
  defense: {
    high: ['clear-high', 'drop-slow'],
    mid: ['block', 'lob-defensive'],
    low: ['lob-defensive', 'net'],
  },
}

export const PLAYER_SPEED = 4.0
export const REACTION_TIME = 0.25
export const ATTACK_MARGIN = 0.3
export const NEUTRAL_MARGIN_BY_ARRIVAL: Record<Arrival, number> = {high: 0, mid: 0.2, low: 0.4}
export const LINE_RISK_DISTANCE = 0.5
export const RECOVERY_FULL_TIME = 1.2
export const RECOVERY_MIN_FRACTION = 0.3
export const RECOVERY_CROSS_PENALTY = 0.2

export const B_BASE: Record<'back' | 'neutral' | 'front', Point> = {
  back: {x: 3.05, y: 3.4},
  neutral: {x: 3.05, y: 3.9},
  front: {x: 3.05, y: 4.6},
}

export const RECOVERY_BASE_BY_SHOT: Record<ShotId, 'back' | 'neutral' | 'front'> = {
  'serve-short': 'front',
  'serve-long': 'back',
  'clear-high': 'back',
  'clear-attack': 'back',
  'smash': 'neutral',
  'drop-slow': 'neutral',
  'drop-fast': 'back',
  'net': 'front',
  'lob-defensive': 'back',
  'lob-attack': 'back',
  'drive': 'neutral',
  'block': 'front',
}

export const SOURCES: Record<string, {label: string; url: string}> = {
  mobilesport: {
    label: 'mobilesport.ch, tactique et bons choix',
    url: 'https://assets01.sdd1.ch/assets/lbwp-cdn/mobilesport/files/1676392051/mobilesport-badminton--tactique-bons-choix.pdf',
  },
  wikibooksStrategy: {
    label: 'Wikibooks, Badminton/Strategy',
    url: 'https://en.wikibooks.org/wiki/Badminton/Strategy',
  },
  badmintonBibleCentralBase: {
    label: 'Badminton Bible, base centrale',
    url: 'https://badmintonbible.com/tactics/singles/central-base',
  },
  badmintonBibleCrossNet: {
    label: 'Badminton Bible, filet croisé',
    url: 'https://badmintonbible.com/shots/forecourt/net-shots/cross',
  },
  badmintonBibleCrossLift: {
    label: 'Badminton Bible, lob croisé',
    url: 'https://www.badmintonbible.com/shots/forecourt/lifts/cross',
  },
  dearBadminton: {
    label: 'Dear Badminton, adversaire hors de sa base',
    url: 'https://dearbadminton.com/best-shot-to-play-when-opponent-fails-to-return-to-base-position',
  },
  badmintonBibleDrops: {
    label: 'Badminton Bible, amortis',
    url: 'https://badmintonbible.com/tactics/singles/building-shots/drops',
  },
  badmintonCoach: {
    label: 'badminton-coach.co.uk, coups vers le revers',
    url: 'https://badminton-coach.co.uk/discussion-forum/intermediate-general-qa/better-shots-down-the-backhand-side',
  },
  epsGrenoble: {
    label: 'Référentiel EPS Grenoble',
    url: 'https://eps-pedagogie.web.ac-grenoble.fr/sites/default/files/media-d7/media-fichiers/2019-12/bcp_referentiel_badminton.pdf',
  },
}

export const RULE_SOURCES: Record<string, string[]> = {
  WEIGHTS: ['epsGrenoble'],
  SHOT_RISK: ['mobilesport', 'wikibooksStrategy', 'badmintonBibleCrossNet', 'badmintonBibleCrossLift'],
  SHOT_RECOVERY: ['mobilesport', 'wikibooksStrategy', 'badmintonBibleCentralBase'],
  SHOT_PRESSURE: ['badmintonBibleDrops', 'dearBadminton'],
  ALLOWED_BY_STATUS: ['mobilesport', 'wikibooksStrategy', 'epsGrenoble'],
  B_BASE: ['badmintonBibleCentralBase', 'dearBadminton'],
  ATTACK_MARGIN: ['epsGrenoble', 'badmintonCoach'],
  NEUTRAL_MARGIN_BY_ARRIVAL: ['epsGrenoble', 'badmintonCoach'],
  RECOVERY_BASE_BY_SHOT: ['badmintonBibleCentralBase', 'dearBadminton'],
}
