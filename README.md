# 📚 Devoirs Lycée · 2026-2027

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

## 📅 Calendrier officiel tunisien (propre au site)

Le site est **autonome** : son calendrier officiel (vacances, jours
fériés, semaines bloquées, jours de cours, fenêtres des devoirs de
synthèse) vit dans `data/calendrier.js`, sans aucune synchronisation
externe.

- **Page Calendrier** : les vacances, jours fériés, semaines bloquées
  et épreuves officielles s'affichent dans la grille mensuelle, avec
  les prochains jalons officiels.
- **Choix des dates** : un devoir de contrôle ne peut tomber qu'un
  jour de cours de la classe (hors vacances, jours fériés et semaines
  bloquées) ; un devoir de synthèse uniquement pendant une semaine
  bloquée. Pour une classe créée par l'admin et absente du calendrier
  officiel, des règles assouplies s'appliquent (lundi→samedi hors
  vacances/fériés/bloquées ; synthèse en semaines bloquées).
- **Épreuves officielles** : les **2 devoirs de contrôle + 1 devoir de
  synthèse de chaque trimestre** sont publiés dans `data/devoirs.js`
  avec le champ `examen: true`.

---

## 🔐 Phase 3 — Comptes enseignant & élèves (Supabase)

Le site dispose désormais de **vrais comptes**, branchés sur le même projet
Supabase du site :

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

**🗓️ Choisir la date d'un devoir** : dans l'espace enseignant (page Admin et
espace connecté), un calendrier interactif par classe n'autorise que les dates
conformes au calendrier officiel tunisien — jours de cours de la classe pour
les devoirs de contrôle, semaines bloquées pour les devoirs de synthèse,
jamais pendant les vacances ni un jour férié. La modification générée se colle
ensuite dans `data/devoirs.js`.


## 🔀 v4.0 — Réorganisation : connexion d'abord, comptes validés, devoirs en ligne

Le site s'ouvre désormais sur la **page de connexion** ; tout le reste
est réservé aux comptes **validés par l'administrateur du site**
(`aymenessouyah@gmail.com`, validé automatiquement, tableau de bord
**⭐ Administration** dans son espace enseignant).

- **Inscription** : e-mail + mot de passe, choix du type
  (**enseignant** / **élève**) ; l'élève choisit sa **classe** et sa
  **matière**, l'enseignant sa **matière** (liste dans
  `data/config.js`). Le compte reste **en attente** jusqu'à la décision
  de l'admin (accepter / refuser, corriger les rôles, supprimer).
- **Enseignant validé** : les devoirs vivent dans la **base**
  (table `devoirs`) — il choisit la **classe**, clique la **date** dans
  le calendrier (règles du calendrier officiel tunisien : contrôle =
  jour de cours hors vacances/fériés/semaines bloquées, synthèse =
  semaine bloquée uniquement), écrit le **sujet** et la
  **correction**, puis saisit **notes**, **remarques** et
  **observations** pour les élèves validés de ses classes. Les 18
  épreuves du fichier s'importent en un clic (sans doublons).
- **Élève validé** : il voit les **dates** des devoirs à l'avance,
  mais le **sujet** et la **correction** seulement à partir du
  **lendemain de l'épreuve (J+1)** ; il consulte ses **notes**, les
  **remarques** de l'enseignant et son **observation générale**.
- Les anciennes pages (Devoirs, Dépôt, Mon suivi, Admin, fiches
  classes) redirigent vers la page de connexion ; le calendrier
  officiel et la vie de classe restent accessibles après connexion.
- Les fichiers `data/` restent le **repli** (affichage des épreuves
  tant que la base est vide) ; les anciens comptes élèves peuvent
  toujours se connecter avec leur **code** à la place de l'e-mail.
- Mise en place : (ré)exécuter `supabase/schema.sql` (v4, idempotent)
  puis suivre [`GUIDE-COMPTES.md`](GUIDE-COMPTES.md).


## ⭐ v4.1 — Deux interfaces pour l'admin, classes déterminées par l'admin

- **Matières ordonnées** : STI, puis **Algo**, puis **Informatique**,
  puis le reste (liste dans `data/config.js`).
- **Classes déterminées par l'admin** : la liste des classes vit dans
  la table `classes` de la base (pré-remplie avec 3ème SI 1 et
  4ème SI 2) et se gère depuis l'interface d'administration
  (ajouter / renommer / supprimer) ; `data/config.js` ne sert plus que
  de repli. Pour une classe inconnue du calendrier officiel, le calendrier de
  choix de date applique des règles assouplies (lundi→samedi hors
  vacances/fériés/bloquées ; synthèse en semaines bloquées officielles).
- **L'admin a deux interfaces** : son **espace enseignant**, identique
  à celui de tous les enseignants (avec une bannière ⭐ quand des
  demandes sont en attente), et **⭐ Administration**
  (`espace-admin.html`, lien dans la navigation) : validation des
  comptes, rôles/classes/matières des comptes, et gestion des classes.
- Mise en place : (ré)exécuter `supabase/schema.sql` (v4.1, idempotent)
  puis suivre [`GUIDE-COMPTES.md`](GUIDE-COMPTES.md).


## 🔁 v4.3 — Matière par classe et remise à zéro

- **Matière par classe** : un enseignant choisit, pour **chaque
  classe** qu'il enseigne, la matière qu'il y enseigne (jusqu'à 2 par
  classe) — ex. STI en 3ème SI et Algo en 4ème SI
  (colonne `matieres_par_classe` ; pensez à (ré)exécuter
  `supabase/schema.sql`).
- **Remise à zéro** : `supabase/REINITIALISER.sql` (à exécuter une
  seule fois, après le schéma) supprime comptes, devoirs, notes,
  rendus, annuaire et classes — sauf le compte admin. Les dates
  préchargées du fichier (`data/devoirs.js`) ont été supprimées :
  tous les devoirs naissent désormais dans l'espace enseignant.

## 🧑‍🏫 v4.2 — Site autonome, jetons de classes, 2 matières, quota par trimestre

- **Aucune relation avec viescolaire** : plus de synchronisation ni de
  lien externe ; le calendrier officiel tunisien est intégré au site
  (`data/calendrier.js`).
- **L'enseignant choisit ses classes et ses matières dans son espace**
  (carte « 🎓 Mes classes et mes matières ») : ses classes deviennent
  des **jetons colorés** qu'il **glisse dans le calendrier** (ou clique
  le jeton puis le jour), puis il écrit le **titre** du devoir. Il peut
  enseigner **2 matières en même temps** (chaque devoir porte sa
  matière).
- **Quota appliqué à la pose comme à l'enregistrement** : maximum
  **2 devoirs de contrôle + 1 devoir de synthèse par trimestre**, par
  classe et par matière (compteurs affichés au-dessus du calendrier ;
  les épreuves déjà présentes dans `data/devoirs.js` comptent, hors
  doublons importés).
- Mise en place : (ré)exécuter `supabase/schema.sql` (v4.2, idempotent,
  ajoute `matiere_2` et `classes` aux profils) puis suivre
  [`GUIDE-COMPTES.md`](GUIDE-COMPTES.md).
