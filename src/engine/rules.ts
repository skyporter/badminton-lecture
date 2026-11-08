import type {Arrival, ShotId} from './shots'
import type {Level, Point, Status} from './types'

export type CriterionId = 'reachTime' | 'weakSide' | 'risk' | 'recoveryTime' | 'pressure'

export const WEIGHTS: Record<Level, Record<CriterionId, number>> = {
  debutant: {risk: 0.4, recoveryTime: 0.25, reachTime: 0.25, weakSide: 0.05, pressure: 0.05},
  intermediaire: {reachTime: 0.35, pressure: 0.2, risk: 0.2, recoveryTime: 0.15, weakSide: 0.1},
  avance: {reachTime: 0.425, pressure: 0.25, weakSide: 0.125, risk: 0.1, recoveryTime: 0.1},
}

export const SHOT_RISK: Record<ShotId, number> = {
  'serve-short': 0.4,
  'serve-long': 0.1,
  'clear-high': 0.1,
  'clear-attack': 0.35,
  'smash': 0.6,
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

export const ALLOWED_BY_STATUS: Record<Status, Partial<Record<Arrival, ShotId[]>>> = {
  attaque: {
    high: ['clear-high', 'clear-attack', 'smash', 'drop-slow', 'drop-fast'],
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

export const FRONT_MAXIMUM_DEPTH = 2.3
export const REAR_MINIMUM_DEPTH = 4.7
export const PLAYER_SPEED = 4.0
export const REACTION_TIME = 0.25
export const ATTACK_MARGIN = 0.3
export const NEUTRAL_MARGIN_BY_ARRIVAL: Record<Arrival, number> = {high: 0, mid: 0.2, low: 0.4}
export const LINE_RISK_DISTANCE = 0.5
export const B_REACH = 0.8
export const B_SPEED = 4.0
export const BEHIND_THRESHOLD = 0.35
export const BEHIND_PENALTY_PER_METER = 0.3
export const CROSS_FLIGHT_TIME_FACTOR = 1.1
export const REACH_REFERENCE_TIME = 1.0
export const CROSS_RISK: Record<'neutral' | 'defense', number> = {neutral: 0.1, defense: 0.4}
export const WEAK_SIDE_BACKHAND_VALUE = 1
export const WEAK_SIDE_FOREHAND_REAR_VALUE = 0.5
export const PRESSURE_MULTIPLIER_BY_STATUS: Record<Status, number> = {attaque: 1, neutre: 0.6, defense: 0.3}
export const LANDING_DEPTH_TOLERANCE = 0.3
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

export const LIKELY_REPLIES: Record<ShotId, ShotId[]> = {
  'serve-short': ['net', 'lob-defensive'],
  'serve-long': ['clear-high', 'drop-slow', 'smash'],
  'clear-high': ['clear-high', 'drop-slow', 'smash'],
  'clear-attack': ['clear-high', 'drop-slow', 'smash'],
  'smash': ['block', 'lob-defensive'],
  'drop-slow': ['net', 'lob-defensive'],
  'drop-fast': ['net', 'lob-defensive'],
  'net': ['net', 'lob-defensive'],
  'lob-defensive': ['clear-high', 'drop-slow', 'smash'],
  'lob-attack': ['clear-high', 'drop-slow', 'smash'],
  'drive': ['block', 'lob-defensive'],
  'block': ['net', 'lob-defensive'],
}

export const EXPLAIN_CRITERIA_MAXIMUM = 3
export const EXPLAIN_GAP_THRESHOLD = 0.05
export const EXPLAIN_FOR_MINIMUM_RAW = 0.5
export const EXCELLENT_SCORE = 90

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
  B_REACH: ['dearBadminton', 'badmintonBibleCentralBase'],
  B_SPEED: ['dearBadminton', 'epsGrenoble'],
  BEHIND_THRESHOLD: ['dearBadminton', 'wikibooksStrategy'],
  BEHIND_PENALTY_PER_METER: ['dearBadminton', 'wikibooksStrategy'],
  CROSS_FLIGHT_TIME_FACTOR: ['badmintonBibleCrossNet', 'badmintonBibleCrossLift'],
  REACH_REFERENCE_TIME: ['dearBadminton'],
  CROSS_RISK: ['badmintonBibleCrossNet', 'badmintonBibleCrossLift', 'mobilesport'],
  WEAK_SIDE: ['badmintonCoach', 'wikibooksStrategy'],
  PRESSURE_MULTIPLIER_BY_STATUS: ['mobilesport', 'epsGrenoble'],
  FRONT_MAXIMUM_DEPTH: ['badmintonBibleCrossNet', 'epsGrenoble'],
  REAR_MINIMUM_DEPTH: ['badmintonBibleCrossNet', 'epsGrenoble'],
  LIKELY_REPLIES: ['mobilesport', 'wikibooksStrategy', 'badmintonBibleDrops'],
}

export const SERVE_PROBABILITY = 0.15
export const SERVER_SCORE_MAXIMUM = 20
export const SERVER_DEPTH_BEHIND_SHORT_LINE: [number, number] = [0.3, 1.0]
export const SERVER_X_RANGE_BY_SIDE: Record<'right' | 'left', [number, number]> = {right: [2.0, 2.9], left: [3.2, 4.1]}
export const RECEIVER_SERVE_DEPTH = 3.0
export const RECEIVER_SERVE_CENTER_OFFSET = 0.5
export const SERVE_LANDING_X_RANGE_BY_SIDE: Record<'right' | 'left', [number, number]> = {right: [3.2, 5.5], left: [0.6, 2.9]}
export const SERVE_SHOT_IDS: ['serve-short', 'serve-long'] = ['serve-short', 'serve-long']
export const LINE_DIRECTION_PROBABILITY = 0.6
export const LANDING_X_RANGE_BY_SIDE: Record<'low' | 'high', [number, number]> = {low: [0.6, 2.4], high: [3.7, 5.5]}
export const RECEIVER_BASE: Point = {x: 3.05, y: 10.6}
export const RECEIVER_BASE_SPREAD = 1
export const HIGH_ARRIVAL_IMPACT_ADVANCE = 0.3

export type ShotFamily = 'front' | 'rear' | 'flat'

export const SHOT_FAMILIES: Record<ShotFamily, ShotId[]> = {
  front: ['drop-slow', 'drop-fast', 'net', 'block'],
  rear: ['clear-high', 'clear-attack', 'lob-defensive', 'lob-attack'],
  flat: ['smash', 'drive'],
}

export const ALTERNATIVE_MINIMUM_DISTANCE = 2.0
export const MAP_CELL_STEP = 0.1
export const ZONE_VALUE_RATIO = 0.9
export const ZONE_MAXIMUM_DISTANCE = 1.5
export const ZONE_MINIMUM_RADIUS = 0.3
