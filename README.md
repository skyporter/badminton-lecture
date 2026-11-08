# Lecture de jeu au badminton

Quiz web statique pour apprendre à lire le jeu en simple. L'application montre une situation vue de dessus : B (en haut) vient de frapper, A (en bas, toi) doit renvoyer. Tu cliques sur le terrain de B pour choisir où tu renvoies, tu choisis ton coup, puis tu valides : l'application te donne un score sur 100, le meilleur retour, une carte de couleurs du terrain de B (vert vif = meilleur spot, vert clair = bonne alternative, rouge = à éviter) et les raisons de chaque choix.

Tout tourne dans le navigateur : pas de serveur, pas d'API externe, pas d'IA. Le moteur est déterministe : même situation et même niveau, même résultat. Trois niveaux sont proposés (débutant, intermédiaire, avancé). Une légende, qui flotte par-dessus le terrain avec son bouton « Légende » (le terrain ne change jamais de taille, que la légende soit affichée ou masquée), explique les couleurs et le code des trajectoires (le pointillé dit la vitesse, la courbe dit la hauteur). Elle est masquée par défaut sur mobile.

## Commandes

- `npm install` : installe les dépendances.
- `npm run dev` : lance le serveur de développement.
- `npm test` : lance les tests (moteur, interface, situations de référence).
- `npm run build` : vérifie les types et produit le site statique dans `dist/`.

## Ajuster les règles

Toutes les règles, poids, seuils et sources sont dans `src/engine/rules.ts`, et nulle part ailleurs. Pour changer le comportement du moteur, modifie les valeurs de ce fichier.

Les situations de référence, avec le résultat attendu pour chacune, sont dans `tests/calibration/`. Après un réglage des règles, lance `npm test` : ces tests signalent si une situation de référence ne donne plus le résultat attendu.
