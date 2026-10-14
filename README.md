# 📚 3SI1 & 4SI2 — Devoirs · STI · 2026-2027

Site de gestion des devoirs pour les classes **3ème SI 1** et **4ème SI 2** — matière **STI**,
année scolaire **2026-2027**. Hébergé gratuitement sur **GitHub Pages**.

**🚀 Phase 1** : publication de devoirs + dépôt par lien + suivi des notes avec code élève.
**✨ Version 2** : design « Dynamique Coloré » 🎨, mode sombre 🌙, calendrier 🗓️, vie de classe 🏫,
graphiques & relevé imprimable 📊, application installable (PWA) 📱.
**🔮 Phase 3 (prévue)** : comptes élèves avec connexion et dépôt de fichiers (Firebase/Supabase).

---

## 🌐 Mettre le site à jour sur GitHub Pages

1. Récupérez les fichiers de cette version (le dossier `devoirs2026-2027` ou le fichier ZIP).
2. Sur GitHub, dans votre dépôt : **Add file → Upload files**, puis glissez-déposez
   **tous les fichiers du dossier** (acceptez le remplacement des fichiers existants) → **Commit**.
3. Le site est mis à jour en ~1 minute sur :
   **https://aymenessouyah.github.io/devoirs2026-2027/**

> 💡 Les visiteurs qui ont installé l'application verront la nouvelle version au prochain
> chargement. Si vous modifiez le site plus tard, pensez à changer `VERSION` dans `sw.js`.

---

## 🗂️ Structure du projet

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil (stats, annonces, derniers devoirs, classes) |
| `devoirs.html` | Liste de tous les devoirs + filtres (classe, statut, recherche) |
| `calendrier.html` | 🆕 Calendrier mensuel des échéances |
| `vie-de-classe.html` | 🆕 Annonces, emploi du temps, ressources, règles |
| `classe-3si1.html` | Espace de la classe 3ème SI 1 |
| `classe-4si2.html` | Espace de la classe 4ème SI 2 |
| `depot.html` | Dépôt de devoirs : génère un message à envoyer à l'enseignant |
| `suivi.html` | Espace élève : notes, progression, graphique, relevé imprimable |
| `admin.html` | Espace enseignant : générateurs (devoirs, notes, dépôts, annonces) |
| `data/config.js` | ⚙️ Titre, matière, nom et e-mail de l'enseignant, classes |
| `data/devoirs.js` | 📌 **Liste des devoirs** |
| `data/annonces.js` | 📣 **Annonces du cours** |
| `data/eleves.js` | 👨‍🎓 **Liste des élèves + codes personnels** |
| `data/notes.js` | 🎯 **Notes et dépôts (rendus)** |
| `data/vie.js` | 🏫 **Emploi du temps, ressources, règles** |
| `css/style.css` | Design « Dynamique Coloré » + mode sombre |
| `js/app.js` | Logique du site |
| `sw.js` + `manifest.webmanifest` | PWA : installation et mode hors-ligne |
| `icon-*.png` | Icônes de l'application |

> 💡 **Astuce** : la page **admin.html** vous génère les blocs de code à copier-coller !
> Il suffit d'ouvrir le fichier correspondant sur GitHub, de coller le bloc et d'enregistrer.

---

## 📌 Ajouter un devoir / une annonce / une note

1. Ouvrez **admin.html** → choisissez le formulaire → remplissez → **Générer** → **Copier**.
2. Sur GitHub, ouvrez le fichier indiqué (clic sur le crayon ✏️).
3. Collez le bloc **juste après le `[`** du tableau concerné.
4. Cliquez **Commit changes** → le site se met à jour en ~1 minute.

## 🌙 Mode sombre & 📱 Application

- Le bouton 🌙/☀️ en haut à droite bascule entre le thème clair et le thème sombre
  (le choix est mémorisé, et suit la préférence du téléphone par défaut).
- Sur mobile, le site est **installable comme une application**
  (menu du navigateur → « Ajouter à l'écran d'accueil »). Il fonctionne même hors-ligne.

## 👨‍🎓 Gérer les élèves

Dans [`data/eleves.js`](data/eleves.js) : chaque élève a un **code unique** (ex. `3SI1-01`)
à lui communiquer en début d'année. Pensez à remplacer les élèves d'exemple par vos vrais élèves.

## ⚙️ Personnaliser le site

Éditez [`data/config.js`](data/config.js) :

```js
prof: "M. Votre Nom",        // votre nom
email: "vous@exemple.com",   // votre e-mail (cible des dépôts)
```

---

## 🔮 Roadmap — Phase 3 (évolutif)

- 🔐 **Connexion élèves** (comptes, plus besoin de codes)
- 📤 **Dépôt de fichiers direct** sur le site (Firebase Storage / Supabase)
- 📊 **Notes en temps réel** et bulletins calculés automatiquement
- 📱 **Notifications** (nouveau devoir publié)

---

*Site statique en HTML/CSS/JS pur — aucune dépendance, aucun coût, publié avec GitHub Pages.*

---

## 🤝 Collaboration avec l'espace « Vie scolaire »

Le site est **synchronisé avec l'espace enseignant**
[aymenessouyah.github.io/viescolaire](https://aymenessouyah.github.io/viescolaire/) :

- **Page Calendrier** : les vacances, jours fériés, semaines bloquées et épreuves
  officielles (DC1 à DC6, DS1) s'affichent automatiquement dans la grille mensuelle,
  avec la liste des prochains jalons officiels.
- **Accueil** : le prochain jalon officiel est affiché sous la prochaine échéance.
- **Espace enseignant** : contrôle automatique des dates — une alerte signale toute
  échéance qui tombe pendant les vacances, un jour férié, une semaine bloquée ou le
  jour d'une épreuve officielle, avec suggestion du prochain jour de cours.

⚡ En ligne, les données sont chargées en direct depuis `viescolaire/data/` —
toute modification du planning là-bas se répercute ici sans rien toucher.
📁 Hors-ligne, la copie locale `data/calendrier.js` prend le relais
(régénérable depuis les fichiers de viescolaire).
- **Épreuves officielles** : les **2 devoirs de contrôle + 1 devoir de synthèse de chaque
  trimestre** (dates tirées de la répartition de viescolaire) sont publiés dans
  `data/devoirs.js` avec le champ `examen: true` : visibles par les élèves dans la liste
  des devoirs et le calendrier, **sans bouton de dépôt**, et les notes se saisissent
  comme pour les autres devoirs (espace enseignant). Pour les DS2/DS3, le jour exact
  est fixé par l'établissement — la date affichée est le début de la semaine bloquée.

---

## 🔐 Phase 3 — Comptes enseignant & élèves (Supabase)

Le site dispose désormais de **vrais comptes**, branchés sur le même projet
Supabase que l'espace Vie scolaire :

- **Connexion** (`connexion.html`) : les élèves s'inscrivent avec leur **code
  élève** + un mot de passe ; l'enseignant avec son e-mail.
- **Espace élève** (`espace-eleve.html`) : mes devoirs, **dépôt de fichiers
  direct** (ou lien Drive), mes notes en ligne, mes prochaines épreuves.
- **Espace enseignant** (`espace-enseignant.html`) : dépôts reçus par devoir,
  **saisie des notes en ligne** (visibles aussitôt par les élèves), élèves inscrits.

👉 **Mise en place (10 min, une seule fois) : suivez le
[GUIDE-COMPTES.md](GUIDE-COMPTES.md)** — exécuter `supabase/schema.sql`,
deux réglages d'authentification, créer puis promouvoir le compte enseignant.

Les anciens fonctionnements restent disponibles en parallèle : « Mon suivi »
par code, générateurs de l'espace admin et édition des fichiers `data/`.

**⭐ Admin du site : `aymenessouyah@gmail.com`** — ce compte devient
automatiquement enseignant (déclencheur SQL) et gère depuis l'espace
enseignant : l'**annuaire des élèves** (ajout/correction des codes
d'inscription), la **promotion des autres enseignants** et les corrections
de noms, sans repasser par Supabase.

**📌 Règle du site : seuls les devoirs de contrôle et les devoirs de synthèse
sont acceptés** — 2 DC + 1 DS par trimestre et par classe, passés en classe
(champ `examen: true` dans `data/devoirs.js`, pas de dépôt en ligne). Les
anciens devoirs « maison » (exercices, TP, projet…) ont été retirés.
