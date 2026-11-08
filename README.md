# Lecture de jeu au badminton

Quiz web statique pour apprendre à lire le jeu en simple. L'application montre une situation vue de dessus : B (en haut) vient de frapper, A (en bas, toi) doit renvoyer. Tout se passe sur le terrain, sans panneau à côté. Un bandeau au-dessus du terrain décrit le coup de B (« Situation : B fait un amorti rapide en ligne… », sans jamais cacher la ligne de fond de B), et une petite consigne en bas à droite du terrain rappelle de cliquer sur le terrain de B. Tu cliques sur le terrain de B pour choisir où tu renvoies : une petite fenêtre s'ouvre à côté de la croix avec les coups, rangés en trois groupes (« Vers l'avant », « Vers le fond », « Rapides »), et le bouton « Valider ». Le survol d'un coup affiche ce qu'il est, et le coup choisi est décrit sous les boutons (utile sur mobile, sans survol). Échap ou « ✕ » la ferme, un nouveau clic sur le terrain la rouvre. Une fois validé, l'application te donne un score sur 100, le meilleur retour, deux zones sur le terrain de B (zone 1 = meilleur coup, zone 2 = deuxième choix, chacune avec le nom du coup) et les raisons de chaque choix. Ces explications sont dans un tiroir en bas du terrain : replié, il montre le score et le meilleur coup sur une ligne ; déplié, il donne tout le détail. Il s'ouvre déplié dès que tu valides. Sur le terrain, le nom du coup est écrit au milieu de chaque tracé (coup de B, ton retour, meilleur retour), et une croix blanche marque l'arrivée du meilleur retour. Si le coup choisi ne peut pas atterrir aussi loin (ou aussi court) que ta croix, « Ton choix » commence par « Coup impossible jusque-là. », ton trajet bleu s'arrête là où le volant tombe vraiment et la suite jusqu'à la croix est en pointillé rouge.

Tout tourne dans le navigateur : pas de serveur, pas d'API externe, pas d'IA. Le moteur est déterministe : même situation et même niveau, même résultat. Trois niveaux sont proposés (débutant, intermédiaire, avancé). Une légende flotte par-dessus le terrain avec son bouton « Légende » (au-dessus du tiroir quand il est là), et le terrain ne change jamais de taille, que la légende soit affichée ou masquée. Elle explique les couleurs (trait continu rouge pour le coup de B, qui arrive sur un point bleu ; pointillé bleu pour ton retour ; pointillé blanc pour le meilleur retour), et elle est masquée par défaut sur mobile. Chaque situation est partageable : l'adresse contient la graine et le niveau (`?seed=…&level=…`), et la recharger ou l'envoyer à quelqu'un affiche la même situation. Une fois ta réponse validée, l'adresse contient aussi ton choix (`&shot=…&x=…&y=…`) : recharger la page ou envoyer le lien réaffiche la révélation telle quelle. Les boutons précédent et suivant du navigateur font revenir aux étapes déjà vues : après une validation, « précédent » réaffiche la même situation sans ta réponse, puis la situation d'avant. Les traits du terrain gardent la même épaisseur à l'écran, quelle que soit la taille de la fenêtre.

## Commandes

- `npm install` : installe les dépendances.
- `npm run dev` : lance le serveur de développement.
- `npm test` : lance les tests (moteur, interface, situations de référence).
- `npm run build` : vérifie les types et produit le site statique dans `dist/`.

## Mise en ligne

Le site est publié sur GitHub Pages, à l'adresse https://skyporter.github.io/badminton-lecture/. Chaque fusion dans `main` lance `.github/workflows/deploy.yml`, qui fait passer les tests, construit le site et le publie. Les chemins du site sont relatifs (`base: './'` dans `vite.config.ts`), donc il fonctionne sous n'importe quel sous-chemin.

## Ajuster les règles

Toutes les règles, poids, seuils et sources sont dans `src/engine/rules.ts`, et nulle part ailleurs. Le catalogue des coups de `src/engine/shots.ts` (temps de vol, profondeurs d'arrivée, zones d'où chaque coup est jouable) fait aussi partie des règles : pour changer le comportement du moteur, modifie les valeurs de ces deux fichiers.

Les situations de référence, avec le résultat attendu pour chacune, sont dans `tests/calibration/`. Après un réglage des règles, lance `npm test` : ces tests signalent si une situation de référence ne donne plus le résultat attendu.
