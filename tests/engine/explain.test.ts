import {describe, expect, it} from 'vitest'
import {analyse, scoreChoice} from '../../src/engine/analysis'
import {AGAINST_BULLETS, FOR_BULLETS, REAR_FOR_BULLET, describeReturn, describeShotB, explainBest, explainChoice, predictNextShotB} from '../../src/engine/explain'
import {evaluatePair} from '../../src/engine/evaluate'
import {generateSituation} from '../../src/engine/generator'
import {EXPLAIN_FOR_MINIMUM_RAW} from '../../src/engine/rules'
import type {CriterionId} from '../../src/engine/rules'
import {createRng, randomBetween} from '../../src/engine/rng'
import {RETURN_SHOTS} from '../../src/engine/shots'
import type {Level} from '../../src/engine/types'
import {F1, F2, F3, F4, F7} from '../calibration/reference-situations'

const STATUS_BULLETS = {
  attaque: 'Tu es en attaque : volant pris haut et tôt, tu peux accélérer.',
  neutre: 'Situation neutre : tu as le temps, sans pouvoir attaquer.',
  defense: "Tu es en défense : volant pris bas, tard ou loin, joue d'abord pour te replacer.",
}

const PLAIN_SPACE_BEFORE_PUNCTUATION = / [?!:;]/

describe('describeShotB', () => {
  it('describes the attacking clear of F1', () => {
    expect(describeShotB(F1)).toBe("Dégagement d'attaque en ligne, vers le fond côté revers de A. Volant pris haut, en tour de tête.")
  })

  it('describes the fast drop of F2', () => {
    expect(describeShotB(F2)).toBe("Amorti rapide en ligne, vers l'avant côté coup droit de A. Volant pris bas, en coup droit.")
  })
})

describe('describeReturn', () => {
  it('describes a straight return to the front on the forehand of B', () => {
    expect(describeReturn(evaluatePair(F1, 'intermediaire', {x: 1.0, y: 5.6}, 'drop-fast'))).toBe("Amorti rapide en ligne, vers l'avant côté coup droit de B.")
  })

  it('describes a cross-court return to the rear on the backhand of B', () => {
    expect(describeReturn(evaluatePair(F1, 'intermediaire', {x: 5.0, y: 0.9}, 'clear-attack'))).toBe("Dégagement d'attaque croisé, vers le fond côté revers de B.")
  })

  it('says when the return leaves the singles court of B', () => {
    expect(describeReturn(evaluatePair(F1, 'intermediaire', {x: 3, y: 7.5}, 'smash'))).toBe('Smash, hors du terrain de simple de B.')
  })
})

describe('explainBest', () => {
  it('always starts with the status bullet', () => {
    expect(explainBest(F1, analyse(F1, 'avance'))[0]).toBe(STATUS_BULLETS.attaque)
    expect(explainBest(F3, analyse(F3, 'avance'))[0]).toBe(STATUS_BULLETS.neutre)
    expect(explainBest(F4, analyse(F4, 'avance'))[0]).toBe(STATUS_BULLETS.defense)
  })

  it('has a status bullet, up to three criteria, a direction bullet and the likely next shot of B', () => {
    const analysis = analyse(F7, 'intermediaire')
    const bullets = explainBest(F7, analysis)
    expect(bullets.length).toBeGreaterThanOrEqual(4)
    expect(bullets.length).toBeLessThanOrEqual(6)
    expect(['En ligne : le plus sûr, sans traverser ton propre terrain.', 'Croisé : B doit traverser le terrain en diagonale.']).toContain(bullets[bullets.length - 2])
    expect(bullets[bullets.length - 1]).toBe(predictNextShotB(analysis.best))
  })
})

describe('explainBest reasons', () => {
  it('only lists a criterion as a reason when its raw value reaches the threshold', () => {
    const levels: Level[] = ['debutant', 'intermediaire', 'avance']
    let listedReasons = 0
    for (let seed = 1; seed <= 40; seed++) {
      const situation = generateSituation(seed)
      for (const level of levels) {
        const analysis = analyse(situation, level)
        const bullets = explainBest(situation, analysis)
        for (const criterion of analysis.best.criteria) {
          const listed = bullets.includes(FOR_BULLETS[criterion.id]) || (criterion.id === 'weakSide' && bullets.includes(REAR_FOR_BULLET))
          if (listed) {
            listedReasons++
            expect(criterion.raw).toBeGreaterThanOrEqual(EXPLAIN_FOR_MINIMUM_RAW)
          }
        }
      }
    }
    expect(listedReasons).toBeGreaterThan(0)
  })
})

describe('predictNextShotB', () => {
  it('predicts a net or a lob after a drop', () => {
    expect(predictNextShotB(evaluatePair(F1, 'avance', {x: 3, y: 4.5}, 'drop-fast'))).toBe('B va probablement jouer un filet ou un lob défensif.')
  })

  it('predicts a clear, a drop or a smash after a clear', () => {
    expect(predictNextShotB(evaluatePair(F1, 'avance', {x: 3, y: 0.6}, 'clear-high'))).toBe('B va probablement jouer un dégagement haut, un amorti lent ou un smash.')
  })

  it('predicts a block or a defensive lob after a smash', () => {
    expect(predictNextShotB(evaluatePair(F1, 'avance', {x: 3, y: 2}, 'smash'))).toBe('B va probablement jouer un contre-amorti ou un lob défensif.')
  })
})

describe('explainChoice', () => {
  it('gives a single bullet for a click out of the court', () => {
    expect(explainChoice(F1, scoreChoice(F1, 'avance', {x: 3, y: 7.5}, 'smash'))).toEqual(['Le volant sort du terrain.'])
  })

  it('gives a single bullet for a smash on a low shuttle', () => {
    expect(explainChoice(F3, scoreChoice(F3, 'avance', {x: 3, y: 3}, 'smash'))).toEqual(['Pris aussi bas, tu ne peux pas smasher.'])
  })

  it('gives a single bullet for a drop aimed at the back line', () => {
    expect(explainChoice(F1, scoreChoice(F1, 'avance', {x: 3, y: 0.5}, 'drop-slow'))).toEqual(["Un amorti ne va pas jusqu'au fond."])
  })

  it('says excellent choice at 100', () => {
    const {best} = analyse(F1, 'avance')
    const result = scoreChoice(F1, 'avance', best.point, best.shot)
    expect(result.score).toBe(100)
    expect(explainChoice(F1, result)).toEqual(['Excellent choix.'])
  })

  it('falls back to a fixed bullet when a choice under 90 has no gap above 0.05', () => {
    const {best} = analyse(F1, 'avance')
    const nearBest = {...best, value: best.value * 0.85}
    const result = {score: 85, choice: nearBest, analysis: analyse(F1, 'avance')}
    expect(explainChoice(F1, result)).toEqual(['Bon choix, proche du meilleur\u00a0: l\'écart tient à plusieurs petits détails.'])
  })

  it('lists only criteria whose gap with the best pair exceeds 0.05, largest first, three at most', () => {
    const rng = createRng(7)
    for (let iteration = 0; iteration < 40; iteration++) {
      const point = {x: randomBetween(rng, 0.6, 5.5), y: randomBetween(rng, 0.3, 6.5)}
      const shot = RETURN_SHOTS[Math.floor(rng() * RETURN_SHOTS.length)]
      const result = scoreChoice(F1, 'intermediaire', point, shot)
      if (!result.choice.feasible) continue
      const gaps = result.analysis.best.criteria.map((bestCriterion) => ({
        id: bestCriterion.id,
        gap: bestCriterion.contribution - result.choice.criteria.find((criterion) => criterion.id === bestCriterion.id)!.contribution,
      }))
      const expectedIds = gaps.filter(({gap}) => gap > 0.05).sort((first, second) => second.gap - first.gap).slice(0, 3).map(({id}) => id)
      const criterionBullets = explainChoice(F1, result).filter((bullet) => !['Excellent choix.', 'Bon choix, proche du meilleur\u00a0: l\'écart tient à plusieurs petits détails.'].includes(bullet))
      const smallGapIds = gaps.filter(({gap}) => gap <= 0.05).map(({id}) => id)
      for (const id of smallGapIds) expect(criterionBullets.some((bullet) => isAgainstBulletOf(id, bullet))).toBe(false)
      expect(criterionBullets).toHaveLength(expectedIds.length)
      expectedIds.forEach((id, index) => expect(isAgainstBulletOf(id, criterionBullets[index])).toBe(true))
    }
  })
})

describe('French typography', () => {
  it('never puts a plain space before ? ! : ;', () => {
    const levels: Level[] = ['debutant', 'intermediaire', 'avance']
    for (let seed = 1; seed <= 30; seed++) {
      const situation = generateSituation(seed)
      const level = levels[seed % 3]
      const analysis = analyse(situation, level)
      const bullets = [
        describeShotB(situation),
        describeReturn(analysis.best),
        ...explainBest(situation, analysis),
        ...explainChoice(situation, scoreChoice(situation, level, {x: 3, y: 3}, 'drop-fast')),
        ...explainChoice(situation, scoreChoice(situation, level, analysis.alternative.point, analysis.alternative.shot)),
      ]
      for (const bullet of bullets) expect(bullet).not.toMatch(PLAIN_SPACE_BEFORE_PUNCTUATION)
    }
  })
})

function isAgainstBulletOf(id: CriterionId, bullet: string): boolean {
  return AGAINST_BULLETS[id] === bullet
}
