# Guide des comptes — v4 (validation par l'admin, devoirs en ligne)

Le site s'ouvre désormais sur la **page de connexion**. Chacun crée son
compte (enseignant ou élève), **l'administrateur du site le valide**,
puis chacun accède à son espace :

- **Enseignant validé** : il choisit la **date** de chaque devoir au
  **calendrier officiel tunisien**, écrit le **sujet** et la
  **correction**, voit les **élèves de ses classes**, saisit les
  **notes**, les **remarques** (appréciations) et les **observations**.
- **Élève validé** : il voit les **dates** des devoirs à l'avance, mais
  le **sujet** et la **correction** seulement à partir du **lendemain**
  de l'épreuve (règle **J+1**), ainsi que **ses notes** et les
  **remarques** de l'enseignant.
- **Admin du site** : `aymenessouyah@gmail.com` (validé automatiquement).
  Il dispose de **deux interfaces** : l'**espace enseignant**, identique à
  celui de tous les enseignants, et l'**interface ⭐ Administration**
  (page séparée) pour valider les comptes, corriger les rôles et
  **déterminer les classes** du site.

La base est le **même projet Supabase** que l'espace Vie scolaire ; la
table `espace_pedagogique` n'est pas touchée. Les anciens fichiers
`data/devoirs.js` etc. restent comme **repli** et source d'import.

---

## Mise en place (une seule fois, ~5 minutes)

### 1. (Ré)exécuter le schéma SQL

Supabase → **SQL Editor** → *New query* → collez tout le contenu de
[`supabase/schema.sql`](supabase/schema.sql) → **Run**.

Le script est **idempotent** : vous pouvez le relancer sans danger. Déjà
exécuté en v3 ? Relancez-le : il ajoute la table `devoirs` et les
colonnes `statut`, `matiere`, `email`, `observation` des profils.
Les comptes créés avant la v4 sont **acceptés automatiquement** (une
seule fois) ; les futures inscriptions attendront votre validation.

### 2. Réglages d'authentification

Supabase → **Authentication** → *Sign In / Providers* → **Email** :

- **« Allow new users to sign up » : ACTIVÉ** (sinon aucune inscription) ;
- **« Confirm email » : DÉSACTIVÉ** (la connexion doit marcher
  immédiatement ; c'est votre validation qui protège l'accès).

### 3. Créer le compte admin

Sur la page d'accueil du site → **Créer un compte** → **Je suis
enseignant** → avec **`aymenessouyah@gmail.com`** : le compte est
**validé automatiquement** (rôle enseignant + admin). Connectez-vous :
le lien **⭐ Admin** apparaît dans la navigation (et une bannière dans
votre espace enseignant vous y emmène).

---

## Au quotidien

### Administrer le site (admin — interface ⭐ Administration)

Ouvrez-la via le lien **⭐ Admin** de la navigation (ou la bannière de
votre espace enseignant). Votre espace enseignant, lui, reste identique
à celui de tous les enseignants.

- **⏳ Demandes en attente** : **✅ Accepter** ou **Refuser** chaque
  inscription (enseignant ou élève — le type, la classe et la matière
  demandés sont affichés).
- **👥 Tous les comptes** : corriger le **rôle** (élève ↔ enseignant),
  la **classe** et la **matière** de chacun, ré-accepter un compte
  refusé, refuser ou **supprimer** un profil.
- **🏫 Les classes du site** : c'est vous qui déterminez les classes
  (ajouter, renommer, supprimer). Elles sont aussitôt proposées à
  l'inscription et dans les espaces. La **clé technique** (ex. `3si1`)
  relie comptes et devoirs : choisissez-la à la création et ne la
  changez plus ensuite (seul le nom affiché peut être corrigé).

Tant qu'un compte n'est pas accepté, la personne voit seulement
« Compte en attente de validation ».

> Pour une classe créée par l'admin (inconnue de l'espace Vie
> scolaire), le calendrier de choix de date applique des règles
> assouplies : devoir de contrôle du lundi au samedi hors vacances,
> jours fériés et semaines bloquées ; devoir de synthèse uniquement
> pendant les semaines bloquées officielles.

### Côté enseignant

1. **Créer un compte** (type Enseignant + sa matière) → l'admin
   l'accepte.
2. **📝 Mes devoirs** : choisissez la **classe** →
   **➕ Nouveau devoir** (ou **✏️ Modifier**) :
   - le type (**devoir de contrôle** / **devoir de synthèse**) ;
   - la **date**, cliquée dans le calendrier : seuls les jours
     compatibles avec le **calendrier scolaire officiel tunisien** sont
     verts (contrôle = jour de cours de la classe, hors vacances,
     jours fériés et semaines bloquées ; synthèse = uniquement en
     semaine bloquée ; jamais un dimanche, une date passée ou un jour
     déjà occupé) ;
   - le **sujet** et la **correction** (textes libres, visibles par
     les élèves à partir du lendemain de l'épreuve) ;
   - le **barème**.
   Bouton **⬇ Importer les épreuves du fichier** : récupère en un clic
   les 18 épreuves de `data/devoirs.js` de la classe pour les gérer
   ensuite en ligne (sans doublons).
3. **👨‍🎓 Mes élèves — notes et observations** : choisissez la classe
   et le devoir → saisissez la **note** et la **remarque** de chaque
   élève validé (**Enregistrer** ligne par ligne ; vider la note puis
   Enregistrer l'efface). Plus bas, la liste des élèves de la classe
   avec leur moyenne et un champ **Observation générale** visible par
   l'élève.

### Côté élève

1. **Créer un compte** (type Élève + sa **classe** — déterminée par
   l'admin — + la **matière** de son enseignant : STI, Algo,
   Informatique, puis les autres) → l'admin l'accepte.
2. Dans son espace :
   - **📅 Mes prochains devoirs** : dates et échéances (le sujet reste
     🔒 jusqu'au lendemain) ;
   - **📝 Mes devoirs passés** : boutons **📄 Sujet** et **✅ Correction**
     (ouverts à partir de J+1), sa note et la remarque de l'enseignant ;
   - **🎯 Mes notes** : toutes ses notes avec les remarques ;
   - l'**observation générale** de l'enseignant, s'il y en a une.

### Anciens comptes (avant la v4)

- Les profils existants sont **acceptés d'office** par la migration.
- Les élèves qui se connectaient avec leur **code** (ex. `3SI1-01`)
  peuvent continuer : le champ « E-mail » de la connexion accepte
  aussi le code élève.

---

## Sécurité (résumé)

- Règles RLS : un élève ne voit que les devoirs de **sa classe** ; un
  enseignant ne modifie que **ses** devoirs (l'admin : tous) ; les
  notes d'un élève ne sont lisibles que par lui et les enseignants.
- Personne ne peut se valider soi-même ni changer son rôle
  (déclencheur SQL) : **seul l'admin** accepte/refuse et attribue les
  rôles. Le compte `aymenessouyah@gmail.com` est validé
  automatiquement dès sa création.
- La règle **J+1** (sujet/correction) est appliquée par l'affichage du
  site : les dates restent visibles, le contenu ne l'est pas avant le
  lendemain.
- La clé `service_role` ne doit **jamais** figurer dans le site : seule
  la clé publique `anon` est utilisée, la sécurité repose sur les RLS.

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| « Base de données pas encore installée » | Schéma SQL non exécuté | Étape 1 ci-dessus |
| « La table des devoirs n'existe pas encore » (espace enseignant) | Schéma v3 seulement | (Ré)exécutez le schéma v4 (étape 1) |
| « Compte en attente de validation » qui dure | L'admin n'a pas encore accepté | Admin → ⭐ Administration → ✅ Accepter |
| Inscription impossible (« Signups not allowed ») | Inscriptions fermées dans Supabase | Étape 2 : activer « Allow new users to sign up » |
| « E-mail non confirmé » à la connexion | « Confirm email » activé | Étape 2 : le désactiver |
| Un élève validé ne voit aucun devoir | Classe/matière de son profil, ou devoirs pas encore créés/importés | Admin : corriger le profil ; Enseignant : importer ou créer les devoirs de sa classe |
