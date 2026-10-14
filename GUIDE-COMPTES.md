# 🔐 Guide de mise en place des comptes (Phase 3)

Objectif : activer les **comptes élèves et enseignant** sur le site des devoirs —
dépôt de fichiers directement sur le site, notes saisies en ligne et visibles
aussitôt par les élèves. La base utilisée est **le même projet Supabase que
l'espace Vie scolaire** : votre compte enseignant sera identique sur les deux sites.

⏱️ Temps estimé : **10 minutes**, une seule fois.

---

## Étape 1 — Créer les tables dans Supabase

1. Ouvrez [supabase.com](https://supabase.com) et connectez-vous → projet
   **« aymenessouyah-vie-scolaire »** (celui de viescolaire).
2. Menu de gauche : **SQL Editor** → **New query**.
3. Collez tout le contenu du fichier
   [`supabase/schema.sql`](https://github.com/aymenessouyah/devoirs2026-2027/blob/main/supabase/schema.sql)
   → **Run**.
4. ✅ Message « Success » : les tables `profils`, `notes`, `rendus` et le
   bucket privé `depots` sont créés (la table de viescolaire n'est pas touchée).

## Étape 2 — Autoriser les inscriptions

Dans Supabase : **Authentication → Sign In / Providers → Email** :

- **« Allow new users to sign up » : ACTIVÉ** (sinon les élèves ne peuvent pas s'inscrire)
- **« Confirm email » : DÉSACTIVÉ** (les élèves se connectent avec un code, sans boîte e-mail)

> ℹ️ L'espace Vie scolaire continue de fonctionner normalement avec ces réglages.

## Étape 3 — Créer et activer votre compte enseignant

1. Sur le site : page **Connexion** → onglet **Enseignant** → **Inscription**
   (votre e-mail `aymenessouyah@gmail.com` + un mot de passe).
2. Retournez dans Supabase → **SQL Editor** → exécutez cette ligne :

```sql
update public.profils set role = 'enseignant'
where id = (select id from auth.users where email = 'aymenessouyah@gmail.com');
```

3. Reconnectez-vous sur le site → l'**Espace enseignant** s'ouvre :
   suivi des dépôts par devoir, saisie des notes en ligne, élèves inscrits.

## Étape 4 — Inscrire les élèves

Dites simplement aux élèves :

> « Allez sur le site → **Connexion** → créez votre compte avec votre
> **code élève** (ex. 3SI1-01) et un mot de passe de votre choix. »

Ensuite, depuis leur **Espace élève**, ils peuvent :

- 📤 déposer chaque devoir (fichier joint **ou** lien Google Drive) ;
- 🎯 voir leurs notes dès que vous les saisissez ;
- 📝 retrouver leurs prochaines épreuves (DC/DS).

## Étape 5 — Au quotidien

- **Saisir une note** : Espace enseignant → choisissez le devoir → notez chaque
  élève → *Enregistrer*. Visible immédiatement par l'élève.
- **Voir un dépôt** : même tableau, bouton « 📎 Fichier » ou « 🔗 Lien ».
- **Élèves sans compte** : ils n'apparaissent pas encore dans les tableaux —
  l'ancien système (fichiers `data/`, page « Mon suivi » par code) continue de
  fonctionner en parallèle le temps que tout le monde s'inscrive.

---

## 🆘 Dépannage

| Message | Cause | Solution |
|---|---|---|
| « La base n'est pas encore installée » | Étape 1 non faite | Exécuter `supabase/schema.sql` |
| « Les inscriptions sont fermées… » | Étape 2, 1er réglage | Activer « Allow new users to sign up » |
| « E-mail non confirmé… » | Étape 2, 2e réglage | Désactiver « Confirm email » |
| « Compte non activé comme enseignant » | Étape 3, promotion non faite | Exécuter la ligne SQL de promotion |
| « Ce compte existe déjà » | Code élève déjà inscrit | L'élève se connecte (ou voir ci-dessous) |
| Élève a oublié son mot de passe | — | Supabase → Authentication → Users → supprimez son compte, puis il se réinscrit avec le même code (⚠️ ses notes en ligne liées au compte seront effacées) |

## 🔒 Sécurité

- La clé affichée dans `js/supabase.js` est la clé **publique** du projet :
  c'est normal, la protection réelle est assurée par les règles **RLS**
  (chaque élève ne voit que ses données ; seul l'enseignant voit tout).
- Ne partagez **jamais** la clé `service_role`.
- Après chaque utilisation du jeton GitHub dans une conversation, pensez à le révoquer.
