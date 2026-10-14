/* ============================================================
   LISTE DES DEVOIRS
   ------------------------------------------------------------
   ⚠️ RÈGLE DU SITE : seuls les devoirs de CONTRÔLE et de
   SYNTHÈSE sont acceptés (épreuves officielles en classe).
   Chaque trimestre : 2 devoirs de contrôle + 1 devoir de
   synthèse par classe, aux dates de la répartition de
   l'espace Vie scolaire.

   POUR AJOUTER UNE ÉPREUVE :
   1. Cliquez sur le crayon ✏️ (Edit) de ce fichier sur GitHub
   2. Copiez un bloc ci-dessous, collez-le en haut de la liste
   3. Modifiez les valeurs, puis cliquez « Commit changes »
   (ou utilisez le générateur de la page admin.html)

   Champs :
   - id          : identifiant unique (d1, d2, d3... ne jamais réutiliser)
   - titre       : « Devoir de contrôle n°X » ou « Devoir de synthèse n°X »
   - classe      : "3si1" ou "4si2"
   - type        : "interro" (épreuve)
   - date_ajout  : date de publication (AAAA-MM-JJ)
   - echeance    : date de l'épreuve (AAAA-MM-JJ)
   - description : détails de l'épreuve
   - fichiers    : liens facultatifs (sujet, annexes...)
   - corrige     : true quand les notes sont publiées, sinon false
   - examen      : toujours true (épreuve en classe — pas de dépôt)
   ============================================================ */
window.DEVOIRS = [
  {
    id: "d8",
    titre: "Devoir de contrôle n°1",
    classe: "4si2",
    type: "interro",
    date_ajout: "2026-10-14",
    echeance: "2026-10-19",
    description:
      "Épreuve du 1er trimestre : CSS3 (positionnement) et JavaScript. Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve écrite/pratique du 1er trimestre sur HTML5, CSS3 et le positionnement. Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 1er trimestre : bases de données (SQL) et introduction au PHP. Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 1er trimestre sur les bases du langage JavaScript et la manipulation du DOM. Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 2e trimestre sur les objets natifs JavaScript (Date, String, Array, Number, Math). Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 2e trimestre : PHP (insertion, affichage) et notions théoriques de BD. Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 2e trimestre : consolidation des objets natifs JavaScript. Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 2e trimestre : consolidation PHP–SQL et théorie des bases de données. Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 3e trimestre sur le LDD et le LMD (insertion, suppression, mise à jour). Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 3e trimestre : LDD, LMD et requêtes de sélection. Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 3e trimestre : requêtes SQL complètes (jointures, sous-requêtes, regroupements). Épreuve en classe — aucun dépôt sur le site.",
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
      "Épreuve du 3e trimestre sur les requêtes de sélection et les fonctions d'agrégat. Épreuve en classe — aucun dépôt sur le site.",
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
