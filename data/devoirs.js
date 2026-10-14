/* ============================================================
   LISTE DES DEVOIRS
   ------------------------------------------------------------
   POUR AJOUTER UN DEVOIR :
   1. Cliquez sur le crayon ✏️ (Edit) de ce fichier sur GitHub
   2. Copiez un bloc ci-dessous, collez-le en haut de la liste
   3. Modifiez les valeurs, puis cliquez « Commit changes »

   Champs :
   - id          : identifiant unique (d1, d2, d3... ne jamais réutiliser)
   - titre       : titre du devoir
   - classe      : "3si1" ou "4si2"
   - type        : "exercices" | "lecon" | "projet" | "tp" | "interro"
   - date_ajout  : date de publication (AAAA-MM-JJ)
   - echeance    : date limite (AAAA-MM-JJ)
   - description : détails du devoir
   - fichiers    : liens facultatifs vers des fichiers (Drive, PDF...)
   - corrige     : true quand le devoir est corrigé, sinon false
   ============================================================ */
window.DEVOIRS = [
  {
    id: "d1",
    titre: "Exercices : algorithmique et conditions",
    classe: "3si1",
    type: "exercices",
    date_ajout: "2026-10-12",
    echeance: "2026-10-22",
    description:
      "Faire les exercices 1 à 5 de la fiche distribuée sur les structures conditionnelles (si / sinon). Écrire l'algorithme de chaque exercice, puis le programme correspondant.",
    fichiers: [],
    corrige: false
  },
  {
    id: "d2",
    titre: "Fiche de révision : HTML & CSS",
    classe: "4si2",
    type: "lecon",
    date_ajout: "2026-10-08",
    echeance: "2026-10-16",
    description:
      "Apprendre la fiche sur les balises HTML essentielles et les sélecteurs CSS. Une interrogation courte est prévue après la date limite.",
    fichiers: [],
    corrige: false
  },
  {
    id: "d3",
    titre: "Projet : ma page web personnelle",
    classe: "4si2",
    type: "projet",
    date_ajout: "2026-10-05",
    echeance: "2026-11-06",
    description:
      "Créer une page web personnelle (HTML + CSS) qui vous présente : parcours scolaire, centres d'intérêt et objectifs. Le site doit être soigné, responsive et sans fautes. À déposer en un seul fichier .zip via un lien Drive.",
    fichiers: [],
    corrige: false
  },
  {
    id: "d4",
    titre: "Leçon : introduction à Python",
    classe: "3si1",
    type: "lecon",
    date_ajout: "2026-09-28",
    echeance: "2026-10-13",
    description:
      "Apprendre la leçon sur les variables, les types de données et l'affichage en Python (chapitre 1). Savoir écrire un petit programme qui demande le nom de l'utilisateur et le salue.",
    fichiers: [],
    corrige: false
  },
  {
    id: "d5",
    titre: "Série d'exercices : le modèle relationnel",
    classe: "4si2",
    type: "exercices",
    date_ajout: "2026-10-13",
    echeance: "2026-11-02",
    description:
      "Exercices 1 à 8 sur les clés primaires, les clés étrangères et les relations entre tables. Modéliser les deux situations proposées avec un schéma relationnel complet.",
    fichiers: [],
    corrige: false
  },
  {
    id: "d6",
    titre: "Compte rendu TP n°1 : découverte de l'IDE",
    classe: "3si1",
    type: "tp",
    date_ajout: "2026-09-20",
    echeance: "2026-10-06",
    description:
      "Rédiger le compte rendu du TP n°1 : présentation de l'environnement de développement, captures d'écran commentées et explication des étapes suivies.",
    fichiers: [],
    corrige: true
  },
  {
    id: "d7",
    titre: "Compte rendu TP n°1 : les réseaux",
    classe: "4si2",
    type: "tp",
    date_ajout: "2026-09-18",
    echeance: "2026-10-03",
    description:
      "Compte rendu du TP n°1 sur la topologie réseau et les adresses IP. Schémas obligatoires, rédigé avec soin et rendu avant la date limite.",
    fichiers: [],
    corrige: true
  }
];
