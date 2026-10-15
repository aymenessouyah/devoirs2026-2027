-- =========================================================================
--  Site « Devoirs Lycée » — Schéma de la base (Supabase)
--  Base Supabase du site : comptes, classes, devoirs et notes.
--
--  À exécuter dans : Supabase → SQL Editor → New query → coller → Run.
--  Le script est SANS DANGER si vous le relancez (mises à jour incluses).
--
--  v4.2 — Site autonome (calendrier officiel propre au site, sans
--  synchronisation externe) ; un enseignant choisit ses classes et
--  ses matières (1 ou 2) dans son espace ; quota de devoirs par
--  trimestre appliqué par le site (2 DC + 1 DS par classe/matière).
--  v4.1 — Matières ordonnées (STI, Algo, Informatique…), classes
--  déterminées par l'admin (table « classes ») et admin à deux
--  interfaces (enseignant + ⭐ Administration séparée).
--  v4.0 — Réorganisation complète :
--    • profils : statut de validation (en_attente / accepte / refuse),
--      matière, e-mail et observation de l'enseignant ;
--    • devoirs : les devoirs vivent désormais DANS la base (l'enseignant
--      les crée depuis son espace : date choisie au calendrier officiel,
--      sujet, correction, barème) — l'élève voit les dates tout de suite,
--      mais le sujet et la correction seulement à partir du lendemain
--      du devoir (règle J+1, appliquée par le site) ;
--    • notes : notes + appréciations (remarques) saisies par l'enseignant.
--
--  ⭐ Admin du site : aymenessouyah@gmail.com — tout compte créé avec cet
--  e-mail est validé automatiquement comme enseignant. C'est l'admin qui
--  accepte ou refuse les autres comptes (enseignants et élèves), depuis
--  son espace enseignant sur le site.
--
--  Seules les tables du site (profils, classes, devoirs, notes,
--  rendus, eleves) sont créées ou mises à jour.
-- =========================================================================

-- 1) Tables -----------------------------------------------------------------
create table if not exists public.profils (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'eleve' check (role in ('enseignant','eleve')),
  nom        text not null,
  classe     text,                    -- '3si1' / '4si2' (élèves uniquement)
  code       text unique,             -- ancien code élève (ex. 3SI1-01), si existant
  statut     text not null default 'en_attente'
             check (statut in ('en_attente','accepte','refuse')),
  matiere    text,                    -- matière de l'enseignant / choisie par l'élève
  email      text,                    -- e-mail de connexion (pour le tableau de bord admin)
  observation text not null default '', -- observation générale de l'enseignant (vue par l'élève)
  created_at timestamptz not null default now()
);

-- (installations v3 : ajout des colonnes manquantes)
alter table public.profils add column if not exists statut      text not null default 'en_attente';
alter table public.profils add column if not exists matiere_2   text;  -- 2e matière (un enseignant peut en enseigner 2)
alter table public.profils add column if not exists classes     text[] not null default '{}'; -- classes enseignées (enseignant)
alter table public.profils add column if not exists matieres_par_classe jsonb not null default '{}'::jsonb; -- matière(s) par classe, ex. {"3si1":["STI"],"4si2":["Algo"]}
alter table public.profils add column if not exists matiere     text;
alter table public.profils add column if not exists email       text;
alter table public.profils add column if not exists emploi      jsonb not null default '{}'::jsonb; -- jours de séance par classe {"3si1":[2,4]}
alter table public.profils add column if not exists observation text not null default '';

-- Les classes du site, déterminées par l'admin (interface ⭐ Administration).
create table if not exists public.classes (
  id         text primary key,        -- clé technique (ex. '3si1')
  nom        text not null,           -- nom affiché (ex. '3ème SI 1')
  created_at timestamptz not null default now()
);

-- Les deux classes historiques, si la table est encore vide.
insert into public.classes (id, nom) values
  ('3si1', '3ème SI 1'),
  ('4si2', '4ème SI 2')
on conflict (id) do nothing;

-- Annuaire des élèves (ancien système d'inscription par code — conservé
-- pour compatibilité ; la validation des comptes se fait désormais par
-- l'admin, voir §3).
create table if not exists public.eleves (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  classe     text not null,           -- '3si1' / '4si2'
  code       text not null unique,    -- code d'inscription (ex. 3SI1-01)
  created_at timestamptz not null default now()
);

-- Les devoirs (créés par les enseignants depuis leur espace).
create table if not exists public.devoirs (
  id             uuid primary key default gen_random_uuid(),
  enseignant_id  uuid references public.profils(id) on delete set null,
  enseignant_nom text not null default '',  -- nom affiché aux élèves
  classe         text not null,             -- '3si1' / '4si2'
  matiere        text not null default '',  -- ex. STI, Mathématiques…
  type           text not null default 'DC' check (type in ('DC','DS')),
  titre          text not null,
  date           date not null,             -- date de l'épreuve
  sujet          text not null default '',  -- visible par l'élève à partir du lendemain (J+1)
  correction     text not null default '',  -- visible par l'élève à partir du lendemain (J+1)
  bareme         numeric not null default 20,
  created_at     timestamptz not null default now()
);
alter table public.devoirs add column if not exists limite timestamptz; -- date limite de dépôt de la solution (optionnelle)
alter table public.devoirs add column if not exists sujet_fichier text;      -- fichier du sujet déposé par l'enseignant (bucket depots, dossier devoirs/)
alter table public.devoirs add column if not exists correction_fichier text; -- fichier du corrigé type déposé par l'enseignant
alter table public.devoirs add column if not exists correction_fichiers jsonb not null default '[]'::jsonb; -- corrigé en plusieurs fichiers/pages [{chemin, nom}]
alter table public.rendus add column if not exists fichiers jsonb not null default '[]'::jsonb; -- travail de l'élève en plusieurs fichiers/pages [{chemin, nom}]

create table if not exists public.notes (
  id           bigint generated by default as identity primary key,
  eleve_id     uuid not null references public.profils(id) on delete cascade,
  devoir_id    text not null,         -- id du devoir (base ou fichier d1, d2…)
  note         numeric not null,
  sur          numeric not null default 20,
  appreciation text not null default '',   -- remarque de l'enseignant, vue par l'élève
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  unique (eleve_id, devoir_id)
);

create table if not exists public.rendus (
  id          bigint generated by default as identity primary key,
  eleve_id    uuid not null references public.profils(id) on delete cascade,
  devoir_id   text not null,
  lien        text not null default '',
  fichier     text not null default '',
  commentaire text not null default '',
  date        timestamptz not null default now(),
  unique (eleve_id, devoir_id)
);

-- Correction IA des solutions (v5.5) : proposition de l'IA + validation.
alter table public.rendus add column if not exists nom_fichier     text not null default '';
alter table public.rendus add column if not exists note_ia         numeric;
alter table public.rendus add column if not exists appreciation_ia text not null default '';
alter table public.rendus add column if not exists details_ia      text not null default '';
alter table public.rendus add column if not exists statut          text not null default 'en_attente';
alter table public.rendus add column if not exists corrige_le      timestamptz;
alter table public.rendus drop constraint if exists rendus_statut_check;
alter table public.rendus add constraint rendus_statut_check check (statut in ('en_attente','corrige','valide'));

-- Petite table technique : mémorise les migrations ponctuelles déjà faites.
create table if not exists public.devoirs_meta (
  cle    text primary key,
  valeur text
);

create index if not exists notes_eleve_idx    on public.notes(eleve_id);
create index if not exists rendus_eleve_idx   on public.rendus(eleve_id);
create index if not exists rendus_devoir_idx  on public.rendus(devoir_id);
create index if not exists devoirs_classe_idx on public.devoirs(classe, date);
create index if not exists devoirs_ens_idx    on public.devoirs(enseignant_id);
create index if not exists profils_statut_idx on public.profils(statut);

-- Migration ponctuelle v4 : les comptes créés AVANT la validation par
-- l'admin (v3) sont considérés comme acceptés. Exécutée une seule fois
-- (repère dans devoirs_meta) : relancer le script ne validera jamais
-- automatiquement les demandes en attente.
do $$
begin
  if not exists (select 1 from public.devoirs_meta where cle = 'validation_v4') then
    update public.profils set statut = 'accepte' where statut = 'en_attente';
    insert into public.devoirs_meta (cle, valeur) values ('validation_v4', 'fait');
  end if;
end;
$$;

-- 2) Fonctions utilitaires ---------------------------------------------------
create or replace function public.est_enseignant()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profils
    where id = auth.uid() and role = 'enseignant' and statut = 'accepte'
  );
$$;

create or replace function public.est_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'aymenessouyah@gmail.com';
$$;

-- 3) Sécurité (RLS) ----------------------------------------------------------
alter table public.profils enable row level security;
alter table public.classes enable row level security;
alter table public.eleves  enable row level security;
alter table public.devoirs enable row level security;
alter table public.notes   enable row level security;
alter table public.rendus  enable row level security;

drop policy if exists "profils lecture"     on public.profils;
drop policy if exists "profils creation"    on public.profils;
drop policy if exists "profils modif"       on public.profils;
drop policy if exists "profils modif soi"   on public.profils;
drop policy if exists "profils suppression" on public.profils;

-- Chacun voit son profil ; l'enseignant (validé) voit tous les profils.
create policy "profils lecture" on public.profils
  for select using (id = auth.uid() or public.est_enseignant());

-- Création de son propre profil, en statut « en_attente » (validation par
-- l'admin) — sauf l'admin du site, validé par le déclencheur §5.
create policy "profils creation" on public.profils
  for insert with check (
    id = auth.uid()
    and (statut = 'en_attente' or public.est_admin())
  );

-- L'enseignant modifie les profils (observation d'un élève…) ; chacun peut
-- corriger son propre profil. Le déclencheur §5 empêche de changer
-- soi-même de rôle ou de statut : la validation est réservée à l'admin.
create policy "profils modif" on public.profils
  for update using (public.est_enseignant()) with check (public.est_enseignant());
create policy "profils modif soi" on public.profils
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Seul l'admin du site supprime un profil (depuis son tableau de bord).
create policy "profils suppression" on public.profils
  for delete using (public.est_admin());

drop policy if exists "classes lecture"  on public.classes;
drop policy if exists "classes ecriture" on public.classes;

-- Classes lisibles par tous (nécessaire au choix de la classe dès
-- l'inscription) ; seul l'admin du site les crée / modifie / supprime.
create policy "classes lecture" on public.classes
  for select using (true);
create policy "classes ecriture" on public.classes
  for all using (public.est_admin()) with check (public.est_admin());

drop policy if exists "eleves lecture"  on public.eleves;
drop policy if exists "eleves ecriture" on public.eleves;

-- Annuaire lisible par tous (ancien système par code ; ces codes sont déjà
-- publics dans data/eleves.js du site).
create policy "eleves lecture" on public.eleves
  for select using (true);

-- Seul l'enseignant validé gère l'annuaire.
create policy "eleves ecriture" on public.eleves
  for all using (public.est_enseignant()) with check (public.est_enseignant());

drop policy if exists "devoirs lecture"     on public.devoirs;
drop policy if exists "devoirs creation"    on public.devoirs;
drop policy if exists "devoirs modif"       on public.devoirs;
drop policy if exists "devoirs suppression" on public.devoirs;

-- Lecture : les enseignants validés voient tous les devoirs ; un élève
-- validé voit les devoirs de SA classe (le site n'affiche le sujet et la
-- correction qu'à partir du lendemain de l'épreuve).
create policy "devoirs lecture" on public.devoirs
  for select using (
    public.est_enseignant()
    or exists (
      select 1 from public.profils p
      where p.id = auth.uid() and p.role = 'eleve'
        and p.statut = 'accepte' and p.classe = devoirs.classe
    )
  );

-- Écriture : chaque enseignant validé gère SES devoirs ; l'admin, tous.
create policy "devoirs creation" on public.devoirs
  for insert with check (
    public.est_admin()
    or (public.est_enseignant() and enseignant_id = auth.uid())
  );
create policy "devoirs modif" on public.devoirs
  for update using (
    public.est_admin()
    or (public.est_enseignant() and enseignant_id = auth.uid())
  ) with check (
    public.est_admin()
    or (public.est_enseignant() and enseignant_id = auth.uid())
  );
create policy "devoirs suppression" on public.devoirs
  for delete using (
    public.est_admin()
    or (public.est_enseignant() and enseignant_id = auth.uid())
  );

drop policy if exists "notes lecture"  on public.notes;
drop policy if exists "notes ecriture" on public.notes;

-- L'élève lit ses notes ; l'enseignant validé lit et écrit toutes les notes.
create policy "notes lecture" on public.notes
  for select using (eleve_id = auth.uid() or public.est_enseignant());
create policy "notes ecriture" on public.notes
  for all using (public.est_enseignant()) with check (public.est_enseignant());

drop policy if exists "rendus lecture"     on public.rendus;
drop policy if exists "rendus creation"    on public.rendus;
drop policy if exists "rendus modif"       on public.rendus;
drop policy if exists "rendus suppression" on public.rendus;

-- L'élève gère ses dépôts ; l'enseignant voit tous les dépôts.
create policy "rendus lecture" on public.rendus
  for select using (eleve_id = auth.uid() or public.est_enseignant());
create policy "rendus creation" on public.rendus
  for insert with check (eleve_id = auth.uid() or public.est_enseignant());
create policy "rendus modif" on public.rendus
  for update using (eleve_id = auth.uid() or public.est_enseignant())
  with check (eleve_id = auth.uid() or public.est_enseignant());
create policy "rendus suppression" on public.rendus
  for delete using (eleve_id = auth.uid() or public.est_enseignant());

-- 4) Bucket privé « depots » pour les fichiers des élèves -------------------
insert into storage.buckets (id, name, public)
values ('depots', 'depots', false)
on conflict (id) do nothing;

drop policy if exists "depots lecture"     on storage.objects;
drop policy if exists "depots envoi"       on storage.objects;
drop policy if exists "depots gestion"     on storage.objects;
drop policy if exists "depots suppression" on storage.objects;

-- Chaque élève dépose dans SON dossier (1er segment du chemin = son id).
create policy "depots envoi" on storage.objects
  for insert with check (
    bucket_id = 'depots'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.est_enseignant())
  );

-- Lecture : son dossier, ou tout le bucket pour l'enseignant.
create policy "depots lecture" on storage.objects
  for select using (
    bucket_id = 'depots'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.est_enseignant())
  );

-- Modification / suppression : même règle.
create policy "depots gestion" on storage.objects
  for update using (
    bucket_id = 'depots'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.est_enseignant())
  );
create policy "depots suppression" on storage.objects
  for delete using (
    bucket_id = 'depots'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.est_enseignant())
  );

-- Fichiers des devoirs (sujet/correction déposés par l'enseignant dans le
-- dossier « devoirs/ ») : lisibles par tout utilisateur connecté, pour que
-- les élèves puissent télécharger le sujet et la correction du devoir.
drop policy if exists "depots devoirs lecture" on storage.objects;
create policy "depots devoirs lecture" on storage.objects
  for select to authenticated using (
    bucket_id = 'depots'
    and (storage.foldername(name))[1] = 'devoirs'
  );

-- 5) Admin du site + protection des rôles ------------------------------------
-- Tout compte créé avec l'e-mail de l'admin devient enseignant VALIDÉ,
-- automatiquement. (On regarde l'e-mail du COMPTE concerné, pas celui de
-- la personne qui fait la modification : l'admin peut donc gérer les
-- autres comptes sans les transformer.)
create or replace function public.definir_role_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select lower(u.email) into v_email from auth.users u where u.id = new.id;
  if v_email = 'aymenessouyah@gmail.com' then
    new.role := 'enseignant';
    new.statut := 'accepte';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_role_admin on public.profils;
create trigger trg_role_admin
  before insert or update on public.profils
  for each row execute function public.definir_role_admin();

-- Personne ne peut se valider soi-même ni changer son rôle : seul l'admin
-- du site accepte/refuse les comptes et attribue les rôles. Un enseignant
-- qui modifie le profil d'un élève ne peut changer que le nom et
-- l'observation.
create or replace function public.proteger_profils()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.est_admin() then
    return new;
  end if;
  new.role := old.role;
  new.statut := old.statut;
  if auth.uid() is distinct from old.id then
    new.classe := old.classe;
    new.matiere := old.matiere;
    new.matiere_2 := old.matiere_2;
    new.classes := old.classes;
    new.matieres_par_classe := old.matieres_par_classe;
    new.code := old.code;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_profils on public.profils;
create trigger trg_proteger_profils
  before update on public.profils
  for each row execute function public.proteger_profils();

-- Règle métier : une classe + une matière ne peuvent être enseignées que
-- par UN SEUL enseignant. Le site vérifie avant l'enregistrement ; ce
-- déclencheur garantit la règle même en cas d'accès direct à la base.
create or replace function public.verifier_matiere_unique()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  mm text;
  autre_nom text;
begin
  if new.role is distinct from 'enseignant' then return new; end if;
  if coalesce(new.statut, '') = 'refuse' then return new; end if;
  if new.matieres_par_classe is null or new.matieres_par_classe = '{}'::jsonb then return new; end if;
  for rec in select * from jsonb_each(new.matieres_par_classe) loop
    for mm in select * from jsonb_array_elements_text(coalesce(rec.value, '[]'::jsonb)) loop
      select p.nom into autre_nom
        from public.profils p
       where p.id <> new.id
         and p.role = 'enseignant'
         and coalesce(p.statut, '') <> 'refuse'
         and (coalesce(p.matieres_par_classe, '{}'::jsonb) -> rec.key) ? mm
       limit 1;
      if autre_nom is not null then
        raise exception 'La matière % est déjà enseignée dans la classe % par un autre enseignant (%).', mm, rec.key, autre_nom;
      end if;
    end loop;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_verifier_matiere_unique on public.profils;
create trigger trg_verifier_matiere_unique
  before insert or update of matieres_par_classe, role on public.profils
  for each row execute function public.verifier_matiere_unique();

-- Si le profil admin existe déjà, on le promeut et on le valide tout de suite :
update public.profils p
set role = 'enseignant', statut = 'accepte'
from auth.users u
where p.id = u.id and lower(u.email) = 'aymenessouyah@gmail.com';

-- Taille de la base : utilisée par le site pour afficher le pourcentage
-- de remplissage Supabase sous la version (barre latérale). L'offre
-- gratuite inclut 500 Mo de base de données.
create or replace function public.taille_base()
returns bigint
language sql
security definer
set search_path = public
as $$ select pg_database_size(current_database()) $$;
revoke all on function public.taille_base() from public;
grant execute on function public.taille_base() to authenticated;

-- =========================================================================
--  APRÈS l'exécution de ce script :
--
--  A) Supabase → Authentication → Sign In / Providers → Email :
--       • « Allow new users to sign up » : ACTIVÉ (inscription libre,
--         mais chaque compte attend la validation de l'admin sur le site)
--       • « Confirm email » : DÉSACTIVÉ (la connexion doit marcher
--         immédiatement ; la validation par l'admin suffit)
--
--  B) Créez votre compte depuis la page d'accueil du site (Créer un
--     compte → Enseignant, avec aymenessouyah@gmail.com) : il est validé
--     AUTOMATIQUEMENT comme enseignant + admin. Votre tableau de bord
--     (⭐ Administration) permet ensuite d'accepter ou refuser chaque
--     inscription d'enseignant ou d'élève.
--
--  C) Enseignants : ils créent leur compte (rôle Enseignant + leur
--     matière), vous les acceptez, puis ils gèrent leurs devoirs :
--     date choisie au calendrier officiel, sujet, correction, notes et
--     observations — tout depuis leur espace, sans toucher aux fichiers.
--
--  D) Élèves : ils créent leur compte (rôle Élève + classe + matière),
--     vous les acceptez, puis ils voient les dates des devoirs, le sujet
--     et la correction à partir du lendemain de l'épreuve (J+1), leurs
--     notes et vos remarques.
-- =========================================================================
