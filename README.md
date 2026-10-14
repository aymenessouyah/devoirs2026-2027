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
