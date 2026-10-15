# 🤖 Guide — Correction IA des solutions des élèves

L'IA (**Google Gemini**, gratuit) corrige les fichiers déposés par les élèves et **propose** une note + une appréciation. **Rien n'est publié sans la validation de l'enseignant.**

## Comment ça marche

1. L'élève dépose sa solution depuis **Mes devoirs → 📤 Ma solution** (PDF, Word, photo de copie, fichier de code…), ou l'enseignant importe le fichier dans **Élèves & notes → 🤖 Correction IA des solutions**.
2. L'enseignant clique **« Corriger avec l'IA »** (ou **« Tout corriger »**) : l'IA compare le fichier au **corrigé type** du devoir et propose une note sur le barème + une appréciation + un détail question par question.
3. L'enseignant vérifie, ajuste si besoin, puis clique **« ✅ Valider et publier »** : la note part dans le tableau des notes et l'élève la voit.

## Mise en service (une seule fois, ~10 minutes)

### 1) Mettre à jour la base
Dans **Supabase → SQL Editor**, exécutez le fichier **`supabase/schema.sql`** (il ajoute les colonnes de correction IA à la table `rendus` et autorise l'import de fichiers par l'enseignant — sans danger pour les données existantes).

### 2) Créer la clé Gemini gratuite
- Allez sur **https://aistudio.google.com/apikey** → **Create API key**.
- Copiez la clé (elle commence par `AIza...`).

### 3) Déployer la fonction serveur
Avec la [Supabase CLI](https://supabase.com/docs/guides/cli) installée, dans le dossier du projet :

```bash
supabase login
supabase link --project-ref oaahxobzbnmaohcmdrbu
supabase functions deploy corriger-ia
supabase secrets set GEMINI_API_KEY=collez_votre_cle_ici
```

La clé reste **côté serveur** : elle n'apparaît jamais dans le site public.

### 4) Tester
Déposez un fichier de test en tant qu'élève, puis corrigez-le en tant qu'enseignant. Si un message parle de « fonction non déployée » ou de « colonnes manquantes », reprenez l'étape 1 ou 3 correspondante.

## Limites à connaître

- Fichiers acceptés : **PDF, .docx, images (jpg/png/webp), fichiers texte/code** (.txt, .py, .pas, .sql, .md…). Taille max conseillée : 9–10 Mo.
- L'IA peut se tromper : c'est un **assistant** — relisez toujours la note proposée avant de valider, surtout pour les copies manuscrites.
- Sans corrigé type dans le devoir, la correction est moins fiable (l'IA le signale et demande confirmation).
- Le quota gratuit Gemini est largement suffisant pour un usage scolaire normal ; en cas de dépassement, réessayez le lendemain.

---

## 🧭 Personnaliser votre agent (consignes + mémoire) — depuis la v5.5.9

Dans le panneau **Correction IA des solutions**, dépliez **« 🧭 Votre agent de
correction »** :

- **Vos consignes** : écrivez comment VOUS corrigez (sévérité, barème
  détaillé, fautes pénalisées, style des appréciations), puis
  « Enregistrer mes consignes ». L'agent les applique à toutes vos copies,
  en plus de l'énoncé et du corrigé type de chaque devoir.
- **Sa mémoire** : chaque correction que vous **validez** (bouton
  « Valider et publier ») devient un exemple anonyme (sans le nom de
  l'élève) dont l'agent s'inspire pour les copies suivantes, en
  privilégiant la même matière. Bouton « Effacer la mémoire » pour
  repartir de zéro.

⚠️ Après la mise à jour de `supabase/functions/corriger-ia/index.ts`,
**redéployez la fonction** pour que consignes et exemples soient pris en
compte :

```bash
supabase functions deploy corriger-ia
```

---

## 📎 Fichiers du devoir + automatisation (depuis la v5.6.0)

- **Dépôt du sujet / de la correction en fichier** : dans le formulaire du
  devoir, vous pouvez joindre le fichier du sujet (PDF, Word, image…) et
  celui du corrigé type, au lieu de coller du texte. Les élèves les
  téléchargent le lendemain de l'épreuve ; l'agent utilise le corrigé
  déposé comme référence principale.
- **🤖 Correction automatique** (interrupteur dans « 🧭 Votre agent ») :
  chaque copie déposée ou importée est corrigée dès son arrivée, et à
  l'ouverture de la page Élèves & notes.
- **🚀 Publication automatique** (même endroit, désactivée par défaut) :
  la note est donnée à l'élève dès la correction terminée. Sinon, le
  bouton **« ✅ Valider et publier toutes »** publie toutes les notes
  corrigées d'un coup, après votre relecture.

⚠️ Après cette mise à jour : exécutez `supabase/schema.sql` (colonnes
`sujet_fichier` / `correction_fichier` + lecture des fichiers de devoirs)
et **redéployez** `corriger-ia` pour que l'agent lise les fichiers joints.

---

## 📚 Travaux et corrigés en plusieurs fichiers (depuis la v5.6.1)

- **Côté élève** : le dépôt accepte **plusieurs fichiers en une fois**
  (pages d'une copie photographiée, `index.html` + `style.css`, etc.).
- **Import du dossier de la classe** : tous les fichiers attribués au
  même élève forment **un seul travail**. La reconnaissance marche aussi
  par **nom de sous-dossier** (un sous-dossier par élève).
- **Côté enseignant** : le corrigé type du devoir peut lui aussi être
  déposé en **plusieurs fichiers/pages**.
- L'agent reçoit **l'ensemble des fichiers** de l'élève et du corrigé
  et les corrige comme un seul travail.

⚠️ Exécutez `supabase/schema.sql` (colonnes `fichiers` et
`correction_fichiers`) et **redéployez `corriger-ia`**.
