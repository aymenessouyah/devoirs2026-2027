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
   - examen      : true pour les épreuves en classe (DC/DS) — pas de dépôt
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
  },
  {
    id: "d8",
    titre: "Devoir de contrôle n°1",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2026-10-19",
    description:
      "Épreuve du 1er trimestre : CSS3 (positionnement) et JavaScript. (1er trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d9",
    titre: "Devoir de contrôle n°1",
    classe: "3si1",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2026-10-20",
    description:
      "Épreuve écrite/pratique du 1er trimestre sur HTML5, CSS3 et le positionnement. (1er trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d10",
    titre: "Devoir de contrôle n°2",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2026-11-16",
    description:
      "Épreuve du 1er trimestre : bases de données (SQL) et introduction au PHP. (1er trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d11",
    titre: "Devoir de contrôle n°2",
    classe: "3si1",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2026-11-17",
    description:
      "Épreuve du 1er trimestre sur les bases du langage JavaScript et la manipulation du DOM. (1er trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d12",
    titre: "Devoir de synthèse n°1",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2026-12-07",
    description:
      "Devoir de synthèse n°1 (1er trimestre) — épreuve en classe pendant la semaine bloquée du 7 décembre 2026 au 12 décembre 2026. Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d13",
    titre: "Devoir de synthèse n°1",
    classe: "3si1",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2026-12-08",
    description:
      "Devoir de synthèse n°1 (1er trimestre) — épreuve en classe pendant la semaine bloquée du 7 décembre 2026 au 12 décembre 2026. Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d14",
    titre: "Devoir de contrôle n°3",
    classe: "3si1",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-01-28",
    description:
      "Épreuve du 2e trimestre sur les objets natifs JavaScript (Date, String, Array, Number, Math). (2e trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d15",
    titre: "Devoir de contrôle n°3",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-01-29",
    description:
      "Épreuve du 2e trimestre : PHP (insertion, affichage) et notions théoriques de BD. (2e trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d16",
    titre: "Devoir de contrôle n°4",
    classe: "3si1",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-02-11",
    description:
      "Épreuve du 2e trimestre : consolidation des objets natifs JavaScript. (2e trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d17",
    titre: "Devoir de contrôle n°4",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-02-19",
    description:
      "Épreuve du 2e trimestre : consolidation PHP–SQL et théorie des bases de données. (2e trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d18",
    titre: "Devoir de synthèse n°2",
    classe: "3si1",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-03-04",
    description:
      "Devoir de synthèse n°2 (2e trimestre) — épreuve en classe pendant la semaine bloquée du 4 mars 2027 au 13 mars 2027. Le jour exact sera fixé par l'établissement : la date affichée est le premier jour de la semaine bloquée.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d19",
    titre: "Devoir de synthèse n°2",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-03-04",
    description:
      "Devoir de synthèse n°2 (2e trimestre) — épreuve en classe pendant la semaine bloquée du 4 mars 2027 au 13 mars 2027. Le jour exact sera fixé par l'établissement : la date affichée est le premier jour de la semaine bloquée.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d20",
    titre: "Devoir de contrôle n°5",
    classe: "3si1",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-04-15",
    description:
      "Épreuve du 3e trimestre sur le LDD et le LMD (insertion, suppression, mise à jour). (3e trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d21",
    titre: "Devoir de contrôle n°5",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-04-16",
    description:
      "Épreuve du 3e trimestre : LDD, LMD et requêtes de sélection. (3e trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d22",
    titre: "Devoir de contrôle n°6",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-04-26",
    description:
      "Épreuve du 3e trimestre : requêtes SQL complètes (jointures, sous-requêtes, regroupements). (3e trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d23",
    titre: "Devoir de contrôle n°6",
    classe: "3si1",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-04-29",
    description:
      "Épreuve du 3e trimestre sur les requêtes de sélection et les fonctions d'agrégat. (3e trimestre). Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d24",
    titre: "Devoir de synthèse n°3",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-05-05",
    description:
      "Devoir de synthèse n°3 (3e trimestre) — épreuve en classe pendant la semaine bloquée du 5 mai 2027 au 12 mai 2027. Le jour exact sera fixé par l'établissement : la date affichée est le premier jour de la semaine bloquée.",
    fichiers: [],
    corrige: false,
    examen: true
  },
  {
    id: "d25",
    titre: "Devoir de synthèse n°3",
    classe: "3si1",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2027-05-24",
    description:
      "Devoir de synthèse n°3 (3e trimestre) — épreuve en classe pendant la semaine bloquée du 24 mai 2027 au 29 mai 2027. Le jour exact sera fixé par l'établissement : la date affichée est le premier jour de la semaine bloquée.",
    fichiers: [],
    corrige: false,
    examen: true
  }
];
