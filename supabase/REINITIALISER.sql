-- =========================================================================
--  ⚠️⚠️  REMISE À ZÉRO DU SITE « Devoirs Lycée » — SCRIPT DESTRUCTIF  ⚠️⚠️
-- =========================================================================
--  À n'exécuter qu'UNE SEULE FOIS, dans :
--      Supabase → SQL Editor → New query → coller tout → Run
--
--  AVANT de lancer ce script, (ré)exécutez d'abord le fichier
--  « supabase/schema.sql » (il ajoute notamment la colonne
--  matieres_par_classe utilisée par la nouveauté « matière par classe »).
--
--  Ce script supprime DÉFINITIVEMENT, pour recommencer à zéro :
--    • tous les comptes (connexion + profils) SAUF l'admin
--      (aymenessouyah@gmail.com) ;
--    • tous les devoirs programmés (dates des épreuves) ;
--    • toutes les notes et tous les rendus/dépôts ;
--    • l'ancien annuaire des élèves ;
--    • la liste des classes du site (l'admin la recrée ensuite dans
--      ⭐ Administration → « 🏫 Les classes du site »).
--
--  Il CONSERVE : le compte admin (connexion + profil), le calendrier
--  officiel (vacances, jours fériés, semaines bloquées — il vit dans le
--  fichier data/calendrier.js du site, pas dans la base) et la structure
--  des tables.
--
--  Après l'exécution :
--    1. (Optionnel) Supabase → Storage → bucket « depots » → vider le
--       bucket pour supprimer aussi les fichiers déposés.
--    2. Ouvrez le site (page de réparation si besoin), connectez-vous en
--       admin, recréez vos classes, puis laissez enseignants et élèves
--       se réinscrire : vous validerez chaque compte.
-- =========================================================================

begin;

-- Notes et rendus (dépôts) de tous les comptes
delete from public.notes;
delete from public.rendus;

-- Tous les devoirs programmés (dates des classes)
delete from public.devoirs;

-- Ancien annuaire des élèves (inscriptions par code)
delete from public.eleves;

-- Liste des classes du site (recréée par l'admin)
delete from public.classes;

-- Profils de tous les comptes sauf l'admin
delete from public.profils p
using auth.users u
where p.id = u.id
  and lower(u.email) <> 'aymenessouyah@gmail.com';

-- Comptes de connexion (authentification) sauf l'admin
delete from auth.users
where lower(email) <> 'aymenessouyah@gmail.com';

commit;

-- Contrôle : il ne doit rester que l'admin.
select u.email, p.role, p.statut
from auth.users u
left join public.profils p on p.id = u.id;
