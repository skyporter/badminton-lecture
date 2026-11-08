# Lecture de jeu au badminton

Quiz web statique pour apprendre à lire le jeu en simple. L'application montre une situation vue de dessus : B (en haut) vient de frapper, A (en bas, toi) doit renvoyer. Tout se passe sur le terrain, sans panneau à côté. Un bandeau au-dessus du terrain décrit le coup de B (sans jamais cacher la ligne de fond de B). Tu cliques sur le terrain de B pour choisir où tu renvoies : une petite fenêtre s'ouvre à côté de la croix avec les coups, rangés en trois groupes (« Vers l'avant », « Vers le fond », « Rapides »), et le bouton « Valider ». Échap ou « ✕ » la ferme, un nouveau clic sur le terrain la rouvre. Une fois validé, l'application te donne un score sur 100, le meilleur retour, une carte de couleurs du terrain de B (vert vif = meilleur spot, vert clair = bon retour, rouge = à éviter) et les raisons de chaque choix. Ces explications sont dans un tiroir en bas du terrain : replié, il montre le score et le meilleur coup sur une ligne ; déplié, il donne tout le détail.

Tout tourne dans le navigateur : pas de serveur, pas d'API externe, pas d'IA. Le moteur est déterministe : même situation et même niveau, même résultat. Trois niveaux sont proposés (débutant, intermédiaire, avancé). Une légende flotte par-dessus le terrain avec son bouton « Légende » (au-dessus du tiroir quand il est là), et le terrain ne change jamais de taille, que la légende soit affichée ou masquée. Elle explique les couleurs et le code des trajectoires (le pointillé dit la vitesse, la courbe dit la hauteur), et elle est masquée par défaut sur mobile. Chaque situation est partageable : l'adresse contient la graine et le niveau (`?seed=…&level=…`), et la recharger ou l'envoyer à quelqu'un affiche la même situation. Les traits du terrain gardent la même épaisseur à l'écran, quelle que soit la taille de la fenêtre.

## Commandes

- `npm install` : installe les dépendances.
- `npm run dev` : lance le serveur de développement.
- `npm test` : lance les tests (moteur, interface, situations de référence).
- `npm run build` : vérifie les types et produit le site statique dans `dist/`.

## Ajuster les règles

Toutes les règles, poids, seuils et sources sont dans `src/engine/rules.ts`, et nulle part ailleurs. Le catalogue des coups de `src/engine/shots.ts` (temps de vol, profondeurs d'arrivée, zones d'où chaque coup est jouable) fait aussi partie des règles : pour changer le comportement du moteur, modifie les valeurs de ces deux fichiers.

Les situations de référence, avec le résultat attendu pour chacune, sont dans `tests/calibration/`. Après un réglage des règles, lance `npm test` : ces tests signalent si une situation de référence ne donne plus le résultat attendu.
