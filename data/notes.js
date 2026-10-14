/* ============================================================
   NOTES ET DÉPÔTS (RENDUS)
   ------------------------------------------------------------
   NOTES : une ligne par élève noté.
   - eleve        : id de l'élève (voir data/eleves.js)
   - devoir       : id du devoir (voir data/devoirs.js)
   - note / sur   : note obtenue sur le barème indiqué (ex. 14.5 sur 20)
   - appreciation : commentaire facultatif
   - date         : date de correction (AAAA-MM-JJ)

   RENDUS : une ligne par devoir déposé par un élève.
   - eleve  : id de l'élève
   - devoir : id du devoir
   - date   : date du dépôt (AAAA-MM-JJ)
   - commentaire : facultatif
   ============================================================ */
window.NOTES = [
  /* --- Compte rendu TP n°1 (3ème SI 1) --- */
  { eleve: "e1", devoir: "d6", note: 15, sur: 20, appreciation: "Bon travail, soigné.", date: "2026-10-09" },
  { eleve: "e2", devoir: "d6", note: 17.5, sur: 20, appreciation: "Excellent compte rendu.", date: "2026-10-09" },
  { eleve: "e3", devoir: "d6", note: 12, sur: 20, appreciation: "Captures d'écran manquantes.", date: "2026-10-09" },
  { eleve: "e4", devoir: "d6", note: 14, sur: 20, appreciation: "Peut mieux faire dans les explications.", date: "2026-10-09" },
  { eleve: "e5", devoir: "d6", note: 18, sur: 20, appreciation: "Excellent, continue ainsi.", date: "2026-10-09" },

  /* --- Compte rendu TP n°1 (4ème SI 2) --- */
  { eleve: "e7", devoir: "d7", note: 13.5, sur: 20, appreciation: "Schémas corrects, rédaction à améliorer.", date: "2026-10-07" },
  { eleve: "e8", devoir: "d7", note: 16, sur: 20, appreciation: "Très bien.", date: "2026-10-07" },
  { eleve: "e9", devoir: "d7", note: 11, sur: 20, appreciation: "Travail trop succinct.", date: "2026-10-07" },
  { eleve: "e10", devoir: "d7", note: 15, sur: 20, appreciation: "Bon travail.", date: "2026-10-07" },
  { eleve: "e11", devoir: "d7", note: 9.5, sur: 20, appreciation: "Compte rendu à refaire partiellement.", date: "2026-10-07" },
  { eleve: "e12", devoir: "d7", note: 17, sur: 20, appreciation: "Excellent travail.", date: "2026-10-07" }
];

window.RENDUS = [
  /* --- Compte rendu TP n°1 (3ème SI 1) --- */
  { eleve: "e1", devoir: "d6", date: "2026-10-05", commentaire: "" },
  { eleve: "e2", devoir: "d6", date: "2026-10-04", commentaire: "" },
  { eleve: "e3", devoir: "d6", date: "2026-10-06", commentaire: "" },
  { eleve: "e4", devoir: "d6", date: "2026-10-05", commentaire: "" },
  { eleve: "e5", devoir: "d6", date: "2026-10-03", commentaire: "" },
  { eleve: "e6", devoir: "d6", date: "2026-10-06", commentaire: "Déposé en retard, excusez-moi." },

  /* --- Compte rendu TP n°1 (4ème SI 2) --- */
  { eleve: "e7", devoir: "d7", date: "2026-10-02", commentaire: "" },
  { eleve: "e8", devoir: "d7", date: "2026-10-01", commentaire: "" },
  { eleve: "e9", devoir: "d7", date: "2026-10-03", commentaire: "" },
  { eleve: "e10", devoir: "d7", date: "2026-10-02", commentaire: "" },
  { eleve: "e11", devoir: "d7", date: "2026-10-03", commentaire: "" },
  { eleve: "e12", devoir: "d7", date: "2026-09-30", commentaire: "" },

  /* --- Dépôts anticipés --- */
  { eleve: "e1", devoir: "d1", date: "2026-10-13", commentaire: "Travail terminé en avance." },
  { eleve: "e2", devoir: "d1", date: "2026-10-13", commentaire: "" },
  { eleve: "e7", devoir: "d2", date: "2026-10-12", commentaire: "" },
  { eleve: "e9", devoir: "d2", date: "2026-10-13", commentaire: "" }
];
