# claude-workspace

## English B1-B2 — App d'apprentissage par flashcards

Application web 100% locale et gratuite pour apprendre l'anglais B1-B2 par flashcards et répétition espacée (façon Mosalingua/Anki), en 4 phases progressives :

1. **Anglais conversationnel** (400 cartes) — débloquée dès le départ
2. **Anglais professionnel général** (250 cartes) — débloquée à 70% de maîtrise de la phase 1
3. **Anglais de la cuisine professionnelle** (200 cartes) — débloquée à 70% de maîtrise de la phase 2
4. **Anglais des finances en hôtellerie** (150 cartes) — débloquée à 70% de maîtrise de la phase 3

Soit **1000 cartes** au total pour démarrer (objectif affiché par défaut : 3000 mots/phrases en mémoire long terme par phase — ajustable dans Réglages, voir "Limites connues" ci-dessous).

### Utiliser l'app

Aucune installation, aucun compte, aucun serveur. Tout tourne dans le navigateur et les données restent stockées localement (`localStorage`) sur cet appareil.

**En local :**
```
npx http-server .
# puis ouvrir http://localhost:8080
```
ou plus simplement, ouvrir `index.html` directement dans un navigateur.

**Déploiement gratuit (recommandé pour l'utiliser depuis son téléphone) :** GitHub Pages.
1. Repo → Settings → Pages → Source: `main` (ou cette branche), dossier `/ (root)`.
2. L'app est servie sur `https://<utilisateur>.github.io/<repo>/`.
3. Sur mobile, "Ajouter à l'écran d'accueil" installe l'app en PWA (fonctionne hors-ligne une fois chargée).

### Comment ça marche

- **Répétition espacée** : chaque carte a un algorithme type SM-2 (`js/srs.js`). Noter une carte "Non acquis / Difficile / Facile / Parfait" ajuste l'intervalle avant sa prochaine apparition — comme Mosalingua/Anki.
- **Sens des cartes** : réglable (Anglais→Français, Français→Anglais, ou Mixte — recommandé pour travailler à la fois la compréhension et la production active, utile pour "sortir" les phrases automatiquement à l'oral).
- **Objectif quotidien** : nombre de nouvelles cartes/jour et de révisions/jour réglables (Réglages). Un streak (série de jours consécutifs) s'affiche sur l'accueil.
- **Sauvegarde** : tout est local au navigateur. Utilise **Exporter ma progression (JSON)** régulièrement, et **Importer** pour restaurer ou transférer vers un autre appareil/navigateur — il n'y a pas de compte ni de sync cloud automatique (choix pris pour rester 100% gratuit et simple).

### Limites connues (transparence)

- **Contenu de démarrage : 1000 cartes**, pas 3000 par phase. Générer 3000 phrases uniques et de qualité par catégorie dépasse ce qu'il est raisonnable de produire d'un coup sans répétition ni perte de qualité. L'objectif "3000" affiché dans Réglages est le **but d'apprentissage à ajuster**, pas une promesse de contenu déjà présent. Pour aller plus loin : compléter les fichiers `js/data/*.js` (même format `{ sub, lvl, en, fr, ex? }`) au fil de l'eau.
- **Pas de sync multi-appareils automatique** : par choix (gratuit, pas d'infrastructure serveur/compte à maintenir). Le transfert se fait via export/import JSON manuel.

### Structure du code

```
index.html            page unique de l'app
css/styles.css        styles
js/srs.js             moteur de répétition espacée (SM-2-like), testable en Node
js/storage.js         persistance localStorage + export/import JSON
js/data/*.js          les 1000 cartes, une source par phase
js/data/index.js       assemblage des decks + règles de déblocage des catégories
js/app.js             logique UI (dashboard, session, stats, réglages)
manifest.json, sw.js  PWA (installable, fonctionne hors-ligne)
```

## Plugins

This repository is configured to auto-install the [Superpowers](https://github.com/obra/superpowers) plugin (`.claude/settings.json`), a skills library for Claude Code covering TDD, debugging, planning, and collaboration workflows. Claude Code prompts you to install it when you trust this repo folder.