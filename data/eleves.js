/* ============================================================
   LISTE DES ÉLÈVES
   ------------------------------------------------------------
   Chaque élève possède un « code » personnel (ex. 3SI1-01) qui
   lui permet de consulter ses notes sur la page « Mon suivi ».
   Communiquez les codes aux élèves en début d'année.

   Champs :
   - id     : identifiant unique (e1, e2, e3... ne jamais réutiliser)
   - nom    : nom et prénom affichés
   - classe : "3si1" ou "4si2"
   - code   : code secret de l'élève (modifiable)
   ============================================================ */
window.ELEVES = [
  /* ---------- 3ème SI 1 ---------- */
  { id: "e1", nom: "Amine Ben Salah", classe: "3si1", code: "3SI1-01" },
  { id: "e2", nom: "Meriem Gharbi", classe: "3si1", code: "3SI1-02" },
  { id: "e3", nom: "Yassine Trabelsi", classe: "3si1", code: "3SI1-03" },
  { id: "e4", nom: "Sarra Mansour", classe: "3si1", code: "3SI1-04" },
  { id: "e5", nom: "Oussema Haddad", classe: "3si1", code: "3SI1-05" },
  { id: "e6", nom: "Rania Bouazizi", classe: "3si1", code: "3SI1-06" },

  /* ---------- 4ème SI 2 ---------- */
  { id: "e7", nom: "Ahmed Khelifi", classe: "4si2", code: "4SI2-01" },
  { id: "e8", nom: "Nour El Houda Sassi", classe: "4si2", code: "4SI2-02" },
  { id: "e9", nom: "Mohamed Ali Jendoubi", classe: "4si2", code: "4SI2-03" },
  { id: "e10", nom: "Insaf Mejri", classe: "4si2", code: "4SI2-04" },
  { id: "e11", nom: "Wassim Ben Amor", classe: "4si2", code: "4SI2-05" },
  { id: "e12", nom: "Emna Trabelsi", classe: "4si2", code: "4SI2-06" }
];
