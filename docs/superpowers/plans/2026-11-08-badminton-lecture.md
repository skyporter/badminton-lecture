# Badminton Lecture — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** une page web statique de quiz de lecture du jeu en simple : situation générée, l'élève clique sa cible et choisit son coup, puis révélation avec une carte vert/rouge, un score et une justification, sur trois niveaux.

**Architecture :** un moteur pur et déterministe (`src/engine/`, sans DOM) génère et évalue les situations à partir d'un unique fichier de règles (`rules.ts`). Une couche d'interface (`src/ui/`) dessine le terrain en SVG (mètres dans le `viewBox`) et la carte sur un `<canvas>` superposé. Le moteur est entièrement testé, y compris par des situations de référence qui servent au calibrage.

**Tech Stack :** Vite 5 + TypeScript 5 (strict), Vitest 2, aucune dépendance d'exécution. `npm run build` produit un dossier `dist/` statique.

**Spec :** `docs/superpowers/specs/2026-11-08-badminton-lecture-design.md` (avec `mockups/flow-v10.html` et `mockups/trajectoires-v3.html`).

## Global Constraints

- Page web statique : aucun serveur, aucun backend, aucune API externe, aucune IA.
- Moteur déterministe : même situation et même niveau → même résultat, au bit près.
- Terrain : 13,40 m × 6,10 m ; couloirs de simple à 0,46 m du bord (x ∈ [0,46 ; 5,64]) ; ligne de service court à 1,98 m du filet ; ligne de service long du double à 0,76 m du fond ; filet à y = 6,70.
- Repère (en mètres) : origine en haut à gauche, x de 0 à 6,10, y de 0 à 13,40 ; **B en haut** (y < 6,70), **A en bas** (y > 6,70).
- Les deux joueurs sont droitiers. A regarde vers −y, donc sa droite (coup droit) est à +x. B regarde vers +y, donc sa droite est à −x. La latéralité est un paramètre (`handedness: 'droitier'`), même si seul `droitier` est implémenté.
- Couleurs : A `#3b82f6`, B `#e05252`, coup de B `#ff8a65`, retour de l'élève (aperçu et validé) `#ffd54a`, meilleur retour `#ffffff` en pointillé, carte vert vif `#00e676`, vert clair `#b2ff59`, rouge `#ff5252`.
- Texte de l'interface en français, avec une espace insécable avant `?`, `!`, `:` et `;`. Code, noms et commits en anglais.
- Toutes les règles, poids, seuils et sources sont dans `src/engine/rules.ts`, et nulle part ailleurs.
- Responsive ; tactile sur mobile ; légende masquable.

## Review Focus

1. **Clic hors du terrain de simple de B** (couloir de double, côté A, au-delà du fond) : le retour est « dehors », score 0, avec la puce « Le volant sort du terrain ». Test dans la tâche 6.
2. **Valider sans cible ou sans coup** : le bouton « Valider » reste désactivé tant que les deux ne sont pas choisis. Test dans la tâche 10.
3. **« Nouvelle situation » ou changement de niveau en cours de réponse** : la cible, le coup et la révélation sont réinitialisés. Un changement de niveau après la révélation recalcule la révélation pour la même situation. Test dans la tâche 10.
4. **Situations générées impossibles** (point de chute hors du terrain de simple de A, smash depuis le filet, service hors de la zone) : sur 2 000 graines, le point de chute est dans les limites, et le coup de B est permis depuis sa zone. Test dans la tâche 4.
5. **Rotation ou redimensionnement de l'écran mobile après le placement de la croix** : la croix et la carte restent alignées sur le terrain, car tout est en coordonnées de terrain, jamais en pixels mémorisés. Test dans la tâche 9.

---

### Task 1: Projet, géométrie du terrain et générateur aléatoire

**Files :**
- Create : projet Vite `vanilla-ts` à la racine (`package.json`, `index.html`, `tsconfig.json`, `src/main.ts`), `.gitignore`
- Create : `src/engine/types.ts`, `src/engine/court.ts`, `src/engine/rng.ts`
- Test : `tests/engine/court.test.ts`, `tests/engine/rng.test.ts`

**Interfaces :**
- Produces :
  - `types.ts` : `type Point = {x: number; y: number}` ; `type Level = 'debutant' | 'intermediaire' | 'avance'` ; `type Status = 'attaque' | 'neutre' | 'defense'` ; `type Direction = 'ligne' | 'croise'` ; `type Handedness = 'droitier'`.
  - `court.ts` : constantes `COURT_LENGTH = 13.4`, `COURT_WIDTH = 6.1`, `NET_Y = 6.7`, `SINGLES_LEFT = 0.46`, `SINGLES_RIGHT = 5.64`, `SHORT_SERVICE_DISTANCE = 1.98`, `DOUBLES_LONG_SERVICE_INSET = 0.76`, `CENTER_X = 3.05` ; `isInSinglesHalf(point: Point, side: 'A' | 'B'): boolean` (lignes comprises) ; `depthFromNet(point: Point): number` (distance au filet, toujours positive) ; `pointAtDepth(side: 'A' | 'B', depth: number, x: number): Point` ; `forehandIsPositiveX(side: 'A' | 'B'): boolean` (A → true, B → false) ; `distance(a: Point, b: Point): number` ; `directionBetween(from: Point, to: Point): Direction` (`croise` si |Δx| > 2,0 m).
  - `rng.ts` : `createRng(seed: number): () => number` (mulberry32, valeurs dans [0, 1[) ; `randomBetween(rng, min, max): number` ; `pick<T>(rng, items: readonly T[]): T`.

- [ ] **Step 1 : initialiser le dépôt et commiter la sortie brute du générateur**

```bash
cd /Users/vincent/Documents/projects/badminton-lecture
git init -b main
npm create vite@5 . -- --template vanilla-ts   # accepter d'écrire dans le dossier non vide
npm install
git add -A -- . ':!docs' && git commit -m "chore: scaffold vite vanilla-ts"
git switch -c feat/quiz-engine
git add docs && git commit -m "docs: add design spec, mockups, prior-art research and plan"
npm install -D vitest@2
```

Ajouter `"test": "vitest run"` dans `package.json`. Supprimer le contenu de démonstration de Vite (`counter.ts`, logo, styles de démo).

- [ ] **Step 2 : écrire les tests qui échouent**

```ts
// tests/engine/court.test.ts
it('treats singles lines as in', () => {
  expect(isInSinglesHalf({x: 0.46, y: 0}, 'B')).toBe(true)
  expect(isInSinglesHalf({x: 0.40, y: 3}, 'B')).toBe(false)   // couloir de double
  expect(isInSinglesHalf({x: 3, y: 7}, 'B')).toBe(false)      // côté A
  expect(isInSinglesHalf({x: 3, y: 13.4}, 'A')).toBe(true)
})
it('measures depth from the net on both sides', () => {
  expect(depthFromNet({x: 3, y: 0})).toBeCloseTo(6.7)
  expect(depthFromNet({x: 3, y: 8.68})).toBeCloseTo(1.98)
})
it('places forehands for right-handers facing each other', () => {
  expect(forehandIsPositiveX('A')).toBe(true)
  expect(forehandIsPositiveX('B')).toBe(false)
})
it('calls a shot cross-court beyond 2 m of lateral change', () => {
  expect(directionBetween({x: 1, y: 12}, {x: 1.5, y: 2})).toBe('ligne')
  expect(directionBetween({x: 1, y: 12}, {x: 4.5, y: 2})).toBe('croise')
})
// tests/engine/rng.test.ts
it('is reproducible for a seed', () => {
  const first = createRng(42), second = createRng(42)
  expect([first(), first(), first()]).toEqual([second(), second(), second()])
})
```

- [ ] **Step 3 : vérifier l'échec** — `npx vitest run tests/engine` → FAIL (modules introuvables).
- [ ] **Step 4 : implémenter `types.ts`, `court.ts` et `rng.ts` selon les interfaces ci-dessus.**
- [ ] **Step 5 : vérifier le succès** — `npx vitest run tests/engine` → PASS.
- [ ] **Step 6 : commit** — `git add src tests package.json package-lock.json && git commit -m "feat: add court geometry and seeded rng"`.

---

### Task 2: Catalogue des coups et fichier de règles

**Files :**
- Create : `src/engine/shots.ts`, `src/engine/rules.ts`
- Test : `tests/engine/shots.test.ts`

**Interfaces :**
- Consumes : `types.ts`, `court.ts`.
- Produces :
  - `shots.ts` : `type ShotId = 'serve-short' | 'serve-long' | 'clear-high' | 'clear-attack' | 'smash' | 'drop-slow' | 'drop-fast' | 'net' | 'lob-defensive' | 'lob-attack' | 'drive' | 'block'` ; `type Speed = 'very-fast' | 'fast' | 'medium' | 'slow'` ; `type Arc = 'flat' | 'low' | 'high'` ; `type Arrival = 'high' | 'mid' | 'low'` ; `type HitZone = 'rear' | 'mid' | 'front'` ; `interface Shot {id: ShotId; label: string; speed: Speed; arc: Arc; arrival: Arrival; flightTime: number; landingDepth: [number, number]; playableFrom: HitZone[]; serve: boolean}` ; `SHOTS: Record<ShotId, Shot>` ; `RETURN_SHOTS: ShotId[]` (tous sauf les services) ; `hitZoneOf(point: Point): HitZone` (profondeur > 4,7 → `rear`, < 1,98 → `front`, sinon `mid`).
  - `rules.ts` : `type CriterionId = 'distance' | 'weakSide' | 'risk' | 'recoveryTime' | 'pressure'` ; `WEIGHTS: Record<Level, Record<CriterionId, number>>` ; `SHOT_RISK: Record<ShotId, number>` ; `SHOT_RECOVERY: Record<ShotId, number>` ; `SHOT_PRESSURE: Record<ShotId, number>` ; `ALLOWED_BY_STATUS: Record<Status, Record<Arrival, ShotId[]>>` ; `PLAYER_SPEED = 4.0` (m/s) ; `REACTION_TIME = 0.25` (s) ; `STATUS_MARGIN = {attack: 0.3, mid: 0.2, low: 0.4}` (s) ; `LINE_RISK_DISTANCE = 0.5` (m) ; `B_BASE = {back: {x: 3.05, y: 3.4}, neutral: {x: 3.05, y: 3.9}, front: {x: 3.05, y: 4.6}}` ; `SOURCES: Record<string, {label: string; url: string}>` et, pour chaque règle, la clé de sa source (§5.4 de la spec).

Valeurs de départ du catalogue (le calibrage de la tâche 7 peut les ajuster, toujours dans `rules.ts` ou `shots.ts`) :

| id | libellé | vitesse | courbe | arrivée | vol (s) | profondeur de chute (m du filet) | jouable depuis |
|---|---|---|---|---|---|---|---|
| serve-short | Service court | slow | low | low | 1.0 | [1.98, 2.6] | (service) |
| serve-long | Service long | slow | high | high | 1.6 | [5.9, 6.7] | (service) |
| clear-high | Dégagement haut | slow | high | high | 1.6 | [5.4, 6.6] | rear, mid |
| clear-attack | Dégagement d'attaque | fast | low | high | 1.1 | [5.0, 6.5] | rear, mid |
| smash | Smash | very-fast | flat | mid | 0.5 | [2.0, 5.0] | rear, mid |
| drop-slow | Amorti lent | medium | flat | low | 1.1 | [0.4, 2.0] | rear, mid |
| drop-fast | Amorti rapide | fast | flat | low | 0.8 | [1.8, 3.2] | rear, mid |
| net | Filet | slow | flat | low | 0.9 | [0.2, 1.8] | front |
| lob-defensive | Lob défensif | slow | high | high | 1.6 | [5.4, 6.6] | front, mid |
| lob-attack | Lob d'attaque | fast | low | high | 1.0 | [5.0, 6.5] | front |
| drive | Drive | fast | flat | mid | 0.6 | [2.5, 5.0] | mid |
| block | Contre-amorti | slow | flat | low | 0.7 | [0.2, 1.8] | mid |

`ALLOWED_BY_STATUS` de départ : arrivée `high` → attaque : tous les coups joués au-dessus de la tête (`clear-high`, `clear-attack`, `smash`, `drop-slow`, `drop-fast`) ; neutre : les mêmes sauf `smash` ; défense : `clear-high`, `drop-slow`. Arrivée `mid` → attaque : `drive`, `smash`, `drop-fast`, `block` ; neutre : `drive`, `block`, `lob-defensive` ; défense : `block`, `lob-defensive`. Arrivée `low` → attaque : `net`, `lob-attack` ; neutre : `net`, `lob-attack`, `lob-defensive` ; défense : `lob-defensive`, `net`.

`WEIGHTS` de départ (somme = 1 par niveau) : débutant `{risk: .35, recoveryTime: .25, distance: .20, weakSide: .15, pressure: .05}` ; intermédiaire `{distance: .30, pressure: .20, risk: .20, recoveryTime: .15, weakSide: .15}` ; avancé `{distance: .35, pressure: .25, weakSide: .20, risk: .10, recoveryTime: .10}`.

- [ ] **Step 1 : écrire les tests qui échouent**

```ts
it('defines every shot of the spec catalogue', () => {
  expect(Object.keys(SHOTS)).toHaveLength(12)
  expect(RETURN_SHOTS).not.toContain('serve-short')
})
it('keeps weights summing to 1 for every level', () => {
  for (const level of ['debutant', 'intermediaire', 'avance'] as const)
    expect(Object.values(WEIGHTS[level]).reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1)
})
it('never allows a smash on a low arrival', () => {
  for (const status of ['attaque', 'neutre', 'defense'] as const)
    expect(ALLOWED_BY_STATUS[status].low).not.toContain('smash')
})
it('links every rule table to a known source', () => { /* chaque clé de source référencée existe dans SOURCES */ })
```

- [ ] **Step 2 : vérifier l'échec** — `npx vitest run tests/engine/shots.test.ts` → FAIL.
- [ ] **Step 3 : implémenter `shots.ts` et `rules.ts` avec les valeurs ci-dessus ; les URL de `SOURCES` sont celles de §5.4 de la spec.**
- [ ] **Step 4 : vérifier le succès** → PASS.
- [ ] **Step 5 : commit** — `feat: add shot catalogue and rules config`.

---

### Task 3: Statut de A et replacement de B

**Files :**
- Create : `src/engine/status.ts`, `src/engine/recovery.ts`
- Test : `tests/engine/status.test.ts`, `tests/engine/recovery.test.ts`

**Interfaces :**
- Consumes : `SHOTS`, `PLAYER_SPEED`, `REACTION_TIME`, `STATUS_MARGIN`, `B_BASE`.
- Produces :
  - `timeMargin(playerA: Point, impact: Point, shot: ShotId): number` = `flightTime − (REACTION_TIME + distance / PLAYER_SPEED)`.
  - `statusFor(arrival: Arrival, margin: number): Status` : `high` → attaque si margin ≥ 0,3, neutre si ≥ 0, sinon défense ; `mid` → neutre si ≥ 0,2, sinon défense ; `low` → neutre si ≥ 0,4, sinon défense.
  - `recoveredPosition(hit: Point, shot: ShotId, direction: Direction): Point` : cible = `B_BASE.back` après `clear-*`, `lob-*`, `drop-fast`, `serve-long` ; `B_BASE.front` après `net`, `block`, `serve-short` ; `B_BASE.neutral` sinon. Part du chemin parcourue = `clamp(flightTime / 1.2, 0.3, 1)`, moins 0,2 si `croise` (Badminton Bible : après un croisé, on n'atteint pas sa base).

- [ ] **Step 1 : tests**

```ts
it('gives attack when a high shuttle is reached early', () => expect(statusFor('high', 0.5)).toBe('attaque'))
it('gives defence when a low shuttle is reached late', () => expect(statusFor('low', 0.1)).toBe('defense'))
it('biases B backwards after a clear and forwards after a net shot', () => {
  const hit = {x: 3, y: 1}
  expect(recoveredPosition(hit, 'clear-high', 'ligne').y).toBeLessThan(recoveredPosition({x: 3, y: 6}, 'net', 'ligne').y)
})
it('recovers less after a cross-court shot', () => {
  const hit = {x: 1, y: 1}
  const straight = recoveredPosition(hit, 'drop-fast', 'ligne'), cross = recoveredPosition(hit, 'drop-fast', 'croise')
  expect(distance(cross, hit)).toBeLessThan(distance(straight, hit))
})
```

- [ ] **Step 2 : vérifier l'échec. Step 3 : implémenter. Step 4 : vérifier le succès. Step 5 : commit** — `feat: derive A status and B recovery`.

---

### Task 4: Génération de situations (échange et service)

**Files :**
- Create : `src/engine/generator.ts`
- Test : `tests/engine/generator.test.ts`

**Interfaces :**
- Consumes : tâches 1 à 3.
- Produces :
  - `interface Situation {seed: number; handedness: Handedness; isServe: boolean; playerA: Point; playerBHit: Point; playerBRecovered: Point; shotB: ShotId; directionB: Direction; landing: Point; impact: Point; arrival: Arrival; margin: number; status: Status; contact: 'coup-droit' | 'revers' | 'tour-de-tete'}`.
  - `generateSituation(seed: number): Situation`.
  - `buildSituation(input: {playerA: Point; playerBHit: Point; shotB: ShotId; landing: Point; isServe?: boolean}): Situation` : calcule toutes les valeurs dérivées. Les situations de référence (tâche 7) l'utilisent.

Algorithme de `generateSituation` :
1. 15 % de services. Le serveur B se place côté droit (x < 3,05 pour B) si son score tiré (0 à 20) est pair, sinon côté gauche, à 0,3–1,0 m derrière sa ligne de service court. Le receveur A est en diagonale. Comme A et B se font face, la zone droite de chacun est de part et d'autre du centre à l'écran : B à droite → x < 3,05, A à droite → x > 3,05. A est donc placé du côté opposé à B par rapport à x = 3,05, à une profondeur de 2,5 à 3,5 m. Le service est `serve-short` ou `serve-long` (50/50), et le point de chute est dans la zone de service de A, en diagonale (x entre la ligne centrale et le couloir de simple).
2. Sinon : B est tiré dans son demi-terrain de simple, son coup est tiré parmi ceux dont `playableFrom` contient `hitZoneOf(B)`, en ligne ou croisé (60/40), le point de chute est tiré dans `landingDepth` côté A, et x vise le côté de la direction (x ∈ [0,6 ; 2,4] ou [3,7 ; 5,5]). A est placé à ±1 m de sa base (3,05 ; 10,6).
3. `impact` = point de chute, avancé de 0,3 m vers le filet si `arrival === 'high'`. `contact` : impact du côté +x par rapport à A → `coup-droit` ; sinon `tour-de-tete` si l'arrivée est `high`, `revers` sinon.

- [ ] **Step 1 : tests (Review Focus 4)**

```ts
it('is deterministic for a seed', () => expect(generateSituation(7)).toEqual(generateSituation(7)))
it('always produces playable, in-bounds situations', () => {
  for (let seed = 0; seed < 2000; seed++) {
    const situation = generateSituation(seed)
    expect(isInSinglesHalf(situation.landing, 'A')).toBe(true)
    expect(isInSinglesHalf(situation.playerBHit, 'B')).toBe(true)
    if (!situation.isServe) expect(SHOTS[situation.shotB].playableFrom).toContain(hitZoneOf(situation.playerBHit))
  }
})
it('lands serves diagonally in the receiving service box', () => {
  for (let seed = 0; seed < 2000; seed++) {
    const situation = generateSituation(seed)
    if (!situation.isServe) continue
    expect(depthFromNet(situation.landing)).toBeGreaterThanOrEqual(1.98)
    expect(Math.sign(situation.landing.x - 3.05)).toBe(-Math.sign(situation.playerBHit.x - 3.05))
  }
})
it('never lets a net shot come from the rear court', () => { /* buildSituation lève une erreur pour un net joué depuis l'arrière ; generateSituation ne le produit jamais */ })
```

- [ ] **Step 2 : vérifier l'échec. Step 3 : implémenter. Step 4 : vérifier le succès. Step 5 : commit** — `feat: generate rally and serve situations`.

---

### Task 5: Évaluation d'un couple (point, coup)

**Files :**
- Create : `src/engine/evaluate.ts`
- Test : `tests/engine/evaluate.test.ts`

**Interfaces :**
- Consumes : `Situation`, règles.
- Produces :
  - `interface CriterionScore {id: CriterionId; raw: number; weight: number; contribution: number}` (raw ∈ [0, 1], contribution = raw × weight).
  - `type Infeasibility = 'dehors' | 'statut' | 'zone'`.
  - `interface PairEvaluation {point: Point; shot: ShotId; direction: Direction; feasible: boolean; infeasibility?: Infeasibility; value: number; criteria: CriterionScore[]}`.
  - `allowedShots(situation: Situation): ShotId[]` = `ALLOWED_BY_STATUS[status][arrival]` ∩ coups dont `playableFrom` contient la zone de l'impact.
  - `evaluatePair(situation: Situation, level: Level, point: Point, shot: ShotId): PairEvaluation`.

Règles de `evaluatePair` :
- hors du demi-terrain de simple de B → `dehors`, value 0 ; coup absent de `allowedShots` → `statut`, value 0 ; profondeur du point hors de `landingDepth` du coup (tolérance 0,3 m) → `zone`, value 0. Les critères sont calculés quand même, pour pouvoir les expliquer.
- `reachTime` (renomme le critère `distance` de `CriterionId` et de `WEIGHTS`, spec §5.2 « Temps d'atteinte », « Balle dans le dos », « Temps de vol ») :
  - temps d'atteinte de B = max(0, distance(`playerBRecovered`, point) − `B_REACH`) / `B_SPEED` + pénalité « balle dans le dos » ;
  - pénalité « balle dans le dos » = 0 si le point est moins de `BEHIND_THRESHOLD` derrière B (derrière = plus près de la ligne de fond de B, donc y plus petit), puis `BEHIND_PENALTY_PER_METER` × (écart − seuil) ;
  - temps de vol du retour = `SHOTS[shot].flightTime` × `CROSS_FLIGHT_TIME_FACTOR` si `croise`, sinon × 1 ;
  - raw = clamp(0,5 + (temps d'atteinte − temps de vol) / (2 × `REACH_REFERENCE_TIME`), 0, 1).
  - Valeurs de départ dans `rules.ts` : `B_REACH = 0.8`, `B_SPEED = 4.0`, `BEHIND_THRESHOLD = 0.35`, `BEHIND_PENALTY_PER_METER = 0.3`, `CROSS_FLIGHT_TIME_FACTOR = 1.1`, `REACH_REFERENCE_TIME = 1.0`.
- `weakSide` = 1 dans le quart arrière côté revers de B (x > 3,05 et profondeur > 4,7), 0,5 au fond côté coup droit, 0 ailleurs.
- `risk` = 1 − max(risque de ligne, `SHOT_RISK[shot]` + pénalité de croisé). Risque de ligne : 1 à 0 m d'une ligne de simple, 0 au-delà de `LINE_RISK_DISTANCE`. Pénalité de croisé (`CROSS_RISK`, dans `rules.ts`) : 0,1 si `croise`, 0,4 si `croise` et statut `defense` (spec : surcoût du croisé, majoré en défense).
- Chaque `Infeasibility` porte sa raison lisible par l'explication (tâche 7) : `dehors`, `statut` (hauteur de prise insuffisante pour ce coup), `zone` (le coup ne va pas à cette profondeur).
- `recoveryTime` = `SHOT_RECOVERY[shot]`.
- `pressure` = `SHOT_PRESSURE[shot]` × (1 en attaque, 0,6 en neutre, 0,3 en défense).
- `value` = Σ contributions.

- [ ] **Step 1 : tests**

```ts
it('scores out-of-court points as zero (Review Focus 1)', () => {
  const evaluation = evaluatePair(situation, 'intermediaire', {x: 0.2, y: 2}, 'clear-high')
  expect(evaluation).toMatchObject({feasible: false, infeasibility: 'dehors', value: 0})
})
it('rejects a drop aimed at the back line', () => expect(evaluatePair(situation, 'intermediaire', {x: 3, y: 0.3}, 'drop-slow').infeasibility).toBe('zone'))
it('rejects a smash on a low arrival', () => expect(evaluatePair(lowSituation, 'avance', {x: 3, y: 3}, 'smash').infeasibility).toBe('statut'))
it('values points far from recovered B more', () => { /* même coup, point éloigné de B > point près de B */ })
it('adds a behind-the-back penalty only beyond the threshold', () => { /* point 0,2 m derrière B : même reachTime qu'à côté ; 1,5 m derrière : reachTime plus élevé que 1,5 m devant à distance égale */ })
it('penalises cross-court more in defence than in attack', () => { /* même point croisé : risk(défense) < risk(attaque) */ })
it('is deterministic', () => expect(evaluatePair(...same)).toEqual(evaluatePair(...same)))
```

(`situation` et `lowSituation` sont construites avec `buildSituation`.)

- [ ] **Step 2 : vérifier l'échec. Step 3 : implémenter. Step 4 : vérifier le succès. Step 5 : commit** — `feat: evaluate return pairs against weighted criteria`.

---

### Task 6: Carte, meilleur retour, alternative et score

**Files :**
- Create : `src/engine/analysis.ts`
- Test : `tests/engine/analysis.test.ts`

**Interfaces :**
- Consumes : `evaluatePair`, `allowedShots`.
- Produces :
  - `interface ValueMap {originX: number; originY: number; step: number; columns: number; rows: number; values: Float32Array; bestShots: ShotId[]}` (cellules de 0,1 m sur le demi-terrain de simple de B ; chaque cellule vaut le maximum sur les coups permis, et `bestShots` donne le coup gagnant).
  - `interface Analysis {map: ValueMap; best: PairEvaluation; alternative: PairEvaluation}`.
  - `analyse(situation: Situation, level: Level): Analysis`. L'alternative est le meilleur couple dont le point est à ≥ 2,0 m du meilleur point **ou** dont le coup appartient à une autre famille (familles : avant = drop/net/block, arrière = clear/lob, à plat = smash/drive).
  - `interface ChoiceResult {score: number; choice: PairEvaluation; analysis: Analysis}`.
  - `scoreChoice(situation: Situation, level: Level, point: Point, shot: ShotId): ChoiceResult`, avec `score = round(100 × choice.value / best.value)`, borné entre 0 et 100.
  - `mapColor(ratio: number): string` (ratio = valeur / meilleure valeur) : ≥ 0,9 → vert vif, ≥ 0,7 → vert clair, puis dégradé jusqu'au rouge à ≤ 0,4.

- [ ] **Step 1 : tests**

```ts
it('gives 100 to the best pair', () => expect(scoreChoice(situation, level, best.point, best.shot).score).toBe(100))
it('never lets the map contradict the score', () => {
  // pour 200 points et coups tirés au hasard : valeur de la cellule ≥ valeur du couple choisi
})
it('scores an out-of-court click 0', () => expect(scoreChoice(situation, level, {x: 3, y: 7.5}, 'clear-high').score).toBe(0))
it('proposes an alternative distinct from the best', () => { /* ≥ 2 m ou autre famille */ })
it('changes the best answer with the level on at least one reference case', () => { /* fixture F1, débutant ≠ avancé */ })
it('analyses a situation in under 50 ms', () => { /* performance : 5 runs, médiane < 50 ms */ })
```

- [ ] **Step 2 : vérifier l'échec. Step 3 : implémenter. Step 4 : vérifier le succès. Step 5 : commit** — `feat: build value map, best return and choice score`.

---

### Task 7: Justifications et calibrage par situations de référence

**Files :**
- Create : `src/engine/explain.ts`, `tests/calibration/reference-situations.ts`
- Test : `tests/engine/explain.test.ts`, `tests/calibration/reference.test.ts`
- Modify : `src/engine/rules.ts` (ajustement des poids uniquement)

**Interfaces :**
- Consumes : `Analysis`, `ChoiceResult`, `Situation`.
- Produces :
  - `describeShotB(situation: Situation): string` (par ex. « Dégagement d'attaque en ligne, vers le fond côté revers de A. Volant pris haut, en tour de tête. »).
  - `explainBest(situation: Situation, analysis: Analysis): string[]` : une puce sur le statut, puis une puce par critère parmi les trois plus fortes contributions, puis une puce sur la direction.
  - `explainChoice(situation: Situation, result: ChoiceResult): string[]` : si le couple est infaisable, une seule puce (« Le volant sort du terrain. », « Pris aussi bas, tu ne peux pas smasher. », « Un amorti ne va pas jusqu'au fond. »). Sinon, une puce par critère dont l'écart de contribution avec le meilleur couple dépasse 0,05, du plus grand au plus petit (3 au maximum). Si le score est ≥ 90 : « Excellent choix. »
  - `explainBest` liste les contributions les plus fortes **pour** ; `explainChoice` liste les écarts **contre** (spec §5.2 « Note et justification … pour et contre »).
  - `predictNextShotB(situation: Situation, evaluation: PairEvaluation): string` : une phrase « B va probablement jouer … » ajoutée en dernière puce de `explainBest` (spec §5.2 « Ce que B va probablement jouer ensuite »). La table coup de A → réponses probables de B vit dans `rules.ts` (`LIKELY_REPLIES: Record<ShotId, ShotId[]>`) : amorti, filet, contre-amorti → filet ou lob ; dégagement, lob → dégagement, amorti ou smash ; smash, drive → contre-amorti ou lob défensif.
  - Toutes les phrases sont des gabarits fixes dans `explain.ts`, avec des clés littérales (aucune construction dynamique de clé).

Situations de référence (`reference-situations.ts`, construites avec `buildSituation`) et propriétés attendues :

| # | Situation | Débutant | Intermédiaire | Avancé |
|---|---|---|---|---|
| F1 | Dégagement d'attaque de B (B à (2,2 ; 2,0)) vers le fond côté revers de A, A à sa base → statut attaque | meilleur ∈ {clear-high, clear-attack}, point à profondeur > 5 m | meilleur ∈ {drop-fast, smash, clear-attack} | meilleur ∈ {drop-fast, smash}, ≠ clear-high |
| F2 | Amorti rapide de B vers l'avant côté coup droit de A, A en retard → défense | lob-defensive vers le fond | ∈ {lob-defensive, net} | ∈ {lob-defensive, net} ; jamais smash ni clear-attack |
| F3 | Filet de B, A au filet en avance → neutre | lob-defensive | ∈ {net, lob-attack, lob-defensive} | ∈ {net, lob-attack} |
| F4 | Smash de B vers le corps de A → défense | ∈ {block, lob-defensive} | idem | idem ; jamais smash |
| F5 | Service court de B | ∈ {net, lob-defensive, lob-attack} | idem | ∈ {net, lob-attack} |
| F6 | Service long de B, A à temps | comme F1 débutant | ∈ {drop-fast, clear-attack, smash} | ∈ {drop-fast, smash} |
| F7 | Dégagement croisé de B joué depuis son fond côté revers, B mal replacé | meilleur point à ≥ 3 m de B replacé, pour les trois niveaux |

- [ ] **Step 1 : écrire `explain.test.ts`** (une puce sur le statut toujours présente ; puce « Le volant sort du terrain. » pour un clic dehors ; aucune puce sur un critère dont l'écart est < 0,05 ; « Excellent choix. » à 100) **et `reference.test.ts`** (une assertion par case du tableau ci-dessus).
- [ ] **Step 2 : vérifier l'échec.**
- [ ] **Step 3 : implémenter `explain.ts`.**
- [ ] **Step 4 : calibrer.** Lancer `npx vitest run tests/calibration`. Tant qu'un cas échoue, ajuster **uniquement** `WEIGHTS`, `SHOT_RISK`, `SHOT_RECOVERY`, `SHOT_PRESSURE` ou `ALLOWED_BY_STATUS` dans `rules.ts`, chaque fois en lien avec un principe de §5.4. Ne jamais modifier une attente du tableau pour faire passer un test. Si un cas reste impossible à satisfaire sans casser les autres, s'arrêter et le signaler avec les valeurs essayées.
- [ ] **Step 5 : vérifier le succès** — `npm test` → tout PASS.
- [ ] **Step 6 : commit** — `feat: explain answers and calibrate rules on reference situations`.

---

### Task 8: Rendu du terrain, des joueurs et des trajectoires

**Files :**
- Create : `src/ui/courtView.ts`, `src/ui/trajectory.ts`, `src/ui/styles.css`
- Test : `tests/ui/trajectory.test.ts`

**Interfaces :**
- Consumes : `Situation`, `SHOTS`, constantes de `court.ts`.
- Produces :
  - `trajectoryStyle(shot: ShotId): {dashArray: string; curvature: number}` (unités du terrain, en mètres) — trait plein `''` pour very-fast ; `'0.4 0.1'` pour fast ; `'0.2 0.2'` pour medium ; `'0.06 0.3'` pour slow. Courbure : `flat` 0, `low` 0,08, `high` 0,2 (fraction de la longueur, décalage latéral du point de contrôle quadratique).
  - `trajectoryPath(from: Point, to: Point, shot: ShotId): string` (commande SVG `M … Q …`).
  - `renderCourt(svg: SVGSVGElement): void` (lignes officielles, filet ; `viewBox="-0.6 -0.6 7.3 14.6"`).
  - `renderPlayers(layer: SVGGElement, situation: Situation, phase: 'question' | 'reveal'): void` : A et B en ronds de rayon 0,35 avec leur lettre, raquette fixe côté coup droit (selon `forehandIsPositiveX`). En `reveal`, B est dessiné plein à `playerBRecovered` et en pointillé à `playerBHit`, sans flèche.
  - `renderShotB(layer, situation)` : trajectoire orange de `playerBHit` à `landing`, point de chute orange.

- [ ] **Step 1 : tests**

```ts
it('draws a smash solid and straight', () => expect(trajectoryStyle('smash')).toEqual({dashArray: '', curvature: 0}))
it('draws a high clear dotted and strongly curved', () => expect(trajectoryStyle('clear-high')).toEqual({dashArray: '0.06 0.3', curvature: 0.2}))
it('draws an attacking lob with long dashes and a slight curve', () => expect(trajectoryStyle('lob-attack')).toEqual({dashArray: '0.4 0.1', curvature: 0.08}))
it('uses a straight quadratic for flat shots', () => expect(trajectoryPath({x: 1, y: 12}, {x: 1, y: 2}, 'drive')).toBe('M 1 12 Q 1 7 1 2'))
```

- [ ] **Step 2 : vérifier l'échec. Step 3 : implémenter. Step 4 : vérifier le succès.**
- [ ] **Step 5 : vérification visuelle** — `npm run dev`, puis `agent-browser open http://localhost:5173` et capture d'écran. On doit voir le terrain conforme à `mockups/flow-v10.html` (étape 1), avec les raquettes du bon côté (A à droite de l'écran, B à gauche).
- [ ] **Step 6 : commit** — `feat: render court, players and trajectory code`.

---

### Task 9: Boucle du quiz, révélation et carte

**Files :**
- Create : `src/ui/app.ts`, `src/ui/input.ts`, `src/ui/heatmap.ts`, `src/ui/panel.ts`
- Modify : `src/main.ts`, `index.html`
- Test : `tests/ui/input.test.ts`, `tests/ui/state.test.ts`

**Interfaces :**
- Consumes : `generateSituation`, `analyse`, `scoreChoice`, `describeShotB`, `explainBest`, `explainChoice`, `mapColor`, tâche 8.
- Produces :
  - `type QuizState = {situation: Situation; level: Level; target: Point | null; shot: ShotId | null; result: ChoiceResult | null}`.
  - Réducteur pur `nextState(state: QuizState, action: {type: 'new-situation'; seed: number} | {type: 'set-level'; level: Level} | {type: 'set-target'; point: Point} | {type: 'set-shot'; shot: ShotId} | {type: 'validate'}): QuizState`.
  - `canValidate(state: QuizState): boolean`.
  - `clientToCourt(svg: SVGSVGElement, clientX: number, clientY: number): Point` (via `getScreenCTM().inverse()`, jamais de pixels mémorisés : Review Focus 5).
  - `renderHeatmap(canvas: HTMLCanvasElement, map: ValueMap, bestValue: number): void` : canevas positionné exactement sur le demi-terrain de simple de B, avec des cellules lissées (dégradé continu, flou CSS léger).

Comportement :
- **Étape 1.** La description du coup de B (`describeShotB`) et les boutons de coups (`RETURN_SHOTS`, libellés de `SHOTS`). Sur pointeur souris (`pointermove`), aperçu jaune de `impact` vers le curseur avec une petite croix. `pointerdown` puis `pointerup` fixent la cible. Sur tactile, l'aperçu suit le glisser, le relâchement place la croix, et un nouveau glisser la déplace.
- **Étape 2** (après « Valider ») : la carte, B replacé et B en pointillé, le retour jaune de l'élève avec sa croix, le meilleur retour en pointillé blanc. Le panneau affiche : ton choix, le score sur 100, le meilleur retour (coup + direction + zone), « Pourquoi » en deux listes à puces (« Meilleur retour » puis « Ton choix »), et l'alternative.

- [ ] **Step 1 : tests**

```ts
it('cannot validate without a target and a shot (Review Focus 2)', () => {
  expect(canValidate({...state, target: null, shot: 'smash'})).toBe(false)
  expect(canValidate({...state, target: point, shot: null})).toBe(false)
})
it('resets the answer on a new situation (Review Focus 3)', () => {
  expect(nextState(answeredState, {type: 'new-situation', seed: 3})).toMatchObject({target: null, shot: null, result: null})
})
it('recomputes the reveal when the level changes after validation (Review Focus 3)', () => {
  const changed = nextState(revealedState, {type: 'set-level', level: 'avance'})
  expect(changed.result?.analysis).toEqual(analyse(revealedState.situation, 'avance'))
})
it('converts client coordinates through the current transform (Review Focus 5)', () => { /* SVG jsdom avec getScreenCTM simulé à deux échelles : même point de terrain */ })
```

(Ajouter `jsdom` en dépendance de développement, et `// @vitest-environment jsdom` dans ces fichiers.)

- [ ] **Step 2 : vérifier l'échec. Step 3 : implémenter. Step 4 : vérifier le succès.**
- [ ] **Step 5 : vérification visuelle** — avec `agent-browser`, générer une situation, survoler le terrain de B (l'aperçu jaune part du point d'impact), cliquer, choisir un coup, valider, puis faire une capture. Comparer à `mockups/flow-v10.html` (étape 2).
- [ ] **Step 6 : commit** — `feat: wire quiz loop, reveal map and panel`.

---

### Task 10: Légendes, mobile, finitions et documentation

**Files :**
- Create : `src/ui/legend.ts`, `README.md`, `CLAUDE.md`
- Modify : `src/ui/styles.css`, `src/ui/app.ts`
- Test : `tests/ui/legend.test.ts`

**Interfaces :**
- Produces : `renderLegend(container: HTMLElement, phase: 'question' | 'reveal'): void` ; `loadLegendVisible(isMobile: boolean): boolean` et `saveLegendVisible(visible: boolean): void`, via la clé `localStorage` `badminton-lecture:legend-visible`, avec chaque lecture et écriture dans un `try/catch` qui retombe sur la valeur par défaut (masquée sur mobile, visible sur ordinateur).

Contenu des légendes : à l'étape 1, A, B, la raquette = côté coup droit, le coup de B, le point de chute, ton retour au survol (✕ = point visé) ; à l'étape 2, B au moment de sa frappe, B replacé, ton retour, le meilleur retour, le meilleur spot, la bonne alternative, à éviter. Le code des trajectoires (vitesse et hauteur) est dans un bloc repliable de la légende.

Mise en page : en dessous de 768 px, une colonne (terrain en pleine largeur, panneau dessous). Bouton « Légende » qui l'affiche ou la masque ; masquée, le terrain occupe toute la hauteur disponible. Le sélecteur de niveau et le bouton « Nouvelle situation » restent visibles en haut.

- [ ] **Step 1 : tests**

```ts
it('hides the legend by default on mobile and shows it on desktop', () => {
  localStorage.clear()
  expect(loadLegendVisible(true)).toBe(false)
  expect(loadLegendVisible(false)).toBe(true)
})
it('remembers the choice', () => { saveLegendVisible(true); expect(loadLegendVisible(true)).toBe(true) })
it('falls back to defaults when storage throws', () => { /* localStorage.getItem simulé qui lève */ })
```

- [ ] **Step 2 : vérifier l'échec. Step 3 : implémenter. Step 4 : vérifier le succès.**
- [ ] **Step 5 : vérification mobile** — `agent-browser set viewport 390 844`, puis captures : légende masquée et terrain en pleine largeur, légende affichée, révélation. Ensuite `agent-browser set viewport 844 390` (rotation) : la croix et la carte restent alignées.
- [ ] **Step 6 : `npm run build`**, puis `npx vite preview` et une capture : la page `dist/` fonctionne seule.
- [ ] **Step 7 : documentation** — `README.md` en français (ce que fait l'appli, `npm install`, `npm run dev`, `npm test`, `npm run build`, où ajuster les règles : `src/engine/rules.ts`, situations de référence). `CLAUDE.md` en anglais (architecture moteur/UI, repère de coordonnées et orientation des joueurs, règle « toutes les valeurs dans rules.ts », commande de test, code des couleurs et des trajectoires).
- [ ] **Step 8 : `npm test`** → tout PASS, **puis commit** — `feat: add legends, mobile layout and docs`.
