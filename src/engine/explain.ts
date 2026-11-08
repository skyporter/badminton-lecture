import type {Analysis, ChoiceResult} from './analysis'
import {CENTER_X, depthFromNet, forehandIsPositiveX, isInSinglesHalf} from './court'
import type {CriterionScore, PairEvaluation} from './evaluate'
import type {Situation} from './generator'
import {EXCELLENT_SCORE, EXPLAIN_CRITERIA_MAXIMUM, EXPLAIN_FOR_MINIMUM_RAW, EXPLAIN_GAP_THRESHOLD, LIKELY_REPLIES, WEAK_SIDE_BACKHAND_VALUE} from './rules'
import type {CriterionId} from './rules'
import {SHOTS, hitZoneOf} from './shots'
import type {Arrival, HitZone, ShotId} from './shots'
import type {Direction, Status} from './types'

const STATUS_BULLETS: Record<Status, string> = {
  attaque: 'Tu es en attaque : volant pris haut et tôt, tu peux accélérer.',
  neutre: 'Situation neutre : tu as le temps, sans pouvoir attaquer.',
  defense: "Tu es en défense : volant pris bas, tard ou loin, joue d'abord pour te replacer.",
}

export const FOR_BULLETS: Record<CriterionId, string> = {
  reachTime: 'Le point est loin de B replacé : il a du mal à arriver avant le volant.',
  weakSide: 'Tu vises le fond côté revers de B, son côté faible.',
  risk: 'Coup sûr : loin des lignes, sans croisé hors équilibre.',
  recoveryTime: 'Ce coup te laisse le temps de te replacer.',
  pressure: 'Ce coup met B sous pression.',
}

export const REAR_FOR_BULLET = 'Tu vises le fond du terrain de B.'

export const AGAINST_BULLETS: Record<CriterionId, string> = {
  reachTime: 'B atteindra ce point à temps : trop près de lui, ou coup trop lent.',
  weakSide: 'Tu ne vises pas le fond côté revers de B, son côté faible.',
  risk: "Plus risqué : trop près d'une ligne, ou croisé hors équilibre.",
  recoveryTime: 'Ce coup te laisse moins de temps pour te replacer.',
  pressure: 'Ce coup met moins de pression sur B.',
}

const DIRECTION_BULLETS: Record<Direction, string> = {
  ligne: 'En ligne : le plus sûr, sans traverser ton propre terrain.',
  croise: 'Croisé : B doit traverser le terrain en diagonale.',
}

const OUT_OF_COURT_BULLET = 'Le volant sort du terrain.'
const SMASH_TOO_LOW_BULLET = 'Pris aussi bas, tu ne peux pas smasher.'
const NOT_PLAYABLE_BULLET = "Dans ta situation, ce coup n'est pas jouable."
const DROP_TOO_DEEP_BULLET = "Un amorti ne va pas jusqu'au fond."
const TOO_DEEP_BULLET = 'Ce coup ne va pas aussi loin.'
const TOO_SHORT_BULLET = 'Ce coup va plus loin que le point visé.'
const EXCELLENT_BULLET = 'Excellent choix.'
const NEAR_BEST_BULLET = "Bon choix, proche du meilleur\u00a0: l'écart tient à plusieurs petits détails."

const DIRECTION_LABELS: Record<Direction, string> = {ligne: 'en ligne', croise: 'croisé'}
const ZONE_LABELS: Record<HitZone, string> = {rear: 'le fond', mid: 'le milieu', front: "l'avant"}
const ARRIVAL_LABELS: Record<Arrival, string> = {high: 'haut', mid: 'à mi-hauteur', low: 'bas'}
const CONTACT_LABELS: Record<Situation['contact'], string> = {'coup-droit': 'en coup droit', 'revers': 'en revers', 'tour-de-tete': 'en tour de tête'}

const SHOT_NAMES: Record<ShotId, string> = {
  'serve-short': 'un service court',
  'serve-long': 'un service long',
  'clear-high': 'un dégagement haut',
  'clear-attack': "un dégagement d'attaque",
  'smash': 'un smash',
  'drop-slow': 'un amorti lent',
  'drop-fast': 'un amorti rapide',
  'net': 'un filet',
  'lob-defensive': 'un lob défensif',
  'lob-attack': "un lob d'attaque",
  'drive': 'un drive',
  'block': 'un contre-amorti',
}

const DROP_SHOTS: ShotId[] = ['drop-slow', 'drop-fast']

export function describeShotB(situation: Situation): string {
  const shot = SHOTS[situation.shotB]
  const shotWithDirection = situation.isServe ? shot.label : `${shot.label} ${DIRECTION_LABELS[situation.directionB]}`
  const landsOnForehand = (situation.landing.x > CENTER_X) === forehandIsPositiveX('A')
  const side = landsOnForehand ? 'coup droit' : 'revers'
  return `${shotWithDirection}, vers ${ZONE_LABELS[hitZoneOf(situation.landing)]} côté ${side} de A. Volant pris ${ARRIVAL_LABELS[situation.arrival]}, ${CONTACT_LABELS[situation.contact]}.`
}

export function describeReturn(evaluation: PairEvaluation): string {
  const {label} = SHOTS[evaluation.shot]
  if (!isInSinglesHalf(evaluation.point, 'B')) return `${label}, hors du terrain de simple de B.`

  const landsOnForehand = (evaluation.point.x > CENTER_X) === forehandIsPositiveX('B')
  const side = landsOnForehand ? 'coup droit' : 'revers'
  return `${label} ${DIRECTION_LABELS[evaluation.direction]}, vers ${ZONE_LABELS[hitZoneOf(evaluation.point)]} côté ${side} de B.`
}

export function explainBest(situation: Situation, analysis: Analysis): string[] {
  const {best} = analysis
  const strongestCriteria = best.criteria
    .filter((criterion) => criterion.raw >= EXPLAIN_FOR_MINIMUM_RAW)
    .sort((first, second) => second.contribution - first.contribution)
    .slice(0, EXPLAIN_CRITERIA_MAXIMUM)
  return [
    STATUS_BULLETS[situation.status],
    ...strongestCriteria.map(forBullet),
    DIRECTION_BULLETS[best.direction],
    predictNextShotB(best),
  ]
}

export function explainChoice(situation: Situation, result: ChoiceResult): string[] {
  const {choice, analysis} = result
  if (!choice.feasible) return [infeasibilityBullet(situation, choice)]

  const gaps = analysis.best.criteria.map((bestCriterion) => ({
    id: bestCriterion.id,
    gap: bestCriterion.contribution - choice.criteria.find((criterion) => criterion.id === bestCriterion.id)!.contribution,
  }))
  const againstBullets = gaps
    .filter(({gap}) => gap > EXPLAIN_GAP_THRESHOLD)
    .sort((first, second) => second.gap - first.gap)
    .slice(0, EXPLAIN_CRITERIA_MAXIMUM)
    .map(({id}) => AGAINST_BULLETS[id])
  if (result.score >= EXCELLENT_SCORE) {
    return [EXCELLENT_BULLET, ...againstBullets]
  } else if (againstBullets.length === 0) {
    return [NEAR_BEST_BULLET]
  } else {
    return againstBullets
  }
}

export function predictNextShotB(evaluation: PairEvaluation): string {
  const names = LIKELY_REPLIES[evaluation.shot].map((shot) => SHOT_NAMES[shot])
  const allButLast = names.slice(0, -1).join(', ')
  return `B va probablement jouer ${allButLast} ou ${names[names.length - 1]}.`
}

function forBullet(criterion: CriterionScore): string {
  const onForehandRear = criterion.id === 'weakSide' && criterion.raw !== WEAK_SIDE_BACKHAND_VALUE
  return onForehandRear ? REAR_FOR_BULLET : FOR_BULLETS[criterion.id]
}

function infeasibilityBullet(situation: Situation, choice: PairEvaluation): string {
  switch (choice.infeasibility) {
    case 'dehors':
      return OUT_OF_COURT_BULLET
    case 'statut':
      return choice.shot === 'smash' && situation.arrival !== 'high' ? SMASH_TOO_LOW_BULLET : NOT_PLAYABLE_BULLET
    default:
      return zoneBullet(choice)
  }
}

function zoneBullet(choice: PairEvaluation): string {
  const [minimumDepth] = SHOTS[choice.shot].landingDepth
  if (depthFromNet(choice.point) < minimumDepth) {
    return TOO_SHORT_BULLET
  } else if (DROP_SHOTS.includes(choice.shot) && hitZoneOf(choice.point) === 'rear') {
    return DROP_TOO_DEEP_BULLET
  } else {
    return TOO_DEEP_BULLET
  }
}
