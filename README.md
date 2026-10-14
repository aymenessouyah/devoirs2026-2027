# 📚 3SI1 & 4SI2 — Devoirs · STI · 2026-2027

Site de gestion des devoirs pour les classes **3ème SI 1** et **4ème SI 2** — matière **STI**,
année scolaire **2026-2027**. Hébergé gratuitement sur **GitHub Pages**.

**🚀 Phase 1** : publication de devoirs + dépôt par lien + suivi des notes avec code élève.
**🔮 Phase 2 (prévue)** : comptes élèves avec connexion et dépôt de fichiers (Firebase/Supabase).

---

## 🌐 Publier le site sur GitHub Pages

1. Poussez ce dossier dans le dépôt `aymenessouyah/devoirs2026-2027` :
   ```bash
   git remote add origin https://github.com/aymenessouyah/devoirs2026-2027.git
   git branch -M main
   git push -u origin main
   ```
   *(ou glissez-déposez les fichiers directement sur github.com dans votre dépôt)*
2. Sur GitHub : **Settings → Pages** → Source : **Deploy from a branch** → branche **main**, dossier **/ (root)** → **Save**.
3. Dans la minute, le site est en ligne sur :
   **https://aymenessouyah.github.io/devoirs2026-2027/**

---

## 🗂️ Structure du projet

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil (stats, derniers devoirs, accès classes) |
| `devoirs.html` | Liste de tous les devoirs + filtres (classe, statut, recherche) |
| `classe-3si1.html` | Espace de la classe 3ème SI 1 (devoirs, échéances, moyennes) |
| `classe-4si2.html` | Espace de la classe 4ème SI 2 |
| `depot.html` | Dépôt de devoirs : génère un message à envoyer à l'enseignant |
| `suivi.html` | Espace élève : devoirs, notes, appréciations, moyenne (avec code) |
| `admin.html` | Espace enseignant : générateurs de devoirs / notes / dépôts |
| `data/config.js` | ⚙️ Titre, matière, nom et e-mail de l'enseignant, classes |
| `data/devoirs.js` | 📌 **Liste des devoirs** |
| `data/eleves.js` | 👨‍🎓 **Liste des élèves + codes personnels** |
| `data/notes.js` | 🎯 **Notes et dépôts (rendus)** |
| `css/style.css` | Design (responsive, mobile + desktop) |
| `js/app.js` | Logique du site |

> 💡 **Astuce** : une page **admin.html** intégrée vous génère les blocs de code à copier-coller !
> Il suffit d'ouvrir le fichier correspondant sur GitHub, de coller le bloc et d'enregistrer.

---

## 📌 Ajouter un devoir

1. Ouvrez **admin.html** → « Ajouter un devoir » → remplissez → **Générer** → **Copier**.
2. Sur GitHub, ouvrez [`data/devoirs.js`](data/devoirs.js) (clic sur le crayon ✏️).
3. Collez le bloc **juste après le `[`** du tableau `window.DEVOIRS`.
4. Cliquez **Commit changes** → le site se met à jour en ~1 minute.

*(Vous pouvez aussi rédiger le bloc directement dans le fichier, sans passer par admin.html.)*

## 🎯 Ajouter une note / 📥 enregistrer un dépôt

Même méthode avec les générateurs « Ajouter une note » et « Enregistrer un dépôt »
de **admin.html**, dans le fichier [`data/notes.js`](data/notes.js).

## 👨‍🎓 Gérer les élèves

Dans [`data/eleves.js`](data/eleves.js) : chaque élève a un **code unique** (ex. `3SI1-01`)
à lui communiquer en début d'année. C'est avec ce code qu'il consulte ses notes
sur la page **Mon suivi**. Pensez à remplacer les élèves d'exemple par vos vrais élèves.

## ⚙️ Personnaliser le site

Éditez [`data/config.js`](data/config.js) :

```js
prof: "M. Votre Nom",        // votre nom
email: "vous@exemple.com",   // votre e-mail (cible des dépôts)
```

---

## 🔮 Roadmap — Phase 2 (évolutif)

Le code est prévu pour accueillir plus tard, sans tout refaire :

- 🔐 **Connexion élèves** (comptes, plus besoin de codes)
- 📤 **Dépôt de fichiers direct** sur le site (Firebase Storage / Supabase)
- 📊 **Notes en temps réel** et bulletins calculés automatiquement
- 📅 **Calendrier** et rappels d'échéances
- 📱 **Notifications** (nouveau devoir publié)

---

*Site statique en HTML/CSS/JS pur — aucune dépendance, aucun coût, publié avec GitHub Pages.*
