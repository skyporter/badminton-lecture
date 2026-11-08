import {describe, expect, it} from 'vitest'
import {analyse, scoreChoice} from '../../src/engine/analysis'
import {AGAINST_BULLETS, FOR_BULLETS, REAR_FOR_BULLET, SHOT_DESCRIPTIONS, describeReturn, describeShotB, explainBest, explainChoice, predictNextShotB} from '../../src/engine/explain'
import {allowedShots, evaluatePair} from '../../src/engine/evaluate'
import {generateSituation} from '../../src/engine/generator'
import {EXPLAIN_FOR_MINIMUM_RAW, SHOT_FAMILIES} from '../../src/engine/rules'
import type {CriterionId} from '../../src/engine/rules'
import {createRng, randomBetween} from '../../src/engine/rng'
import {RETURN_SHOTS} from '../../src/engine/shots'
import type {ShotId} from '../../src/engine/shots'
import type {Level} from '../../src/engine/types'
import {F1, F2, F3, F4, F7} from '../calibration/reference-situations'

const STATUS_BULLETS = {
  attaque: 'Tu es en attaque : volant pris haut et tôt, tu peux accélérer.',
  neutre: 'Situation neutre : tu as le temps, sans pouvoir attaquer.',
  defense: "Tu es en défense : volant pris bas, tard ou loin, joue d'abord pour te replacer.",
}

function familyOf(shot: ShotId): string {
  return Object.entries(SHOT_FAMILIES).find(([, shots]) => shots.includes(shot))![0]
}

const PLAIN_SPACE_BEFORE_PUNCTUATION = / [?!:;]/

describe('describeShotB', () => {
  it('describes the attacking clear of F1', () => {
    expect(describeShotB(F1)).toBe("Situation\u00a0: B fait un dégagement d'attaque en ligne, vers le fond côté revers de A. Volant pris haut, en tour de tête.")
  })

  it('describes the fast drop of F2', () => {
    expect(describeShotB(F2)).toBe("Situation\u00a0: B fait un amorti rapide en ligne, vers l'avant côté coup droit de A. Volant pris bas, en coup droit.")
  })
})

describe('SHOT_DESCRIPTIONS', () => {
  it('describes every return shot in one French sentence, with a non-breaking space before ? ! : ;', () => {
    RETURN_SHOTS.forEach((shot) => {
      expect(SHOT_DESCRIPTIONS[shot].length).toBeGreaterThan(20)
      expect(SHOT_DESCRIPTIONS[shot]).toMatch(/\.$/)
      expect(SHOT_DESCRIPTIONS[shot]).not.toMatch(PLAIN_SPACE_BEFORE_PUNCTUATION)
    })
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

describe('alternative wording', () => {
  it('never describes the alternative like the best return when another family is allowed', () => {
    const levels: Level[] = ['debutant', 'intermediaire', 'avance']
    for (let seed = 1; seed <= 40; seed++) {
      const situation = generateSituation(seed)
      for (const level of levels) {
        const {best, alternative} = analyse(situation, level)
        const otherFamilyAllowed = allowedShots(situation).some((shot) => familyOf(shot) !== familyOf(best.shot))
        if (otherFamilyAllowed) {
          expect(describeReturn(alternative)).not.toBe(describeReturn(best))
        }
      }
    }
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

describe('AGAINST_BULLETS', () => {
  it('speaks of the student shot as « Ton coup » and compares it with the best return, never as « Ce coup »', () => {
    Object.values(AGAINST_BULLETS).forEach((bullet) => expect(bullet.startsWith('Ce coup')).toBe(false))
    expect(AGAINST_BULLETS.pressure).toBe('Ton coup met moins de pression sur B que le meilleur retour.')
    expect(AGAINST_BULLETS.recoveryTime).toBe('Ton coup te laisse moins de temps pour te replacer que le meilleur retour.')
    expect(AGAINST_BULLETS.risk).toBe("Plus risqué que le meilleur retour\u00a0: trop près d'une ligne, ou croisé hors équilibre.")
  })
})

describe('explainChoice', () => {
  it('gives a single bullet for a click out of the court', () => {
    expect(explainChoice(F1, scoreChoice(F1, 'avance', {x: 3, y: 7.5}, 'smash'))).toEqual(['Le volant sort du terrain.'])
  })

  it('explains a smash on a low shuttle by the height of the shuttle', () => {
    expect(explainChoice(F3, scoreChoice(F3, 'avance', {x: 3, y: 3}, 'smash')).slice(0, 2)).toEqual(['Coup impossible dans ta situation.', 'Volant pris bas\u00a0: un smash se joue seulement sur un volant pris haut.'])
  })

  describe('for a shot not playable in the situation', () => {
    const defenseAtTheNet = generateSituation(1794139393597)

    it('explains a status that leaves no time, then lists the playable shots', () => {
      expect(defenseAtTheNet).toMatchObject({status: 'defense', arrival: 'low'})
      expect(explainChoice(defenseAtTheNet, scoreChoice(defenseAtTheNet, 'intermediaire', {x: 3, y: 1}, 'lob-attack'))).toEqual([
        'Coup impossible dans ta situation.',
        "Tu es en défense, en retard sur le volant\u00a0: tu n'as pas le temps de jouer un lob d'attaque.",
        'Coups jouables ici\u00a0: un lob défensif ou un filet.',
      ])
    })

    it('explains a shot that cannot be played from that part of the court', () => {
      const lowInMidCourt = generateSituation(9)
      expect(allowedShots(lowInMidCourt)).not.toContain('net')
      expect(explainChoice(lowInMidCourt, scoreChoice(lowInMidCourt, 'intermediaire', {x: 3, y: 5.5}, 'net'))[1]).toBe('Depuis le milieu de ton terrain, un filet ne se joue pas.')
    })

    it('never falls back to the generic sentence', () => {
      for (let seed = 1; seed <= 60; seed++) {
        const situation = generateSituation(seed)
        RETURN_SHOTS.filter((shot) => !allowedShots(situation).includes(shot)).forEach((shot) => {
          const bullets = explainChoice(situation, scoreChoice(situation, 'intermediaire', {x: 3, y: 3}, shot))
          expect(bullets).toHaveLength(3)
          expect(bullets[0]).toBe('Coup impossible dans ta situation.')
          expect(bullets[1]).not.toContain("n'est pas jouable")
          expect(bullets[2].startsWith('Coups jouables ici\u00a0: ')).toBe(true)
        })
      }
    })
  })

  it('says the shot is impossible for a drop aimed at the back line', () => {
    expect(explainChoice(F1, scoreChoice(F1, 'avance', {x: 3, y: 0.5}, 'drop-slow'))).toEqual(['Coup impossible jusque-là.', "Un amorti ne va pas jusqu'au fond."])
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
