# Badminton Lecture — recherche d'existant

Date : 2026-11-08 · Périmètre : outils qui entraînent ou outillent la **lecture du jeu / le choix de coup** en badminton simple, et leurs équivalents dans les autres sports de raquette. Référence : `docs/superpowers/specs/2026-11-08-badminton-lecture-design.md`.

Méthode : recherches web (Google/App Store/Play Store via moteur), lecture des README GitHub via l'API, inspection du code de la page la plus proche. Les prix et fonctionnalités des apps mobiles viennent des fiches stores ou de sites tiers : ils n'ont pas tous pu être vérifiés en ouvrant l'app. Les points non vérifiés sont signalés « (non vérifié) ».

Légende de proximité avec notre concept : ★★★ très proche, ★★ proche sur un axe, ★ voisin/inspiration.

---

## 1. Projets open source badminton (les plus proches)

### 1.1 Mofan-mofan / badminton-tactics — « 羽毛球单打战术助手 » ★★★
- **Lien** : https://github.com/Mofan-mofan/badminton-tactics · démo : https://mofan-mofan.github.io/badminton-tactics/
- **Plateforme / prix** : page web statique (un seul `index.html`, sans build ni réseau), MIT, gratuit. Interface en chinois. v0.2 publiée le 2026-09-14, 0 étoile.
- **Ce qu'il fait** : on **décrit** un état de jeu (type de volant reçu, hauteur de frappe, « à quel point je suis en place », endurance des deux joueurs), on place sur le terrain trois points déplaçables (moi, volant, adversaire), et l'outil **classe les coups et les zones d'arrivée** par recommandation. Chaque note est **décomposée** : 9 facteurs pondérés (capacité à faire bouger l'adversaire, taux de réussite, zone faible visée, coût de déplacement pour soi, éviter les zones fortes, continuité de l'attaque, coût d'une faute, différence d'endurance, préférence de rythme). Demi-terrain découpé en 18 zones, coordonnées en mètres. Les poids sont réglables en direct par des curseurs. Position de l'adversaire déduite par défaut du coup reçu (il a joué un lob → il est au fond), avec un modèle de « balle dans le dos » (pénalité de déplacement si la cible est 0,35 m derrière lui, étiquette au-delà de 1 m). Paramètres regroupés dans un bloc `CALIB`, 12 auto-tests via `index.html#selftest`, moteur exporté en UMD (`window.BadmintonEngine`).
- **Proche** : même philosophie que notre spec, presque mot pour mot : moteur de règles déterministe sans IA, page statique hors ligne, simple uniquement, géométrie en mètres, chaque point de la note justifié, constantes calibrables par un humain, replacement de l'adversaire déduit du coup joué. L'auteur reconnaît la même limite que nous : paramètres empiriques, non calibrés sur des matchs réels.
- **Différent** : c'est un **assistant/conseiller**, pas un **quiz**. L'utilisateur saisit une situation qu'il connaît, il ne la devine pas : pas de génération aléatoire, pas de clic de cible avant révélation, pas de score de l'élève, pas de niveaux pédagogiques (débutant/intermédiaire/avancé), pas de carte continue (classement de 9 zones), pas de code visuel des trajectoires, chinois uniquement.
- **À reprendre** : la liste des 9 facteurs comme check-list pour notre carte (notamment « coût d'une faute », « continuité de l'attaque », « balle dans le dos » avec seuil) ; l'idée d'afficher le **détail de la note** facteur par facteur (cohérent avec notre anti-objectif « justification qui ne correspond pas à la note ») ; un bloc de configuration unique + une page d'auto-tests accessibles par une ancre d'URL. Licence MIT : la réutilisation de code est possible avec mention.

### 1.2 ezcat207 / badminton-tactics-board — « 羽毛球战术棋盘 » ★★
- **Lien** : https://github.com/ezcat207/badminton-tactics-board · démo : https://badminton-tactics-board.vercel.app
- **Plateforme / prix** : web Canvas, PWA hors ligne, anglais et chinois, gratuit. Aucune licence déclarée (donc pas de réutilisation de code sans accord). Code récupéré d'un APK Android « 羽毛球战术棋盘 v0.27 ».
- **Ce qu'il fait** : un **jeu** de plateau tactique : lire le volant qui arrive, planifier son jeu de jambes, choisir un coup, gérer endurance et équilibre. Règles séparées de l'interface (`court-rules.js`, `shot-model.js`, `footwork-model.js`, `recovery-model.js`, `feedback-model.js`, `engine.js`).
- **Proche** : décision coup par coup sur un terrain vu de dessus, modèle de replacement, retour pédagogique (`feedback-model`).
- **Différent** : logique de jeu (échange complet, ressources endurance/équilibre) plutôt que quiz d'une situation figée avec carte de la meilleure zone et justification sourcée.
- **À reprendre** : le découpage des modèles (coups, jeu de jambes, replacement, feedback) est une bonne grille pour structurer notre moteur ; l'idée d'« équilibre » du joueur comme variable qui restreint les coups possibles (proche de notre « statut de A »).

### 1.3 bachkhi29 / shuttle-studio ★
- **Lien** : https://github.com/bachkhi29/shuttle-studio · démo : https://bachkhi29.github.io/shuttle-studio/
- **Plateforme / prix** : web 3D, un seul fichier HTML, hors ligne, MIT, gratuit.
- **Ce qu'il fait** : tableau tactique 3D : placer les joueurs, dessiner des trajectoires de volant à la souris, rejouer un échange.
- **Différent** : outil de dessin, aucune évaluation.
- **À reprendre** : idées de rendu des trajectoires (la courbe de hauteur), utile pour comparer à notre code « pointillé = vitesse, courbe = hauteur ».

### 1.4 Beginner200 / Smash-Court ★
- **Lien** : https://github.com/Beginner200/Smash-Court · démo : https://smash-court-3d.vercel.app
- **Ce qu'il fait** : jeu de badminton 3D en TypeScript, au début de sa construction (moteur de règles fait, simulation d'échange prévue). Pas de licence. Simple inspiration.

### 1.5 mrksbrg / RacketGhost ★
- **Lien** : https://github.com/mrksbrg/RacketGhost (MIT, Android, aussi sur F-Droid)
- **Ce qu'il fait** : coach de *ghosting* (déplacements à vide vers des coins annoncés) pour squash, badminton et racketlon. Entraîne les jambes, pas la décision.

---

## 2. Recherche académique et jeux de données (badminton)

### 2.1 CoachAI — ShuttleSet, ShuttleSet22, ShuttleNet ★★ (données)
- **Lien** : https://github.com/wywyWang/CoachAI-Projects (MIT, Python, ~290 étoiles, poussé en 2026-07)
- **ShuttleSet** (KDD 2023) : https://arxiv.org/abs/2306.04948 — 36 492 coups, 3 685 échanges, 44 matchs 2018-2021, 27 joueurs et joueuses de haut niveau, **simple uniquement**. Par coup : type de coup (18 classes : smash, lob, dégagement, amorti, filet, poussette, services…), position de frappe, **positions des deux joueurs**, zone et coordonnées d'arrivée.
- **ShuttleSet22** (IJCAI) : https://arxiv.org/abs/2306.15664 — matchs 2022, 2 888 échanges en entraînement, utilisé pour le *CoachAI Badminton Challenge* 2023.
- **ShuttleNet** (AAAI 2022) : prédit le prochain type de coup et sa zone d'arrivée à partir du début de l'échange et du style des joueurs.
- **CoachAI Badminton Environment** et **CoachAI+** (https://github.com/KuangDW/CoachAI-Plus, Python, sans licence) : environnement d'apprentissage par renforcement qui simule un adversaire réaliste en simple.
- **Proche / différent** : c'est exactement la **donnée** qui nous manque pour calibrer (« depuis telle position, face à tel coup, où jouent les pros et qu'est-ce qui gagne le point »). Mais c'est de la prédiction de ce que les pros **font**, pas de ce qu'il **faudrait** faire, et ce sont des modèles en Python, pas des règles lisibles.
- **À reprendre** : (1) la **taxonomie des 18 coups** et le découpage en zones pour aligner notre catalogue ; (2) calculer hors ligne des statistiques simples (répartition des retours par coup reçu et position, taux de points gagnés par zone d'arrivée) pour **vérifier ou pondérer** nos règles, sans mettre de modèle dans l'appli ; (3) des situations réelles (positions + coup) comme **banque de situations** réalistes, en complément du tirage aléatoire. Vérifier la licence du jeu de données lui-même avant tout usage public.

### 2.2 Apprentissage par renforcement pour la tactique ★★ (modèle)
- **Offline RL for Badminton Tactical Decision** (EAAI) : https://wenminggong.github.io/papers/Offline_RL_for_Badminton_EAAI_paper.pdf — une action = **type de coup + zone d'arrivée visée + position de replacement**. C'est la même décomposition que notre réponse (coup + zone), avec en plus le replacement de soi.
- **RallyNet / Closed-loop AI** (CIKM 2023) : https://dl.acm.org/doi/pdf/10.1145/3583780.3616001 — prédit type de coup, zone d'arrivée et déplacement, et propose une boucle de retour vers le joueur.
- **Optimal shot prediction** (SciTePress 2026) : https://www.scitepress.org/publishedPapers/2026/143176/pdf/index.html — valeur d'action par RL + arbre de jeu.
- **SPAIT** (Journal of Big Data 2026) : https://link.springer.com/article/10.1186/s40537-026-01407-7 — prévision des déplacements selon le coup choisi.
- **À reprendre** : confirmation que le triplet (coup, zone, replacement) est la bonne unité de décision ; idée d'ajouter plus tard « où te replacer après ton coup » comme question bonus.

### 2.3 Vision par ordinateur (trajectoires, cartes de chaleur) ★
- **TrackNet / TrackNetV3** (suivi du volant image par image), **MonoTrack** (trajectoires 3D depuis une seule caméra), **MatchMotion** (prototype YOLOv8 : joueurs, volant, lignes, points de chute) : https://aircconline.com/csit/abstract/v16n08/csit160813.html
- **VIRD** (Harvard, analyse immersive de match pour coachs de haut niveau) : https://vcg.seas.harvard.edu/publications/20231023-vird-immersive-match-video-analysis
- **Différent** : analyse de vidéos de vrais matchs. Aucun ne pose de question à l'élève.
- **À reprendre** : piste future seulement (importer une situation vue en vidéo dans notre quiz).

### 2.4 Psychologie du sport : anticipation et décision ★ (fondement pédagogique)
- **Hagemann, Strauss & Cañal-Bruland (2006)** : entraînement à l'anticipation sur 200 clips vidéo de coups au-dessus de la tête, avec un repère coloré sur les indices utiles. Progrès significatif des **débutants**, aucun effet sur les experts. https://www.bisp-surf.de/Record/PU201102001437
- **Alder et al. (2014)** : occlusion temporelle + oculométrie sur le service ; les experts fixent les indices les plus discriminants. https://researchonline.ljmu.ac.uk/id/eprint/2062/
- **De Waelle et al. (2022)** : rôle de l'information contextuelle (position, déroulé de l'échange) dans l'anticipation, plus faible que supposé. https://lida.sport-iat.de/ta/Record/4081317
- **À reprendre** : la méthode « deviner avant de voir, puis comprendre » est validée, surtout chez les débutants ; guider l'attention (comme leur repère coloré) justifie notre carte vert/rouge révélée **après** la réponse.

---

## 3. Applications badminton (stores et web)

| Nom | Lien | Plateforme / prix | Ce qu'il fait | Proximité |
|---|---|---|---|---|
| Badminton Board – Tactics | https://apps.apple.com/us/app/id6761408995 | iPad, gratuit | Tableau tactique : déplacements, rotations, trajectoires, zones défensives, animations pas à pas (simple, double, mixte) | ★ dessin, pas d'évaluation |
| Badminton Tactics (cooltime) | https://play.google.com/store/apps/details?id=com.cooltime.badminton_tactics | Android, hors ligne | Dessin de schémas animés, préréglages de jeu de jambes en simple | ★ |
| Badminton Strategy Board (MOSPRO) | https://appadvice.com/app/badminton-strategy-board/1007996995 | iPad, abandonnée depuis 2016 | Tableau en 3 étapes | ★ |
| badminton score (Skich) | https://skich.app/games/badminton-score | Web/mobile | Tableau glisser-déposer + marquoir | ★ |
| BWF Shuttle Time | https://apps.apple.com/us/app/id1072937947 | iOS, gratuit, BWF | Programme scolaire officiel : plans de séance, vidéos, tableau de dessin | ★ source pédagogique officielle |
| Badminton Analytics | https://apps.apple.com/us/app/id6746388976 | iOS, gratuit (non vérifié) | On tape le point de chute de chaque volant pendant un match → cartes de chaleur | ★ données de son propre jeu |
| Feather Score Badminton | https://mwm.ai/apps/feather-score-badminton/6760303942 | iOS, mode Pro payant (non vérifié) | Marquoir + cartes de chaleur par type de coup | ★ |
| BadmintonPeak | https://badmintonpeak.com/en/badminton-game-analysis-app | iOS/Android, gratuit d'après le site, start-up parisienne (2025) | Analyse IA de vidéos filmées au téléphone : technique, placement, choix de coups, parcours d'exercices notés | ★★ juge les choix de coups, mais a posteriori sur vidéo |
| Formanti AI Badminton Coach | https://www.formanti.com/badminton | Web/app | Classification des coups sur vidéo, exercices suggérés | ★ technique |
| Smashspeed | https://apps.apple.com/app/6748543435 | iOS | Vitesse du smash par vision | ★ |
| Badminton Famly+ | https://plus.badmintonfamly.com/ | Web/app, abonnement | 2 500+ vidéos dont une section « leçons tactiques » | ★ contenu vidéo |
| BadmintonSkills | https://badmintonskills.com/the-app/ | iOS/Android | Exercices et séances simple/double | ★ |
| Coachbuddy | https://coachbuddy.ai/ | Machine à volants pilotée par IA | Rejoue des échanges de pros pour travailler anticipation et décision **sur le terrain** | ★★ même objectif, physique |
| Quizalize « Badminton » | https://resources.quizalize.com/view/quiz/badminton-06a1b7e5-76f7-47ee-8d9f-41e47789b1ee | Web, classe | Quiz de connaissances (nommer un coup), pas de situation | ★ |

Aucune de ces apps ne propose : situation générée → l'élève choisit cible + coup → révélation d'une carte de la meilleure zone avec score et justification.

Ressources de coaching sur la décision (sans app) : Badminton Andy, pratiques de prise de décision pour joueurs et coachs, avec un auto-questionnaire : https://badmintonandy.com/decision-making-practices-ideas-for-players/ et https://badmintonandy.com/decision-making-practices-recommendations-for-coaches/ ; fiche scolaire « Can you select the correct shot? » : https://www.emnethacademy.co.uk/attachments/download.asp?file=1720&type=pdf

---

## 4. Autres sports de raquette

### 4.1 Padel — Padel Chess: Tactics Trainer ★★★ (le plus proche en concept)
- **Liens** : https://www.padelchess.me/ · iOS https://apps.apple.com/us/app/padel-chess-tactics-trainer/id6761791683 · Android https://play.google.com/store/apps/details?id=me.padelchess.app · Product Hunt https://www.producthunt.com/products/padel-chess
- **Plateforme / prix** : web + iOS + Android. **Freemium** : 5 puzzles gratuits par jour, Premium illimité (prix non trouvé). Développeur solo, joueur d'échecs.
- **Ce qu'il fait** : la logique des puzzles d'échecs appliquée au padel. Des **situations tirées de vrais matchs** (100+ à « des centaines » selon la source), l'utilisateur **choisit le meilleur coup ou la meilleure stratégie** (où placer, quand lober, quand monter au filet), voit ce qui se passe sur le terrain, reçoit un retour et des points. Puzzle du jour, **pile de révision** des puzzles ratés (ils reviennent le lendemain en tête de file), classement entre amis, ligue et rating. Bibliothèque gratuite de 50 exercices.
- **Proche** : c'est notre boucle « situation → choix → révélation → explication », au service de la lecture du jeu.
- **Différent** : padel en double ; puzzles **écrits à la main** (choix entre quelques options A/B) et non générés ; pas de carte continue de la qualité des zones ; pas de score proportionnel à la qualité du clic ; pas de niveaux qui changent la bonne réponse (d'après les pages publiques, non vérifié dans l'app).
- **À reprendre** : la **pile de révision** des situations ratées (répétition espacée, sans compte : stockage local suffit), le **puzzle du jour** (même graine aléatoire pour tous, utile pour un coach et son groupe), les thèmes de puzzles (« lob », « défense », « filet ») pour cibler un principe, le vocabulaire « puzzle » familier aux joueurs d'échecs.

### 4.2 Padel/tennis/pickleball — tableaux tactiques ★
- **Racket TactiX** : https://apps.apple.com/app/id6746077723 — tableau tactique tennis, padel, pickleball.
- **PadelTTB** : https://mwm.ai/apps/padelttb/6755328177 — tableau tactique padel.
- **Tactical Board Online (tennis)** : https://tactical-board.com/uk/tennis — tableau tactique web.
- **PadelBoing** : https://apps.appfollow.io/ios/padelboing/1170933131?country=us — filet rebondisseur + app qui recrée 14 coups adverses pour s'entraîner seul.

### 4.3 Tennis
- **Sense Arena (ATP Tour Sense Arena)** ★★ : https://tennis.sensearena.com/players — réalité virtuelle sur Meta Quest, abonnement (19-39 $/mois selon une source de 2023, non vérifié). Volet « Learn to Win » : décisions en fond de court, au filet, en retour de service ; un exercice demande de **placer la balle dans la zone de couleur** correspondante chez l'adversaire. Proche dans l'intention, très différent en coût et en matériel. À reprendre : catégories de scénarios (fond de court, filet, retour) comme nos familles de situations.
- **TennisDex – Match Situations Quiz** ★★ : https://www.tennisdex.com/quiz — quiz web de 10 questions sur des moments clés de match, niveau avancé. Questions rédigées, sans terrain interactif.
- **Tennis Zone App – Tactics** ★ : https://www.tennis-zone-app.com/tactics.html — contenu tactique (« penser 1-2 coups à l'avance »), outil de planification.
- **Expected Shot Value (ESV)** ★★ (modèle) : Floyd et al. / Kovalchik (Zelus Analytics) sur données Hawk-Eye : https://arxiv.org/abs/2005.12853 · https://www.stat.cmu.edu/capstoneresearch/spring2020/66-502-Emery.pdf · métriques VAST, **Shot IQ** (qualité du choix de coup) et VACC (couverture du terrain). Le mémoire CMU évalue la valeur d'un retour vers **chaque zone** depuis la position de frappe : c'est conceptuellement notre carte vert/rouge, calculée sur données réelles. À reprendre : séparer dans le score la **qualité du choix** (zone + coup) de l'**exécution** (que nous ne mesurons pas) ; le nom « Shot IQ ».
- **Time to net** (Journal of Sports Analytics 2020) : https://journals.sagepub.com/doi/abs/10.3233/JSA-200406 — la qualité d'un coup mesurée par le temps qu'il laisse à l'adversaire (+8 points de précision de prédiction). Rejoint notre critère « temps de replacement que le coup laisse à A ».
- Recherche : formation à la décision en tennis : https://www.researchgate.net/publication/235660198 ; questionnaire des compétences tactiques en tennis (« anticipation et placement », « prise de décision ») : https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2022.988595/pdf

### 4.4 Squash ★
- **SquashGhosts** (iPad), **Squash Ghost** (audio, https://apps.apple.com/us/app/id1026953186), **SQUASHer Ghosting** (https://apps.apple.com/bj/app/squasher-ghosting/id6743124348), **Go to the T** (https://appfollow.io/ios/go-to-the-t/1214631105?country=us), **A-Champs ROX** (https://a-champs.com/pages/racket-sports-training) : déplacements et réaction, pas de choix de coup.

### 4.5 Tennis de table ★
- **PingPi** (https://apps.apple.com/us/app/id6768219425, analyse vidéo : schémas de coups, zones de chute), **My Ping Notes** (2,99 $, carnet de faiblesses adverses, https://apps.apple.com/ca/app/my-ping-notes/id6760237864), **TTFit** (exercices, https://apps.apple.com/gb/app/ttfit/id1130737391). Aucun entraîneur à la décision de placement trouvé.

---

## 5. Synthèse

### Notre concept existe-t-il déjà ?
**Pas sous cette forme.** Deux projets en couvrent chacun une moitié :
- **Mofan-mofan/badminton-tactics** a le **moteur** : règles déterministes en page statique, simple, facteurs pondérés expliqués un par un, replacement de l'adversaire déduit du coup reçu. Mais c'est un **conseiller** où l'on décrit la situation, pas un quiz où l'on devine, et il n'y a ni niveaux, ni carte continue, ni score de l'élève. Interface en chinois.
- **Padel Chess** a la **boucle pédagogique** : situation → choix → révélation → retour, avec puzzle du jour et révision des erreurs. Mais c'est du padel en double, avec des puzzles écrits à la main et des choix fermés.

Aucun outil trouvé, en badminton ni dans les autres sports de raquette, ne combine : situation **générée** et réaliste en simple, **clic libre** de la cible, choix du coup, **carte continue** de la qualité des zones, **score** proportionnel, **justification sourcée**, et **niveaux** qui changent la bonne réponse. Les apps badminton du marché sont des tableaux de dessin, des marquoirs avec cartes de chaleur ou de l'analyse vidéo IA a posteriori. La VR (Sense Arena) vise la même compétence, mais en tennis et avec un casque payant.

### Les trous qu'il comble
1. **Entraînement à la lecture du jeu hors du terrain, en badminton** : rien de comparable en français, ni même en anglais.
2. **Réponse graduée et non binaire** : la carte continue + le score sur 100 récompensent un « presque bon », là où les quiz existants sont à choix fermés.
3. **Niveaux qui changent la bonne réponse** : aucun outil ne modélise qu'un débutant et un joueur avancé n'ont pas la même meilleure option.
4. **Justification traçable vers des sources de coaching** : seul Mofan détaille sa note, sans sources ; les apps IA ne justifient pas.
5. **Gratuit, hors ligne, web, mobile, sans matériel** : contrairement à la VR, aux machines (Coachbuddy) ou à l'analyse vidéo.
6. **Outil de coach** pour l'entraînement en groupe (une même situation projetée, discutée règle par règle).

### Sources de données et d'idées réutilisables
- **ShuttleSet / ShuttleSet22** (CoachAI, MIT pour le code ; licence des données à vérifier) : 18 types de coups, positions des deux joueurs, zones d'arrivée sur des matchs de haut niveau en simple. Usage hors ligne pour **valider ou pondérer** nos règles (fréquence des retours par situation, taux de points gagnés par zone) et comme **banque de situations réelles**, sans modèle dans l'appli.
- **Mofan-mofan/badminton-tactics** (MIT) : liste des 9 facteurs, modèle « balle dans le dos » avec seuils, bloc de calibration unique, auto-tests par ancre d'URL.
- **Padel Chess** : puzzle du jour (graine partagée), pile de révision des situations ratées, thèmes de puzzles.
- **Tennis ESV / Shot IQ / time to net** : séparer qualité du choix et exécution ; critère du temps laissé à l'adversaire comme facteur explicite.
- **RL badminton (EAAI, RallyNet)** : unité de décision (coup, zone, replacement), piste d'une question « où te replacer ? » en avancé.
- **Hagemann et al. 2006** : appui scientifique du « deviner puis voir », efficace surtout chez les débutants.
- **BWF Shuttle Time** et **Badminton Andy** : vocabulaire et progression pédagogique officiels, à croiser avec le référentiel EPS déjà cité dans la spec.

### Points à vérifier avant de s'en servir
- La licence des **données** ShuttleSet (le dépôt de code est MIT, ce qui ne couvre pas forcément les annotations de matchs BWF).
- Le contenu réel de Padel Chess dans l'app (forme du terrain, nature du retour, présence de niveaux) : les pages publiques ne le montrent pas.
- Les prix des apps marquées « (non vérifié) ».

---

## Annexe — Lecture détaillée du moteur Mofan-mofan/badminton-tactics

Code lu : `index.html` du dépôt (v0.2), module `BadmintonEngine`, fonctions `recommend`, `scoreCandidate`, `reachDetail`, `execSuccess`, `energyModel`, `resolveOppPos`, `feasible`, `genTargets`, et les tables `SHOTS`, `INCOMING`, `DEFAULT_WEIGHTS`. Le moteur a été lu, pas exécuté.

### Comment il calcule
1. **Coups possibles** (`feasible`) : chaque coup déclare la profondeur d'où il se joue (`from`), la hauteur de frappe minimale (`minHit`), les coups reçus auxquels il répond (`incomingOnly`, ex. bloc seulement contre smash/drive) et s'il est réservé aux situations subies (`passiveOnly`). Le smash est interdit quand on est en défense. Les coups écartés sont listés avec la raison.
2. **Cibles** (`genTargets`) : chaque coup vise une bande de profondeur (fond, milieu, filet) et une direction (ligne, croisé, corps, côtés, tout). On obtient au plus 9 zones, notées par leur **centre**.
3. **Position de l'adversaire** (`resolveOppPos`) : par défaut `x = 0` (au centre en largeur) et une profondeur qui mélange l'endroit d'où il a frappé (55 %) et le centre de son demi-terrain à 10,05 m (45 %). Exemple : après un dégagement, il est à 11,1 m (≈ 2,3 m de sa ligne de fond) ; après un filet, à 8,9 m (≈ 2,2 m du filet).
4. **Difficulté d'atteinte** (`reachDetail`) : distance jusqu'à la cible moins l'allonge (0,55 m), × pénalité de fond selon le gabarit, × 1,06 en croisé (1,22 si l'adversaire tourne lentement), × une pénalité « balle dans le dos » qui monte de 1 à 1,30 entre 0,35 m et 2,35 m derrière lui. Divisée par sa vitesse (2,9 m/s × niveau × gabarit × fatigue), cela donne un temps ; difficulté = temps / 1,45 s, plafonnée à 1.
5. **Note** (`scoreCandidate`) : 9 critères entre −1 et 1, chacun multiplié par son poids, puis `note = 50 + 45 × (somme des contributions / somme des poids)`, bornée entre 2 et 98. Poids par défaut : difficulté d'atteinte 1,60, réussite de son propre coup 1,35, zone faible 1,20, mon déplacement 1,00, zone forte 0,90, risque de faute 0,90, continuité de l'attaque 0,90, écart de fatigue 0,80, longueur d'échange 0,60.
6. **Justification** : les 3 contributions positives les plus fortes deviennent les « pour », les 2 plus négatives les « contre », chacune avec une phrase générée à partir des valeurs réellement utilisées.

### Ce qui rejoint nos principes (§5.4 de la spec), donc reprenable
| Élément Mofan | Notre principe | Verdict |
|---|---|---|
| Croisé : risque de faute × 1,12, difficulté × 1,06 | Ligne plus sûre que croisé | ✅ reprendre la formule, en liant le surcoût au statut (voir plus bas) |
| Position de l'adversaire déduite du coup qu'il a joué, mélange 55/45 avec le centre | Replacement biaisé selon le coup joué | ✅ reprendre le principe et le paramètre de mélange |
| Pénalité « balle dans le dos » avec seuil 0,35 m et rampe sur 2 m | Exploiter le replacement de B (niveau avancé) | ✅ reprendre tel quel, c'est bien pensé |
| Temps d'atteinte = distance effective / vitesse, rapporté à 1,45 s | Distance à B replacé | ✅ meilleur qu'une distance brute : se convertit en temps, comparable entre coups |
| Filtre des coups (profondeur, hauteur, attaque/défense) avec raison du rejet | Statut de A qui restreint les coups ; pas de coup irréaliste | ✅ même idée, la liste des raisons est utile pour l'élève qui choisit un coup impossible |
| Note = moyenne pondérée normalisée, justification = critères qui ont le plus pesé | Score + justification fidèle à la note | ✅ reprendre la formule et le tri des contributions |
| Table de 25 coups avec constantes (pression, attaque, risque de base, coût d'une faute) | Catalogue des coups de simple | ⚠️ bonne base de départ, mais valeurs choisies à la main, à revoir une par une |
| `likelyReply` : phrase sur la réponse probable de l'adversaire | Puce « ce que fait B » dans la justification | ✅ idée à reprendre (textes à réécrire en français) |
| Côté revers dépendant de `left_handed` | Latéralité en paramètre | ✅ même approche |

### Ce qui s'écarte de nos principes, à ne pas reprendre tel quel
1. **La vitesse du coup ne compte pas.** La difficulté d'atteinte ne dépend que de la distance de l'adversaire, pas du temps de vol du volant. Un smash et un dégagement vers la même zone ont la même difficulté. Or notre spec note « le temps que le coup laisse », et nos principes en dépendent (amorti rapide qui empêche le filet serré, dégagement haut qui donne du temps). Il faut ajouter le temps de vol de chaque coup et comparer **temps de vol − temps d'atteinte**.
2. **Le replacement de soi est toujours le centre.** Tous les coups renvoient au même point (sauf l'avancée après un smash). Le principe « un dégagement haut sert à gagner du temps pour se replacer » n'est donc pas calculé : il est approché par des constantes (« longueur d'échange », « continuité de l'attaque »).
3. **L'adversaire est toujours au centre en largeur** (`x = 0`) en mode automatique. Impossible alors de modéliser « l'adversaire décalé → amorti croisé », un de nos principes. Notre B replacé doit garder un décalage latéral.
4. **Pas de revers de fond par défaut.** La zone faible n'existe que si l'utilisateur coche « revers faible ». Dans notre spec, le fond côté revers d'un droitier est la cible de base.
5. **Pas de risque lié aux lignes.** Les cibles sont des centres de zones, donc viser à 10 cm de la ligne n'est pas pénalisé. Notre carte continue doit ajouter ce critère.
6. **Le croisé n'est pas lié à l'équilibre.** Le surcoût du croisé est fixe ; seul le risque global augmente quand on est en difficulté. Notre principe est plus fort : « croisé seulement quand on est équilibré ». Il faudrait un surcoût du croisé qui grandit quand A est en défense.
7. **Ses « niveaux » ne sont pas les nôtres.** Chez lui, le niveau change l'habileté et la vitesse des joueurs. Chez nous, le niveau change la **bonne réponse** (poids des critères). Rien à reprendre ici.
8. **Hors de notre périmètre** : profils d'adversaire (gabarit, points forts et faibles), endurance des deux joueurs, longueur d'échange voulue. Trois critères sur neuf disparaissent donc (écart de fatigue, longueur d'échange, et zones fortes/faibles hors revers).

### Conclusion
Pour **calculer** les meilleurs coups, Mofan apporte une structure qui marche et quatre formules reprenables : temps d'atteinte avec allonge et balle dans le dos, position de l'adversaire déduite du coup, surcoût du croisé, note normalisée avec justification tirée des contributions. Il ne peut pas servir de **vérité** : ses constantes sont arbitraires, et il manque les trois mécanismes au cœur de notre spec (temps de vol du coup, décalage latéral de B, risque des lignes). Licence MIT : reprendre le code impose de garder la mention de copyright.

### Décision (2026-11-08)
On ne reprend **aucune ligne du code** de Mofan. On reprend seulement les **logiques** cohérentes avec nos principes (tableau « Ce qui rejoint nos principes »), réécrites dans notre moteur et rattachées à nos sources du §5.4 de la spec. Les écarts listés plus haut ne sont pas repris. Mofan est cité comme source d'inspiration ; reprendre une idée sans le code ne crée pas d'obligation de licence.
