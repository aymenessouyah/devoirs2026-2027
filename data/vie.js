/* ============================================================
   VIE DE CLASSE : EMPLOI DU TEMPS, RESSOURCES, RÈGLES
   ------------------------------------------------------------
   EMPLOI DU TEMPS — pour chaque classe, une liste de séances :
   - jour     : "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi"
   - debut    : heure de début ("08:00")
   - fin      : heure de fin ("09:30")
   - salle    : salle ou "En ligne"
   - intitule : intitulé du cours

   RESSOURCES — liens utiles :
   - titre : nom de la ressource
   - url   : adresse du lien
   - desc  : courte description
   - couleur : "rose" | "orange" | "violet" | "cyan" | "vert"

   REGLES — règles du cours (liste de texte).
   ============================================================ */
window.EMPLOI = {
  "3si1": [
    { jour: "lundi", debut: "08:00", fin: "09:30", salle: "Salle A12", intitule: "STI — Cours" },
    { jour: "mardi", debut: "10:00", fin: "11:30", salle: "Labo info 1", intitule: "STI — TP" },
    { jour: "jeudi", debut: "13:00", fin: "14:30", salle: "Salle A12", intitule: "STI — Cours" },
    { jour: "vendredi", debut: "08:00", fin: "09:30", salle: "Labo info 1", intitule: "STI — TD / TP" }
  ],
  "4si2": [
    { jour: "lundi", debut: "10:00", fin: "11:30", salle: "Salle B07", intitule: "STI — Cours" },
    { jour: "mercredi", debut: "08:00", fin: "10:00", salle: "Labo info 2", intitule: "STI — TP" },
    { jour: "jeudi", debut: "10:00", fin: "11:30", salle: "Salle B07", intitule: "STI — Cours" },
    { jour: "samedi", debut: "08:00", fin: "09:30", salle: "Salle B07", intitule: "STI — TD" }
  ]
};

window.RESSOURCES = [
  {
    titre: "Dossier Google Drive du cours",
    url: "https://drive.google.com/",
    desc: "Cours, fiches et documents partagés.",
    couleur: "cyan"
  },
  {
    titre: "Tutoriels HTML & CSS",
    url: "https://developer.mozilla.org/fr/docs/Learn/HTML",
    desc: "Documentation complète pour apprendre le web.",
    couleur: "violet"
  },
  {
    titre: "Apprendre Python",
    url: "https://docs.python.org/fr/3/tutorial/",
    desc: "Le tutoriel officiel de Python, en français.",
    couleur: "vert"
  },
  {
    titre: "S'entraîner en algorithmique",
    url: "https://www.france-ioi.org/",
    desc: "Exercices progressifs pour pratiquer.",
    couleur: "orange"
  },
  {
    titre: "SQL — le jeu",
    url: "https://sql.sh/",
    desc: "Réviser les requêtes SQL facilement.",
    couleur: "rose"
  }
];

window.REGLES = [
  "Respect mutuel : chacun a le droit de s'exprimer et d'apprendre dans le calme.",
  "Matériel : apportez votre cahier et votre clé USB (ou accès Drive) à chaque séance de TP.",
  "Dépôt des travaux : tout travail se dépose via le site, avant la date limite indiquée.",
  "Retards : un travail déposé en retard doit être signalé dans le commentaire du dépôt.",
  "Travail personnel : les projets sont individuels, l'entraide est encouragée mais pas le copiage.",
  "Téléphones : rangés pendant le cours et les TP, sauf autorisation de l'enseignant."
];
