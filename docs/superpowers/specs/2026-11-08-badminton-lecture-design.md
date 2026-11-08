# Badminton Lecture — document de conception

Date : 2026-11-08 · Auteur : Vincent (avec Claude)

Maquettes validées : `mockups/flow-v10.html` (déroulé d'une situation) et `mockups/trajectoires-v3.html` (code des trajectoires). Ouvrir dans un navigateur (le style de cadre du compagnon visuel n'est pas inclus, la mise en page reste lisible).

## 1. Intention

Un outil d'entraînement à la **lecture du jeu en simple**. Il sert à Vincent pour lui-même, et à un coach à l'entraînement avec ses élèves.

L'appli génère une situation : deux joueurs placés sur un terrain vu de dessus, et un coup que B vient de jouer. Le joueur A reçoit ce coup. L'élève doit décider **où** renvoyer le volant chez B et **avec quel coup**. L'appli révèle ensuite la meilleure réponse sous forme de carte vert/rouge, avec un score et une justification.

Le pourquoi : on apprend à lire le jeu en devinant **avant** de voir la réponse, puis en comprenant pourquoi. Tout doit être justifiable, pour qu'un élève ou un coach puisse faire confiance au score et discuter chaque règle.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Générer au clic une situation aléatoire réaliste : positions de A et B, coup de B cohérent avec la position de B.
- Mode quiz : l'élève clique sa cible sur le terrain de B, choisit son coup, valide, puis voit la révélation.
- Révélation : carte vert vif / vert clair / rouge sur le terrain de B, meilleur coup, alternative, score sur 100, justification en liste à puces.
- Trois niveaux (débutant, intermédiaire, avancé) qui changent la bonne réponse et les justifications.
- Couvrir l'ensemble des coups de simple et des situations possibles, en s'appuyant sur des principes de coaching sourcés.
- Fonctionner sur ordinateur et sur mobile.

**Non-objectifs (pour cette version)**
- Le double.
- Les gauchers : les deux joueurs sont droitiers. Le modèle doit toutefois prévoir la latéralité comme paramètre, pour l'ajouter plus tard sans tout réécrire.
- L'IA dans la boucle (voir §6). Elle pourra venir plus tard, pour enrichir les explications.
- Les comptes utilisateurs, l'historique des scores, le multijoueur.
- La simulation physique fine du volant (aérodynamique).

**Anti-objectifs (ce qui ferait de l'appli un échec même si elle « marche »)**
- Des réponses incohérentes : deux situations identiques avec deux réponses différentes, ou un score qui contredit la carte.
- Des situations irréalistes : smash depuis le filet, filet depuis le fond, volant pris « haut » alors qu'il arrive sous le filet.
- Une justification qui ne correspond pas à ce qui a réellement décidé de la note.
- Des erreurs d'orientation : coup droit et revers inversés.

## 3. Contraintes

- **Développement local, page web statique** : HTML, CSS et JavaScript, sans serveur ni backend. Une version web mobile sera mise en ligne plus tard telle quelle, l'architecture ne doit donc dépendre de rien de local.
- **Pas d'IA ni d'API externe** pour générer ou évaluer une situation. Décision de Vincent, sur recommandation : cohérence, géométrie précise, règles vérifiables, instantané, gratuit, hors ligne.
- **Responsive** : ordinateur et mobile (tactile).
- **Dimensions officielles BWF** du terrain : 13,40 m × 6,10 m. Couloirs latéraux de simple à 0,46 m du bord (largeur de simple 5,18 m). Ligne de service court à 1,98 m du filet. Ligne de service long du double à 0,76 m du fond (en simple, la limite arrière est la ligne de fond). Filet à 1,55 m aux poteaux et 1,524 m au centre.
- **Langue de l'interface** : français.

## 4. L'écran (décidé, voir maquettes)

### 4.1 Orientation et joueurs
- Terrain vertical, vu de dessus. **A en bas** (il reçoit, c'est le point de vue de l'élève), **B en haut**.
- A en bleu, B en rouge, chacun dans un rond avec sa lettre.
- **Une pastille ronde « D » (droitier) ou « G » (gaucher)**, de la couleur du joueur, sans bordure, fondue dans le bord de son rond, en haut, du côté de son coup droit : à droite de l'écran pour A, à gauche pour B. Elle remplace la raquette dessinée puis l'arc blanc, retirés. Seuls les droitiers sont gérés pour l'instant. *(décision de Vincent)*

### 4.2 Étape 1 : la question
Tout se passe sur le terrain, sans panneau à côté.
- Une **barre du haut**, fine : sélecteur de niveau et bouton « Nouvelle situation ».
- Un **bandeau** au-dessus du terrain décrit le coup de B en mots : type, direction (ligne ou croisé), zone d'arrivée, hauteur à laquelle A prend le volant (par ex. « volant pris haut, en tour de tête »). Il commence par « Situation : B fait … » (par ex. « Situation : B fait un amorti rapide en ligne, vers le milieu côté revers de A. Volant pris bas, en revers. »). La consigne « Clique sur le terrain de B pour répondre. » est en bas à droite du terrain, en petit texte clair, sans fond, pendant la question seulement. *(décision de Vincent)* Le bandeau occupe une **bande réservée** au-dessus du terrain : il ne cache jamais la ligne de fond de B ni la zone « dehors » derrière elle, qui restent visibles et cliquables. La bande est ajustée aux deux lignes du texte, et 0,4 m de zone « dehors » reste visible au-dessus de la ligne de fond de B. *(décision de Vincent)*
- Trajectoire du coup de B en **trait continu rouge** (couleur de B) jusqu'au point de chute, un **rond bleu** (couleur de A).
- A est affiché à sa position de départ. Son retour part du **point d'impact** (là où il rejoint le volant), pas de sa position de départ.
- **Au survol** du terrain de B (ordinateur), un aperçu en **pointillé bleu** part du point d'impact vers le curseur, terminé par un petit point bleu.
- **Un clic sur le demi-terrain de B** place le point et ouvre une **fenêtre de choix du coup** à côté du point. Elle contient trois groupes de boutons, « Vers l'avant », « Vers le fond » et « Rapides », un bouton « ✕ » pour la fermer et le bouton « Valider », inactif tant qu'aucun coup n'est choisi. Échap ou « ✕ » ferme la fenêtre en gardant le point ; un nouveau clic sur le terrain déplace le point et rouvre la fenêtre.
- **Sur tactile**, l'aperçu apparaît au contact, suit le glisser, et le relâchement place le point et ouvre la fenêtre. Le point reste déplaçable jusqu'à la validation.

### 4.3 Étape 2 : la révélation
La révélation se fait sur le terrain.
- **Plus de carte de couleurs** *(décision de Vincent)* : deux **ovales** sur le terrain de B, coupés aux limites du demi-terrain de simple. **Zone 1** (vert vif) autour du meilleur retour, **zone 2** (vert clair) autour du deuxième choix, c'est-à-dire le meilleur coup d'une autre famille. Chaque ovale est centré sur le point du retour et couvre les points à moins de 1,5 m où le même coup garde 90 % de sa valeur. Une étiquette « Meilleur retour 1 » / « Meilleur retour 2 », avec le nom du coup sur une deuxième ligne, nomme le coup. La ligne du tiroir « Alternative » devient « Deuxième choix ».
- B affiché à **sa position replacée** (rond plein) au moment où A frappe, et à sa position de frappe en **rond pointillé**. A affiché à son **point de frappe**, et à sa position de départ en **rond pointillé**. Entre les deux positions de chaque joueur, de **légères traces de pas** (semelle et talon, alternées, dans le sens de la marche) montrent le déplacement. Pas de flèche. *(décision de Vincent)*
- Retour de l'élève **en pointillé bleu** (couleur de A) avec un petit point bleu au point visé, avec le même style qu'à l'étape 1. *(décision de Vincent, il était d'abord jaune)*
- Meilleur retour en **pointillé blanc**, comme tout retour de A.
- Si le coup choisi ne peut pas atterrir à la profondeur du point, « Ton choix » commence par « Coup impossible jusque-là. » (la ligne repliée du tiroir garde seulement le score et le meilleur coup), le trajet bleu s'arrête au vrai point de chute (sur la même ligne, à la profondeur la plus proche que le coup peut atteindre) et la suite jusqu'au point est en pointillé rouge. *(décision de Vincent)*
- Un **tiroir repliable** en bas du terrain, **déplié dès la validation** (décision de Vincent, il était d'abord replié) : une ligne « Score : NN / 100 — Meilleur : <coup> » avec un chevron. Déplié, il donne le détail : ton choix, score sur 100, meilleur retour (coup + zone), « Pourquoi » en **liste à puces** (une raison par ligne : position/statut, ce que fait B, la zone, le coup, la direction), et une ligne « Alternative : <coup et zone> » sans référence à une couleur.
- Un changement de niveau après la révélation recalcule la révélation pour la même situation et garde l'état du tiroir.

### 4.4 Étiquettes et explications
- **Pas de légende** *(décision de Vincent, elle a été retirée)* : les étiquettes sur le terrain nomment chaque coup.
- Chaque bouton de coup a une **infobulle** qui explique le coup, et le coup sélectionné est décrit sous les boutons (pour le mobile, sans survol). *(décision de Vincent)*
- Sur le terrain, le **nom du coup** est écrit au milieu de chaque tracé, dans une petite étiquette (fond sombre translucide, texte blanc). Le **meilleur retour** se termine par un **point blanc**, et l'étiquette de sa zone est décalée pour ne pas le couvrir. La consigne en bas à droite est un texte blanc simple, sans ombre. *(décision de Vincent)*
- Dans le tiroir, « Ton choix » (coup, zone, score et ses raisons) est dans un **encadré à contour blanc**, et « Meilleur retour » (coup, zone et ses raisons) dans un **encadré distinct** (fond légèrement éclairci, sans bordure, titre en vert vif). Il n'y a plus de section « Pourquoi » séparée. *(décision de Vincent)*

### 4.5 Tracés (vue de dessus)
*(décision de Vincent : le code « le pointillé dit la vitesse » est abandonné)*
- **Coup de B** : trait **continu**, couleur de B (rouge). Son point d'arrivée est un rond **bleu** (couleur de A, qui va le jouer).
- **Retours de A** : trait **pointillé**, toujours le même pointillé. Bleu (couleur de A) pour le retour de l'élève, blanc pour le meilleur retour.
- **La courbe dit la hauteur** : droit = à plat ou descendant, légère courbe = juste assez haut pour passer, forte courbe = très haut. C'est un symbole : vu réellement de dessus, la trajectoire serait droite.
- La partie d'un retour que le coup ne peut pas atteindre est en pointillé rouge.

### 4.6 Mobile et traits
- Même écran que sur ordinateur : le terrain en pleine largeur, la barre du haut au-dessus, le bandeau, la fenêtre de choix et le tiroir par-dessus le terrain.
- Les **épaisseurs de trait et les longueurs de pointillé sont constantes en pixels**, quelle que soit la taille de la fenêtre ; seules les formes (ronds, point de chute, points visés) suivent la taille du terrain.
- Chaque situation est **partageable** : l'adresse contient `?seed=&level=`, et la même adresse rechargée affiche la même situation. « Nouvelle situation » ajoute une entrée à l'historique du navigateur : précédent et suivant font revenir aux situations déjà vues, telles qu'elles étaient (avec la révélation si la réponse avait été validée). Le changement de niveau remplace l'entrée courante. *(décision de Vincent)*
- Une fois la réponse validée, l'adresse contient aussi le choix (`&shot=…&x=…&y=…`, le point visé arrondi au centimètre) : recharger ou partager le lien réaffiche la révélation avec le même score. La validation ajoute une entrée à l'historique : « précédent » réaffiche la même situation sans réponse. *(décision de Vincent)*

## 5. Le moteur de décision

### 5.1 Ce que Vincent a décidé
- Un **moteur de règles déterministe** : même situation et même niveau, même réponse.
- **Trois niveaux** calqués sur les paliers des référentiels :
  - **débutant** : la sécurité avant tout, un principe à la fois (faire courir, viser le revers, marges larges, lob long) ;
  - **intermédiaire** : choisir selon son statut (attaque, neutre ou défense) ;
  - **avancé** : exploiter le replacement de B, le croisé quand on est équilibré, les amortis rapides.
- **Score** avec deux composantes : la qualité de la zone visée (la valeur de la carte au point cliqué) et la pertinence du coup choisi. Un coup irréaliste dans la situation est fortement pénalisé.
- **Justification** générée à partir des critères qui ont le plus pesé dans la décision. Chaque règle est rattachée à une source.

### 5.2 Le modèle validé
1. **Génération** : positions aléatoires de A et B, puis un coup de B tiré parmi les coups réalistes depuis la position de B, avec sa direction, sa vitesse, sa hauteur et sa zone d'arrivée probable chez A.
2. **Statut de A**, déduit de la hauteur de prise du volant et du temps disponible pour l'atteindre : attaque (pris haut et tôt), neutre, défense (pris bas, tard ou loin). Le statut restreint les coups possibles pour A.
3. **Replacement de B** après son coup, biaisé selon le coup joué : vers l'arrière après un dégagement ou un amorti rapide, vers l'avant après un filet.
4. **Carte** : chaque point du terrain de B reçoit une note qui combine la distance à B replacé, le côté faible de B (fond côté revers pour un droitier), le risque (proximité des lignes, croisé hors équilibre) et le temps de replacement que le coup laisse à A. Le niveau pondère ces critères.
5. **Meilleur coup** pour atteindre la meilleure zone, compatible avec le statut de A. Une alternative distincte est aussi proposée.

**Logiques reprises de Mofan-mofan/badminton-tactics** (idées seulement, aucun code repris, voir `docs/research/prior-art.md`, annexe) :
- **Coups impossibles avec leur raison** : chaque coup déclare d'où il se joue (profondeur), la hauteur de frappe minimale et les coups reçus auxquels il répond. Si l'élève choisit un coup impossible, la raison lui est donnée.
- **Position de B replacé** : un mélange entre son point de frappe et le centre de son demi-terrain, selon une proportion réglable.
- **Temps d'atteinte** : distance de B replacé à la cible, moins son allonge, divisée par sa vitesse de déplacement, rapportée à un temps de référence.
- **Balle dans le dos** : pénalité de déplacement quand la cible est derrière B, nulle sous un petit seuil, puis croissante.
- **Croisé** : risque de faute et temps d'atteinte majorés par rapport à la ligne.
- **Note et justification** : chaque critère donne une contribution pondérée, la note est leur moyenne normalisée, et la justification reprend les contributions les plus fortes, pour et contre.
- **Ce que B va probablement jouer ensuite** : une phrase dans la justification.

**Ce que le moteur doit couvrir en plus** (absent chez Mofan) :
- **Temps de vol du volant** selon le coup : la qualité d'un retour dépend de l'écart entre le temps de vol et le temps d'atteinte de B, pas de la seule distance.
- **Décalage latéral de B** replacé : B ne revient pas forcément au centre en largeur, pour pouvoir jouer le croisé quand il est décalé.
- **Risque près des lignes** : viser trop près d'une ligne est pénalisé, et le surcoût du croisé augmente quand A est en défense.

### 5.2 bis Carte, score et justification (précisions)
- **Le moteur évalue des couples (point, coup).** Pour chaque coup permis par le statut de A, chaque point du terrain de B reçoit une valeur et le détail des critères qui la composent. *(choix de Claude)*
- **La carte affichée** donne, pour chaque point, la valeur du meilleur coup permis vers ce point (carte composite). *(choix de Claude)*
- **Le score de l'élève** est la valeur du couple qu'il a choisi (son point, son coup), ramenée sur 100 par rapport au meilleur couple. Un coup incohérent avec la zone (amorti visé sur la ligne de fond) ou avec le statut (smash sur un volant pris sous le filet) est pénalisé par cette même valeur. Le score ne peut donc pas contredire la carte. *(choix de Claude)*
- **Le « Pourquoi »** a deux blocs, sans IA :
  - « Meilleur retour » : les critères qui ont le plus pesé pour le meilleur couple ;
  - « Ton choix » : la comparaison critère par critère entre le couple de l'élève et le meilleur ; les plus gros écarts deviennent des puces (par ex. « tu vises à 1 m de l'endroit où B se replace », « un amorti lent depuis le fond lui laisse un filet serré »).
  Décision de Vincent : expliquer aussi le choix de l'élève. Méthode déterministe : choix de Claude.
  Quand le coup choisi n'est pas jouable dans la situation, « Ton choix » commence par « Coup impossible dans ta situation. », dit pourquoi en une puce (hauteur du volant, statut trop faible ou zone du terrain d'où l'élève frappe), puis liste les coups jouables ici. Quand le coup ne peut pas atterrir à la profondeur visée, elle commence par « Coup impossible jusque-là. ». *(décision de Vincent)*
- **Le niveau** ne change que les pondérations, donc la bonne réponse, le score et la justification. Les situations générées, les coups proposés et l'interface sont les mêmes à tous les niveaux. *(décision de Vincent)*
- **Les règles** vivent dans un seul fichier de configuration lisible dans le projet (critères, poids par niveau, seuils, et source de chaque principe). Pas d'écran d'édition. *(décision de Vincent)* Afficher la source dans l'appli n'est pas requis.

### 5.2 ter Situations de service
B peut aussi **servir** *(décision de Vincent)*. Le générateur applique alors les règles du simple : B dans sa zone de service (droite si son score est pair, gauche s'il est impair, tirée au hasard), A dans la zone de réception en diagonale. Service court : le volant tombe au-delà de la ligne de service court, dans la zone de service de A. Service long : il tombe au fond, jusqu'à la ligne de fond. A répond selon les mêmes règles qu'en cours d'échange.

### 5.2 quater Calibrage
Vincent ne fournira pas de situations de référence : **Claude calibre** les poids à partir des principes du §5.4. Le livrable inclut une série de situations types (au moins une par famille de coup de B et par statut de A), avec la réponse attendue par niveau et sa justification par les principes. Ces situations servent de tests automatisés et de base de discussion pour la suite.

### 5.3 Catalogue des coups de simple
Service court, service long, dégagement haut, dégagement d'attaque, smash, amorti lent, amorti rapide, filet, lob défensif, lob d'attaque, drive, contre-amorti (bloc). Chacun peut être joué en ligne ou en croisé, en coup droit, en revers ou en tour de tête.

### 5.4 Principes de coaching retenus (sources)
- Le dégagement n'est à jouer que s'il n'y a pas d'alternative, car il expose au smash ; un dégagement haut et long sert à gagner du temps pour se replacer. ([mobilesport.ch](https://assets01.sdd1.ch/assets/lbwp-cdn/mobilesport/files/1676392051/mobilesport-badminton--tactique-bons-choix.pdf), [Wikibooks](https://en.wikibooks.org/wiki/Badminton/Strategy))
- Replacement biaisé vers l'arrière après un dégagement, un lob ou un amorti rapide, vers l'avant après un filet. Après un amorti croisé, on atteint rarement la base idéale. ([Badminton Bible – base centrale](https://badmintonbible.com/tactics/singles/central-base))
- Ligne plus sûre que croisé ; croisé seulement quand on est équilibré ; un filet croisé ouvre le terrain au contre en ligne ; un lob croisé est difficile depuis une position étirée. ([Badminton Bible – filet croisé](https://badmintonbible.com/shots/forecourt/net-shots/cross), [lob croisé](https://www.badmintonbible.com/shots/forecourt/lifts/cross))
- L'amorti croisé est fort quand l'adversaire est décalé (déplacement en diagonale). L'amorti en ligne serré est plus sûr quand il est centré mais au fond. ([Dear Badminton](https://dearbadminton.com/best-shot-to-play-when-opponent-fails-to-return-to-base-position))
- Un amorti rapide empêche le filet serré adverse ; un amorti lent le permet. ([Badminton Bible](https://badmintonbible.com/tactics/singles/building-shots/drops))
- Le revers de fond est la cible classique ; un bon tour de tête la neutralise. ([Wikibooks](https://en.wikibooks.org/wiki/Badminton/Strategy), [badminton-coach.co.uk](https://badminton-coach.co.uk/discussion-forum/intermediate-general-qa/better-shots-down-the-backhand-side))
- Paliers par niveau : un principe à la fois, puis selon son statut dans le rapport de force, puis selon un adversaire identifié. ([Référentiel EPS Grenoble](https://eps-pedagogie.web.ac-grenoble.fr/sites/default/files/media-d7/media-fichiers/2019-12/bcp_referentiel_badminton.pdf))

- Structure d'un moteur de règles pour le simple (temps d'atteinte, balle dans le dos, replacement déduit du coup, note décomposée par critère), reprise sous forme d'idées seulement. ([Mofan-mofan/badminton-tactics](https://github.com/Mofan-mofan/badminton-tactics))

**Limite connue** : aucune source ne fournit une table officielle « tel coup reçu, telle position → tel retour ». Le moteur est une **modélisation** construite à partir de ces principes. Les règles doivent rester lisibles et modifiables, pour qu'un coach puisse les contester et les corriger.

## 5 bis. Existant à consulter
Voir `docs/research/prior-art.md`. Rien n'existe sous cette forme. Pour le constructeur :
- **Mofan-mofan/badminton-tactics** (MIT) : liste de 9 facteurs pondérés, modèle « balle dans le dos », bloc de calibration unique et auto-tests. C'est une check-list utile pour la carte.
- **ShuttleSet** (CoachAI) : taxonomie de 18 coups et positions réelles. Peut servir hors ligne à vérifier les règles. La licence des données est à vérifier avant tout usage.
- **Padel Chess** : puzzle du jour, pile de révision des erreurs. Ce sont des idées pour plus tard, **hors périmètre** de cette version.

## 6. L'IA (hors périmètre, mais à ne pas bloquer)
Plus tard, une IA pourra reformuler la justification calculée par le moteur ou répondre à « et si j'avais joué X ? ». Elle explique, elle ne décide jamais. Le moteur doit donc exposer ses critères et leurs poids de façon structurée.

## 7. Laissé au constructeur
- Le choix du framework ou du JavaScript vanilla, et de l'outillage (build, tests), tant que le résultat est une page statique.
- Les formules exactes, les poids et les seuils du moteur, à condition qu'ils soient regroupés dans une configuration lisible et rattachés aux principes du §5.4.
- Le nombre exact de boutons de coups proposés à l'élève et leur regroupement.
- La palette exacte, la typographie et le rendu du dégradé de la carte.
- La formulation des justifications.

## 8. Choix faits par Claude (à vérifier par Vincent)
- Les trois niveaux nommés débutant, intermédiaire et avancé.
- Une pastille fixe de latéralité, sans posture de frappe.
- Le coup de B à la couleur de B, et les retours de A à la couleur de A.
- Le retour qui part du point d'impact.
- Le comportement tactile : glisser, relâcher, point déplaçable.
- L'abandon de la vue de côté, remplacée par la courbe des tracés.
- La page web statique (Vincent laisse le choix de la techno libre).
- La carte composite et le score par couple (point, coup), voir §5.2 bis.
- La justification du choix de l'élève par comparaison de critères, sans IA.
- Le calibrage des poids et la série de situations types (§5.2 quater).
- Tout sur le terrain, sans panneau latéral : barre du haut, bandeau, fenêtre de choix du coup et tiroir de révélation. *(décision de Vincent)*
- Le bandeau dans une bande réservée au-dessus du terrain, pour que la ligne de fond de B et la zone « dehors » restent visibles. *(décision de Vincent)*
- Le clic sur le demi-terrain de B place le point et ouvre la fenêtre de choix du coup, en trois groupes « Vers l'avant », « Vers le fond », « Rapides ». *(décision de Vincent)*
- Le tiroir de révélation, déplié dès la validation. *(décision de Vincent)*
- La légende, puis son retrait au profit des étiquettes sur le terrain. *(décision de Vincent)*
- Des épaisseurs de trait et des pointillés constants en pixels. *(décision de Vincent)*
- L'adresse partageable `?seed=&level=`, avec une entrée d'historique par nouvelle situation. *(décision de Vincent)*
- La ligne « Alternative : » sans référence de couleur, et l'étiquette « bon retour » pour le vert clair de la carte. *(décision de Vincent)*
