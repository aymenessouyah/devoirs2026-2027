/* ============================================================
   CONFIGURATION DU SITE
   Modifiez les valeurs ci-dessous pour personnaliser le site.
   (Éditeur GitHub : cliquez sur ce fichier → crayon ✏️ → Enregistrer)
   ============================================================ */
window.CONFIG = {
  /* Titre affiché dans l'en-tête et l'onglet du navigateur */
  titre: "3SI1 & 4SI2 — Devoirs",
  sousTitre: "Devoirs de contrôle, devoirs de synthèse et notes — toute l'année",

  /* Matière enseignée sur ce site */
  matiere: "STI",

  /* Matières proposées à l'inscription (chaque enseignant déclare la
     sienne ; l'élève choisit la matière de l'enseignant qu'il suit) */
  matieres: [
    "STI",
    "Algo",
    "Informatique",
    "Mathématiques",
    "Physique",
    "Chimie",
    "Sciences naturelles",
    "Français",
    "Anglais",
    "Arabe",
    "Histoire-Géographie",
    "Philosophie",
    "Éducation islamique",
    "Éducation civile",
    "Sport"
  ],

  /* Année scolaire */
  annee: "2026-2027",

  /* Trimestres scolaires — règle du site : par trimestre, par classe et
     par matière, un enseignant peut placer au maximum 2 devoirs de
     contrôle et 1 devoir de synthèse. */
  trimestres: [
    { id: "T1", label: "1er trimestre", debut: "2026-09-01", fin: "2026-12-31" },
    { id: "T2", label: "2e trimestre", debut: "2027-01-01", fin: "2027-03-31" },
    { id: "T3", label: "3e trimestre", debut: "2027-04-01", fin: "2027-06-30" }
  ],

  /* Nom de l'enseignant (affiché dans le pied de page) */
  prof: "Mr Aymen Essouyah" /* ← remplacez par votre nom */,

  /* E-mail de l'enseignant (utilisé par le bouton « Envoyer » du dépôt) */
  email: "aymenessouyah@gmail.com" /* ← remplacez par votre e-mail */,

  /* Classes du site : clé technique -> nom affiché.
     ⚠️ Depuis la v4.1, la liste des classes est déterminée par l'admin
     du site (interface ⭐ Administration, table « classes » de la base).
     Les deux classes ci-dessous ne servent que de repli tant que la
     table est vide ou injoignable. */
  classes: {
    "3si1": "3ème SI 1",
    "4si2": "4ème SI 2",
  },
};
