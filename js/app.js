/* ============================================================
   Devoirs Lycée · Logique du site
   (aucune dépendance externe — JavaScript pur)
   ============================================================ */

/* ---------- Petites utilitaires ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const JOURS_COURTS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(iso) {
  const dt = parseDate(iso);
  return `${JOURS[dt.getDay()]} ${dt.getDate()} ${MOIS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function fmtDateCourte(iso) {
  const dt = parseDate(iso);
  return `${dt.getDate()} ${MOIS[dt.getMonth()]}`;
}

function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function joursRestants(iso) {
  const un = 86400000;
  const a = parseDate(todayISO());
  const b = parseDate(iso);
  return Math.round((b - a) / un);
}

function echeanceTexte(iso) {
  const j = joursRestants(iso);
  if (j > 1) return `dans ${j} jours`;
  if (j === 1) return "demain";
  if (j === 0) return "aujourd'hui";
  if (j === -1) return "il y a 1 jour";
  return `il y a ${-j} jours`;
}

function fmtNote(n) {
  return Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* ---------- Accès aux données ---------- */
const CFG = window.CONFIG || {};
const DEVOIRS = window.DEVOIRS || [];
const ELEVES = window.ELEVES || [];
const NOTES = window.NOTES || [];
const RENDUS = window.RENDUS || [];
const ANNONCES = window.ANNONCES || [];
const EMPLOI = window.EMPLOI || {};
const RESSOURCES = window.RESSOURCES || [];
const REGLES = window.REGLES || [];

/* ---------- Calendrier officiel tunisien (propre au site) ---------- */
/* Les données officielles de l'année (vacances, jours fériés, semaines
   bloquées, jours de cours, fenêtres des devoirs de synthèse) vivent
   dans le fichier du site data/calendrier.js : le site est autonome,
   sans aucune synchronisation externe. */
const OFFICIEL = window.CAL_OFFICIEL || null;

function dansPlage(isoDate, from, to) {
  return isoDate >= from && isoDate <= to;
}

function quandOfficielPret(fn) {
  /* Les données sont locales : elles sont déjà disponibles. */
  try { fn(); } catch (e) { /* ignoré */ }
}

/* Événements officiels d'une date : [{type, label}] */
function evenementsOfficiels(isoDate) {
  if (!OFFICIEL) return [];
  const evts = [];
  (OFFICIEL.feries || []).forEach((f) => { if (f.date === isoDate) evts.push({ type: "ferie", label: f.label }); });
  (OFFICIEL.vacances || []).forEach((v) => { if (dansPlage(isoDate, v.from, v.to)) evts.push({ type: "vacances", label: v.label }); });
  (OFFICIEL.suspensions || []).forEach((s) => { if (dansPlage(isoDate, s.from, s.to)) evts.push({ type: "suspension", label: s.label }); });
  (OFFICIEL.jalons || []).forEach((j) => {
    const ok = j.date ? j.date === isoDate : dansPlage(isoDate, j.from, j.to);
    if (ok && j.type !== "vac" && j.type !== "hol") evts.push({ type: "jalon", label: j.label });
  });
  return evts;
}

function epreuveLe(classe, isoDate) {
  if (!OFFICIEL) return null;
  return ((OFFICIEL.epreuves || {})[classe] || []).find((e) => e.date === isoDate) || null;
}

/* Conflits entre les échéances des devoirs et le calendrier officiel */
function conflitsDates() {
  if (!OFFICIEL) return [];
  const conflits = [];
  DEVOIRS.filter((d) => !d.corrige && !d.examen).forEach((d) => {
    const raisons = [];
    const epr = epreuveLe(d.classe, d.echeance);
    if (epr) raisons.push(`jour du ${epr.nom}`);
    evenementsOfficiels(d.echeance).forEach((ev) => {
      if (ev.type === "ferie") raisons.push(`jour férié (${ev.label})`);
      else if (ev.type === "vacances") raisons.push(ev.label.toLowerCase());
      else if (ev.type === "suspension") raisons.push(ev.label.toLowerCase());
    });
    if (raisons.length) conflits.push({ devoir: d, raisons });
  });
  return conflits;
}

/* Prochain jour de cours d'une classe strictement après une date */
function prochainJourCours(classe, apresIso) {
  if (!OFFICIEL) return null;
  const jours = (OFFICIEL.cours || {})[classe];
  if (!jours) return null;
  const d = parseDate(apresIso);
  for (let i = 0; i < 370; i++) {
    d.setDate(d.getDate() + 1);
    const isoJ = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!jours.includes(d.getDay())) continue;
    const bloque = evenementsOfficiels(isoJ).some((e) => e.type !== "jalon") || epreuveLe(classe, isoJ);
    if (!bloque) return isoJ;
  }
  return null;
}

/* ---------- Choix d'une date de devoir dans le respect du calendrier officiel ---------- */
/* type : "controle" (jour de cours ordinaire) ou "synthese" (semaine bloquée).
   devoirIgnoreId : le devoir qu'on est en train de déplacer (sa date actuelle ne compte pas comme occupée).
   extra (optionnel) : { occupees: [iso…], ignorees: [iso…] } — dates occupées en plus
   (devoirs enregistrés dans la base) et dates à ne pas considérer comme occupées. */
function evaluerDateChoix(classe, iso, type, devoirIgnoreId, extra) {
  if (!OFFICIEL) return { etat: "inconnu", ok: false, raison: "Calendrier officiel indisponible" };
  const occupeesExtra = (extra && extra.occupees) || [];
  const ignorees = (extra && extra.ignorees) || [];
  /* La date actuelle du devoir qu'on est en train de modifier reste
     toujours acceptée, même si elle est passée (on peut encore écrire
     sa correction ou changer son titre après l'épreuve). */
  if (ignorees.includes(iso)) return { etat: "valide", ok: true, raison: "Date actuelle du devoir (conservée)" };
  if (iso < todayISO()) return { etat: "passe", ok: false, raison: "Date déjà passée" };
  let occupe = DEVOIRS.find((d) => d.examen && d.classe === classe && d.echeance === iso && d.id !== devoirIgnoreId);
  if (!ignorees.includes(iso)) {
    if (!occupe && occupeesExtra.includes(iso)) occupe = { titre: "un devoir déjà enregistré" };
  } else {
    occupe = null;
  }
  const evts = evenementsOfficiels(iso);
  const ferie = evts.find((e) => e.type === "ferie");
  const vac = evts.find((e) => e.type === "vacances");
  const susp = evts.find((e) => e.type === "suspension");
  const jourSem = parseDate(iso).getDay();

  if (type === "synthese") {
    let fenetres = ((OFFICIEL.epreuves || {})[classe] || []).filter((e) => e.debut && e.fin);
    if (!fenetres.length) {
      /* Classe créée par l'admin, inconnue de Vie scolaire : on utilise
         les semaines bloquées générales du calendrier officiel. */
      fenetres = (OFFICIEL.jalons || [])
        .filter((j) => j.type === "bloc" && j.from && j.to)
        .map((j) => ({ nom: j.label, debut: j.from, fin: j.to }));
    }
    const fen = fenetres.find((e) => iso >= e.debut && iso <= e.fin);
    if (!fen) return { etat: "hors-bloquee", ok: false, raison: "Hors semaine bloquée : les devoirs de synthèse ont lieu pendant les semaines bloquées" };
    if (jourSem === 0) return { etat: "dimanche", ok: false, raison: "Dimanche (pas d'épreuve)" };
    if (ferie) return { etat: "ferie", ok: false, raison: `Jour férié (${ferie.label})` };
    if (occupe) return { etat: "occupe", ok: false, raison: `Déjà occupé par « ${occupe.titre} »` };
    return { etat: "valide", ok: true, raison: `Semaine bloquée du ${fen.nom} — date valide` };
  }

  /* Devoir de contrôle : uniquement un jour de cours ordinaire de la classe */
  if (vac) return { etat: "vacances", ok: false, raison: vac.label };
  if (ferie) return { etat: "ferie", ok: false, raison: `Jour férié (${ferie.label})` };
  if (susp) return { etat: "bloquee", ok: false, raison: "Semaine bloquée (réservée aux devoirs de synthèse)" };
  const coursConnus = (OFFICIEL.cours || {})[classe];
  /* Classe créée par l'admin, inconnue de Vie scolaire : emploi du temps
     inconnu, on autorise du lundi au samedi (hors vacances/fériés/bloc). */
  const cours = coursConnus && coursConnus.length ? coursConnus : [1, 2, 3, 4, 5, 6];
  if (!cours.includes(jourSem)) return { etat: "pas-cours", ok: false, raison: "Pas de cours de STI ce jour-là pour cette classe" };
  if (occupe) return { etat: "occupe", ok: false, raison: `Déjà occupé par « ${occupe.titre} »` };
  return { etat: "valide", ok: true, raison: "Jour de cours de la classe — date valide" };
}

const CHOIX_ICONES = { vacances: "🏖️", ferie: "🚩", bloquee: "🔒", "hors-bloquee": "", occupe: "📝", passe: "", "pas-cours": "", dimanche: "", valide: "" };

function creerCalendrierChoix(conteneur) {
  if (!conteneur) return;
  const classesCfg = Object.keys(CFG.classes || {});
  let classe = classesCfg[0] || "3si1";
  let devoirId = "";
  let nouveau = false;
  let typeChoix = "controle";
  let dateChoisie = null;
  const auj = new Date();
  let annee = auj.getFullYear();
  let mois = auj.getMonth();

  const devoirsExam = () => trierDevoirs(DEVOIRS.filter((d) => d.examen && d.classe === classe));
  const devoirSel = () => getDevoir(devoirId);
  const typeEffectif = () => {
    if (nouveau) return typeChoix;
    const d = devoirSel();
    return d && d.titre.toLowerCase().includes("synthèse") ? "synthese" : "controle";
  };

  function rendreResultat() {
    const zone = $(".cx-resultat", conteneur);
    if (!zone) return;
    if (!dateChoisie) {
      zone.innerHTML = `<p class="text-muted">👆 Cliquez sur un jour <strong style="color:var(--green)">vert</strong> du calendrier pour choisir la date. Les jours grisés sont impossibles (vacances, jour férié, semaine bloquée, pas de cours ou date déjà prise).</p>`;
      return;
    }
    const ev = evaluerDateChoix(classe, dateChoisie, typeEffectif(), nouveau ? "" : devoirId);
    const lienEdit = `https://github.com/aymenessouyah/devoirs2026-2027/edit/main/data/devoirs.js`;
    let generation;
    if (nouveau) {
      const titre = ($(".cx-titre", conteneur)?.value || "").trim() || (typeChoix === "synthese" ? "Devoir de synthèse" : "Devoir de contrôle");
      const id = "d" + (Math.max(0, ...DEVOIRS.map((d) => Number(String(d.id).replace(/\D/g, "")) || 0)) + 1);
      generation = `
        <p class="mt-1">Bloc de la nouvelle épreuve — collez-le dans <code>data/devoirs.js</code>, juste après le crochet ouvrant <code>[</code> :</p>
        <div class="code-block cx-code">  {
    id: "${id}",
    titre: ${JSON.stringify(titre)},
    classe: "${classe}",
    type: "interro",
    date_ajout: "${todayISO()}",
    echeance: "${dateChoisie}",
    description:
      "Épreuve en classe — aucun dépôt sur le site.",
    fichiers: [],
    corrige: false,
    examen: true
  },</div>`;
    } else {
      const d = devoirSel();
      generation = `
        <p class="mt-1">Dans <code>data/devoirs.js</code>, cherchez le devoir <strong>« ${esc(d ? d.titre : "")} »</strong> (${esc(nomClasse(classe))}) et remplacez sa ligne de date par :</p>
        <div class="code-block cx-code">    echeance: "${dateChoisie}",</div>`;
    }
    zone.innerHTML = `
      <div class="callout ${ev.ok ? "callout-success" : "callout-warning"}">${ev.ok ? ICONS.check : ICONS.alert}<div>
        <strong>${fmtDate(dateChoisie)}</strong> — ${esc(ev.raison)}${ev.ok ? "" : "<br/>Choisissez un autre jour."}
      </div></div>
      ${ev.ok ? `${generation}
      <div class="copy-row">
        <button class="btn btn-outline btn-sm cx-copier">📋 Copier</button>
        <a class="btn btn-ghost btn-sm" href="${lienEdit}" target="_blank" rel="noopener">✏️ Ouvrir data/devoirs.js</a>
        <span class="copy-feedback cx-feedback">Copié ✓</span>
      </div>` : ""}`;
    $(".cx-copier", zone)?.addEventListener("click", () => {
      copierTexte($(".cx-code", zone)?.textContent || "", $(".cx-feedback", zone));
    });
  }

  function dessinerGrille() {
    const grille = $(".cx-grille", conteneur);
    const titreMois = $(".cx-mois", conteneur);
    if (!grille) return;
    if (titreMois) titreMois.textContent = `${MOIS_LONG[mois]} ${annee}`;
    const premier = new Date(annee, mois, 1);
    const debut = (premier.getDay() + 6) % 7;
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    const dSel = devoirSel();
    let html = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((j) => `<div class="cal-jour-nom">${j}</div>`).join("");
    for (let i = 0; i < debut; i++) html += `<div class="cal-case vide"></div>`;
    for (let jour = 1; jour <= nbJours; jour++) {
      const iso = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
      const ev = evaluerDateChoix(classe, iso, typeEffectif(), nouveau ? "" : devoirId);
      const classes = ["cal-case", "choix-case", ev.ok ? "valide" : "invalide"];
      if (iso === todayISO()) classes.push("aujourdhui");
      if (iso === dateChoisie) classes.push("selectionne");
      const estActuel = !nouveau && dSel && dSel.echeance === iso;
      if (estActuel) classes.push("actuel");
      const icone = CHOIX_ICONES[ev.etat] || "";
      html += `<button type="button" class="${classes.join(" ")}" data-iso="${iso}" ${ev.ok ? "" : "disabled"} title="${esc(ev.raison)}">
        <div class="cal-num">${jour}</div>
        ${icone ? `<div class="cal-off">${icone}</div>` : ""}
        ${estActuel ? `<div class="cal-off epreuve">actuel</div>` : ""}
      </button>`;
    }
    const reste = (7 - ((debut + nbJours) % 7)) % 7;
    for (let i = 0; i < reste; i++) html += `<div class="cal-case vide"></div>`;
    grille.innerHTML = html;
    $$(".choix-case.valide", grille).forEach((btn) => {
      btn.addEventListener("click", () => {
        dateChoisie = btn.dataset.iso;
        dessinerGrille();
        rendreResultat();
      });
    });
  }

  function rendre() {
    const liste = devoirsExam();
    if (!nouveau && !liste.some((d) => d.id === devoirId)) devoirId = liste[0] ? liste[0].id : "";
    conteneur.innerHTML = `
      <div class="form-grid">
        <div class="field">
          <label>Classe</label>
          <select class="cx-classe">
            ${classesCfg.map((cle) => `<option value="${cle}" ${cle === classe ? "selected" : ""}>${esc(nomClasse(cle))}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>Devoir (épreuve)</label>
          <select class="cx-devoir">
            ${liste.map((d) => `<option value="${esc(d.id)}" ${d.id === devoirId ? "selected" : ""}>${esc(d.titre)} — ${fmtDateCourte(d.echeance)}</option>`).join("")}
            <option value="__nouveau" ${nouveau ? "selected" : ""}>➕ Nouvelle épreuve…</option>
          </select>
        </div>
        <div class="field cx-type-zone ${nouveau ? "" : "hidden"}">
          <label>Type d'épreuve</label>
          <select class="cx-type">
            <option value="controle" ${typeChoix === "controle" ? "selected" : ""}>Devoir de contrôle</option>
            <option value="synthese" ${typeChoix === "synthese" ? "selected" : ""}>Devoir de synthèse</option>
          </select>
        </div>
        <div class="field cx-titre-zone ${nouveau ? "" : "hidden"}">
          <label>Titre de l'épreuve</label>
          <input type="text" class="cx-titre" placeholder="Ex. : Devoir de contrôle n°3" />
        </div>
      </div>
      <div class="cal-nav mb-2 mt-2">
        <button type="button" class="btn btn-outline btn-sm cx-prev">← Précédent</button>
        <h3 class="cx-mois">—</h3>
        <button type="button" class="btn btn-outline btn-sm cx-next">Suivant →</button>
        <div style="margin-left:auto; display:flex; gap:.5rem; flex-wrap:wrap">
          <span class="pill" style="border-color:var(--green);background:var(--soft-green);color:var(--green)">🟢 Date possible</span>
          <span class="pill">🏖️ Vacances</span>
          <span class="pill">🚩 Férié</span>
          <span class="pill">🔒 Semaine bloquée</span>
        </div>
      </div>
      <div class="cal-grid cx-grille"></div>
      <p class="text-muted mt-1" style="font-size:.85rem">${sourceOfficielHTML()} · Jours de cours : ${classe === "3si1" ? "mardi & jeudi" : "lundi & vendredi"} pour la classe choisie.</p>
      <div class="cx-resultat mt-2"></div>`;

    $(".cx-classe", conteneur)?.addEventListener("change", (ev) => {
      classe = ev.target.value;
      nouveau = false;
      devoirId = "";
      dateChoisie = null;
      rendre();
    });
    $(".cx-devoir", conteneur)?.addEventListener("change", (ev) => {
      if (ev.target.value === "__nouveau") {
        nouveau = true;
        dateChoisie = null;
      } else {
        nouveau = false;
        devoirId = ev.target.value;
        dateChoisie = null;
        const d = devoirSel();
        if (d) { const dt = parseDate(d.echeance); annee = dt.getFullYear(); mois = dt.getMonth(); }
      }
      rendre();
    });
    $(".cx-type", conteneur)?.addEventListener("change", (ev) => {
      typeChoix = ev.target.value;
      dateChoisie = null;
      dessinerGrille();
      rendreResultat();
    });
    $(".cx-prev", conteneur)?.addEventListener("click", () => { mois--; if (mois < 0) { mois = 11; annee--; } dessinerGrille(); });
    $(".cx-next", conteneur)?.addEventListener("click", () => { mois++; if (mois > 11) { mois = 0; annee++; } dessinerGrille(); });

    dessinerGrille();
    rendreResultat();
  }

  rendre();
  quandOfficielPret(() => rendre());
}

function sourceOfficielHTML() {
  return `📅 Calendrier officiel tunisien ${CFG.annee || "2026-2027"} — données propres au site`;
}

function nomClasse(cle) {
  return (CFG.classes && CFG.classes[cle]) || cle;
}

function getEleve(id) {
  return ELEVES.find((e) => e.id === id);
}

function getDevoir(id) {
  return DEVOIRS.find((d) => d.id === id);
}

function getNote(eleveId, devoirId) {
  return NOTES.find((n) => n.eleve === eleveId && n.devoir === devoirId);
}

function estRendu(eleveId, devoirId) {
  return RENDUS.some((r) => r.eleve === eleveId && r.devoir === devoirId);
}

function notesDuDevoir(devoirId) {
  return NOTES.filter((n) => n.devoir === devoirId);
}

/* ---------- Statuts ---------- */
const TYPE_ICONS = {
  exercices: "✏️",
  lecon: "📖",
  projet: "🗂️",
  tp: "🧪",
  interro: "📝"
};

function typeLabel(t) {
  return { exercices: "Exercices", lecon: "Leçon", projet: "Projet", tp: "TP", interro: "Interrogation" }[t] || t;
}

function statutDevoir(d) {
  if (d.corrige) return { key: "corrigé", label: "Corrigé", cls: "badge-corrigé" };
  if (joursRestants(d.echeance) < 0) return { key: "attente", label: "En attente de correction", cls: "badge-attente" };
  return { key: "afaire", label: "À faire", cls: "badge-afaire" };
}

function statutEleve(d, eleveId) {
  if (getNote(eleveId, d.id)) return { key: "note", label: "Noté", cls: "badge-note" };
  if (estRendu(eleveId, d.id)) return { key: "rendu", label: "Rendu", cls: "badge-rendu" };
  if (joursRestants(d.echeance) < 0) return { key: "retard", label: "Non rendu", cls: "badge-retard" };
  return { key: "afaire", label: "À faire", cls: "badge-afaire" };
}

/* ---------- Moyennes ---------- */
function moyenneEleve(eleveId) {
  const notes = NOTES.filter((n) => n.eleve === eleveId);
  if (!notes.length) return null;
  const somme = notes.reduce((acc, n) => acc + (n.note / n.sur) * 20, 0);
  return somme / notes.length;
}

function moyenneClasseDevoir(devoirId) {
  const notes = notesDuDevoir(devoirId);
  if (!notes.length) return null;
  const somme = notes.reduce((acc, n) => acc + (n.note / n.sur) * 20, 0);
  return somme / notes.length;
}

function classeNoteCls(val) {
  if (val >= 14) return "note-good";
  if (val >= 10) return "note-mid";
  return "note-bad";
}

/* ---------- Icônes SVG (inline) ---------- */
const ICONS = {
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  award: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 5.8L20 10.7l-5.3 3.2L12 20l-2.7-6.1L4 10.7l6.1-1.9L12 3z"/></svg>'
};

/* ---------- Thème clair / sombre ---------- */
function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
}

function themeIcon() {
  const dark = document.documentElement.dataset.theme === "dark";
  return dark ? ICONS.sun : ICONS.moon;
}

function toggleTheme() {
  const dark = document.documentElement.dataset.theme === "dark";
  const next = dark ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  const btn = $("#theme-toggle");
  if (btn) {
    btn.innerHTML = themeIcon();
    btn.setAttribute("aria-label", next === "dark" ? "Passer en mode clair" : "Passer en mode sombre");
  }
}

/* ---------- Animations au défilement ---------- */
function initReveal() {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Mise en page commune ---------- */
function injectLayout() {
  const page = document.body.dataset.page || "";
  const titre = CFG.titre || "Devoirs";
  const sous = CFG.sousTitre || "";

  const connecte = typeof sbConnecte === "function" && sbConnecte();
  const cacheP = connecte && typeof sbProfilCache === "function" ? sbProfilCache() : null;
  const espaceHref = cacheP && cacheP.role === "enseignant" ? "espace-enseignant.html" : "espace-eleve.html";
  const liens = connecte
    ? [
        { key: "espace", href: espaceHref, label: "👤 Mon espace" },
        ...((typeof sbEstAdminLocal === "function" && sbEstAdminLocal() && cacheP && cacheP.role === "enseignant")
          ? [{ key: "espace-admin", href: "espace-admin.html", label: "⭐ Admin" }]
          : []),
        { key: "calendrier", href: "calendrier.html", label: "Calendrier" },
        { key: "vie", href: "vie-de-classe.html", label: "Vie de classe" },
        { key: "deconnexion", href: "#", label: "Se déconnecter", id: "lien-deconnexion" }
      ]
    : [{ key: "connexion", href: "index.html", label: "Connexion" }];

  const nav = liens
    .map((l) => {
      const actif = page === l.key || (l.key === "espace" && page.startsWith("espace"));
      return `<a href="${l.href}"${l.id ? ` id="${l.id}"` : ""}${actif ? ' class="active" aria-current="page"' : ""}>${l.label}</a>`;
    })
    .join("");

  const header = `
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="index.html">
          <span class="brand-logo">${ICONS.book}</span>
          <span>${esc(titre)}<small>${esc(sous)}</small></span>
        </a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Ouvrir le menu" aria-expanded="false">${ICONS.menu}</button>
        <nav class="main-nav" id="main-nav">${nav}</nav>
        <button class="theme-toggle" id="theme-toggle" aria-label="Changer de thème">${themeIcon()}</button>
      </div>
    </header>`;

  const footer = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <strong>${esc(titre)}</strong><br/>
          <span class="muted">${esc(CFG.matiere || "")} · ${esc(CFG.annee || "")} — ${esc(CFG.prof || "")}</span>
        </div>
        <div class="footer-links">
          ${connecte ? `<a href="${espaceHref}">Mon espace</a>
          <a href="calendrier.html">Calendrier</a>
          <a href="vie-de-classe.html">Vie de classe</a>` : `<a href="index.html">Connexion</a>`}
        </div>
        <div class="muted">Publié avec GitHub Pages · PWA installable 📱 · version du site 4.2.10</div>
      </div>
    </footer>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  $("#nav-toggle")?.addEventListener("click", () => {
    const navEl = $("#main-nav");
    const ouvert = navEl.classList.toggle("open");
    $("#nav-toggle").setAttribute("aria-expanded", String(ouvert));
  });

  $("#theme-toggle")?.addEventListener("click", toggleTheme);

  $("#lien-deconnexion")?.addEventListener("click", async (ev) => {
    ev.preventDefault();
    if (typeof sbDeconnexion === "function") await sbDeconnexion();
    location.href = "index.html";
  });

  if (CFG.titre) document.title = document.title || titre;
}

/* ---------- Composant : carte de devoir ---------- */
function carteDevoirHTML(d, opts = {}) {
  const st = opts.statut || statutDevoir(d);
  const eleveId = opts.eleveId;
  const note = eleveId ? getNote(eleveId, d.id) : null;
  const classeNom = nomClasse(d.classe);

  let bandeauNote = "";
  if (note) {
    bandeauNote = `
      <div class="pill" style="border-color:var(--green);background:var(--soft-green)">
        ${ICONS.award} Ma note : <strong>&nbsp;${fmtNote(note.note)}/${fmtNote(note.sur)}</strong>
      </div>`;
  }

  const actions = d.examen
    ? `<span class="pill" style="border-color:var(--violet);background:var(--soft-violet);color:var(--violet)">📝 Épreuve en classe — aucun dépôt</span>
       <a class="btn btn-ghost btn-sm" href="suivi.html">Voir mon suivi</a>`
    : d.corrige
    ? `<a class="btn btn-ghost btn-sm" href="suivi.html">Voir mon suivi</a>`
    : `<a class="btn btn-primary btn-sm" href="depot.html?devoir=${encodeURIComponent(d.id)}">${ICONS.upload} Déposer ce devoir</a>
       <a class="btn btn-ghost btn-sm" href="suivi.html">Voir mon suivi</a>`;

  return `
    <article class="devoir-card reveal" data-type="${esc(d.type)}">
      <div class="devoir-top">
        <div>
          <span class="devoir-type t-${esc(d.type)}">${TYPE_ICONS[d.type] || "📄"} ${esc(typeLabel(d.type))}</span>
          <h3 class="mt-1">${esc(d.titre)}</h3>
        </div>
        <span class="badge ${st.cls}">${st.label}</span>
      </div>
      <p class="devoir-desc">${esc(d.description)}</p>
      ${bandeauNote}
      <div class="devoir-meta">
        <span class="item">${ICONS.users} ${esc(classeNom)}</span>
        <span class="item">${ICONS.calendar} ${d.examen ? "Épreuve" : "Échéance"} : ${fmtDate(d.echeance)} <em style="font-style:normal;opacity:.75">(${echeanceTexte(d.echeance)})</em></span>
        <span class="item">${ICONS.clock} Publié le ${fmtDateCourte(d.date_ajout)}</span>
      </div>
      <div class="devoir-actions">${actions}</div>
    </article>`;
}

function listeDevoirsHTML(devoirs, opts = {}) {
  if (!devoirs.length) {
    return `
      <div class="empty">
        ${ICONS.inbox}
        <p><strong>Aucun devoir pour le moment.</strong></p>
        <p>Revenez bientôt — les nouveaux devoirs apparaîtront ici.</p>
      </div>`;
  }
  return `<div class="grid grid-3">${devoirs.map((d) => carteDevoirHTML(d, opts)).join("")}</div>`;
}

function trierDevoirs(list) {
  return [...list].sort((a, b) => {
    const aa = joursRestants(a.echeance) >= 0 ? 0 : 1;
    const bb = joursRestants(b.echeance) >= 0 ? 0 : 1;
    if (aa !== bb) return aa - bb;
    return aa === 0 ? parseDate(a.echeance) - parseDate(b.echeance) : parseDate(b.echeance) - parseDate(a.echeance);
  });
}

/* ---------- Composant : annonce ---------- */
function carteAnnonceHTML(a, compact = false) {
  return `
    <article class="anonce-card reveal ${a.important ? "importante" : ""}">
      ${a.important ? `<span class="anonce-pin">📌 Épinglée</span>` : ""}
      <div class="anonce-date">${fmtDate(a.date)}</div>
      <h3>${esc(a.titre)}</h3>
      ${compact ? "" : `<p>${esc(a.texte)}</p>`}
    </article>`;
}

function trierAnnonces(list) {
  return [...list].sort((a, b) => parseDate(b.date) - parseDate(a.date));
}

/* ============================================================
   PAGES
   ============================================================ */

/* ---------- Accueil ---------- */
function renderAccueil() {
  const afaire = DEVOIRS.filter((d) => statutDevoir(d).key === "afaire");
  const corriges = DEVOIRS.filter((d) => d.corrige);
  const prochain = trierDevoirs(afaire)[0];
  const derniers = trierDevoirs(DEVOIRS).slice(0, 6);

  const stats = $("#stats");
  if (stats) {
    stats.innerHTML = `
      <div class="hero-stat"><div class="num">${afaire.length}</div><div class="label">devoirs à faire</div></div>
      <div class="hero-stat"><div class="num">${corriges.length}</div><div class="label">devoirs corrigés</div></div>
      <div class="hero-stat"><div class="num">${ELEVES.length}</div><div class="label">élèves suivis</div></div>`;
  }

  const prochainEl = $("#prochaine-echeance");
  if (prochainEl) {
    prochainEl.innerHTML = prochain
      ? `<div class="callout callout-info reveal">
           ${ICONS.clock}
           <div>
             <strong>Prochaine échéance : ${esc(prochain.titre)}</strong> — ${nomClasse(prochain.classe)}<br/>
             ${fmtDate(prochain.echeance)} <em style="font-style:normal;opacity:.8">(${echeanceTexte(prochain.echeance)})</em>
             · <a href="calendrier.html"><strong>Voir le calendrier →</strong></a>
           </div>
         </div>`
      : "";
  }

  const jalonEl = $("#prochain-jalon");
  if (jalonEl) {
    const majJalon = () => {
      if (!OFFICIEL) { jalonEl.innerHTML = ""; return; }
      const aujIso = todayISO();
      const j = (OFFICIEL.jalons || [])
        .filter((x) => (x.to || x.date) >= aujIso)
        .sort((a, b) => (a.from || a.date).localeCompare(b.from || b.date))[0];
      if (!j) { jalonEl.innerHTML = ""; return; }
      const quand = j.date ? fmtDate(j.date) : `du ${fmtDate(j.from)} au ${fmtDate(j.to)}`;
      jalonEl.innerHTML = `
        <div class="callout reveal" style="border-left:4px solid var(--green);background:var(--soft-green,rgba(34,197,94,.1))">
          ${ICONS.calendar}
          <div>
            <strong>Prochain jalon officiel : ${esc(j.label)}</strong><br/>
            ${esc(quand)} · <a href="calendrier.html"><strong>Calendrier officiel →</strong></a>
            <span class="text-muted" style="font-size:.82rem">(calendrier officiel du site)</span>
          </div>
        </div>`;
    };
    majJalon();
    quandOfficielPret(majJalon);
  }

  const annoncesEl = $("#dernieres-annonces");
  if (annoncesEl) {
    const dernAnnonces = trierAnnonces(ANNONCES).slice(0, 3);
    annoncesEl.innerHTML = dernAnnonces.length
      ? `<div class="grid grid-3">${dernAnnonces.map((a) => carteAnnonceHTML(a)).join("")}</div>`
      : `<div class="empty">${ICONS.megaphone}<p>Aucune annonce pour le moment.</p></div>`;
  }

  const derniersEl = $("#derniers-devoirs");
  if (derniersEl) derniersEl.innerHTML = listeDevoirsHTML(derniers);

  const classesEl = $("#classes-tiles");
  if (classesEl) {
    classesEl.innerHTML = Object.entries(CFG.classes || {})
      .map(([cle, nom]) => {
        const nb = DEVOIRS.filter((d) => d.classe === cle).length;
        const nbEleves = ELEVES.filter((e) => e.classe === cle).length;
        return `
          <a class="class-tile reveal" href="classe-${cle}.html">
            <span class="cl-badge">${esc(cle.toUpperCase())}</span>
            <h3>${esc(nom)}</h3>
            <p>${nbEleves} élèves · ${nb} devoir${nb > 1 ? "s" : ""} en ligne</p>
          </a>`;
      })
      .join("");
  }
}

/* ---------- Page Devoirs ---------- */
function renderDevoirs() {
  const selClasse = $("#filtre-classe");
  const selStatut = $("#filtre-statut");
  const inputQ = $("#filtre-q");
  const resultat = $("#liste-devoirs");

  if (selClasse) {
    selClasse.innerHTML =
      `<option value="">Toutes les classes</option>` +
      Object.entries(CFG.classes || {}).map(([cle, nom]) => `<option value="${cle}">${esc(nom)}</option>`).join("");
  }

  function appliquer() {
    let list = DEVOIRS;
    const c = selClasse?.value || "";
    const s = selStatut?.value || "";
    const q = (inputQ?.value || "").trim().toLowerCase();

    if (c) list = list.filter((d) => d.classe === c);
    if (s) list = list.filter((d) => statutDevoir(d).key === s);
    if (q) {
      list = list.filter(
        (d) =>
          d.titre.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          typeLabel(d.type).toLowerCase().includes(q)
      );
    }
    list = trierDevoirs(list);
    if (resultat) {
      resultat.innerHTML =
        `<p class="text-muted mb-2">${list.length} devoir${list.length > 1 ? "s" : ""} trouvé${list.length > 1 ? "s" : ""}.</p>` +
        listeDevoirsHTML(list);
    }
  }

  selClasse?.addEventListener("change", appliquer);
  selStatut?.addEventListener("change", appliquer);
  inputQ?.addEventListener("input", appliquer);
  appliquer();
}

/* ---------- Page Classe ---------- */
function renderClasse() {
  const cle = document.body.dataset.classe;
  const nom = nomClasse(cle);
  const devoirs = trierDevoirs(DEVOIRS.filter((d) => d.classe === cle));
  const eleves = ELEVES.filter((e) => e.classe === cle);

  const titre = $("#classe-titre");
  if (titre) titre.textContent = nom;

  const sub = $("#classe-sub");
  if (sub) sub.textContent = `${eleves.length} élèves · ${devoirs.length} devoir${devoirs.length > 1 ? "s" : ""} · ${CFG.matiere || ""} · ${CFG.annee || ""}`;

  const liste = $("#classe-devoirs");
  if (liste) liste.innerHTML = listeDevoirsHTML(devoirs);

  const planning = $("#classe-planning");
  if (planning) {
    const aVenir = devoirs.filter((d) => joursRestants(d.echeance) >= 0 && !d.corrige);
    planning.innerHTML = aVenir.length
      ? `<div class="table-wrap reveal"><table>
           <thead><tr><th>Devoir</th><th>Échéance</th><th>Restant</th><th>Statut</th></tr></thead>
           <tbody>${aVenir
             .map((d) => {
               const st = statutDevoir(d);
               return `<tr>
                 <td><strong>${esc(d.titre)}</strong></td>
                 <td>${fmtDate(d.echeance)}</td>
                 <td>${echeanceTexte(d.echeance)}</td>
                 <td><span class="badge ${st.cls}">${st.label}</span></td>
               </tr>`;
             })
             .join("")}</tbody>
         </table></div>`
      : `<div class="empty">${ICONS.calendar}<p>Aucune échéance à venir pour cette classe.</p></div>`;
  }

  const moyennes = $("#classe-moyennes");
  if (moyennes) {
    const avecNotes = devoirs.filter((d) => notesDuDevoir(d.id).length > 0);
    moyennes.innerHTML = avecNotes.length
      ? `<div class="table-wrap reveal"><table>
           <thead><tr><th>Devoir</th><th>Notes mises</th><th>Moyenne de la classe</th></tr></thead>
           <tbody>${avecNotes
             .map((d) => {
               const m = moyenneClasseDevoir(d.id);
               return `<tr>
                 <td><strong>${esc(d.titre)}</strong></td>
                 <td>${notesDuDevoir(d.id).length} / ${eleves.length}</td>
                 <td><span class="note-value ${classeNoteCls(m)}">${fmtNote(m)} / 20</span></td>
               </tr>`;
             })
             .join("")}</tbody>
         </table></div>`
      : `<div class="empty">${ICONS.award}<p>Les moyennes apparaîtront ici dès la première correction.</p></div>`;
  }

  const horaire = $("#classe-horaire");
  if (horaire) horaire.innerHTML = emploiHTML(cle);
}

/* ---------- Emploi du temps ---------- */
function emploiHTML(cle) {
  const seances = (EMPLOI[cle] || []).slice();
  if (!seances.length) {
    return `<div class="empty">${ICONS.clock}<p>L'emploi du temps sera publié prochainement.</p></div>`;
  }
  const ordre = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  seances.sort((a, b) => ordre.indexOf(a.jour) - ordre.indexOf(b.jour) || a.debut.localeCompare(b.debut));

  const parJour = {};
  seances.forEach((s) => {
    (parJour[s.jour] = parJour[s.jour] || []).push(s);
  });

  return ordre
    .filter((j) => parJour[j])
    .map(
      (j) => `
      <div class="horaire-jour reveal">
        <h4>${j}</h4>
        ${parJour[j]
          .map(
            (s) => `
          <div class="horaire-cours">
            <span class="horaire-heure">${s.debut} – ${s.fin}</span>
            <span class="intitule">${esc(s.intitule)}</span>
            <span class="salle">📍 ${esc(s.salle)}</span>
          </div>`
          )
          .join("")}
      </div>`
    )
    .join("");
}

/* ---------- Page Vie de classe ---------- */
function renderVie() {
  /* Annonces */
  const annoncesEl = $("#vie-annonces");
  if (annoncesEl) {
    const list = trierAnnonces(ANNONCES);
    annoncesEl.innerHTML = list.length
      ? list.map((a) => carteAnnonceHTML(a)).join("")
      : `<div class="empty">${ICONS.megaphone}<p>Aucune annonce pour le moment.</p></div>`;
  }

  /* Emploi du temps (onglets) */
  const emploiEl = $("#vie-emploi");
  if (emploiEl) {
    const classes = Object.keys(CFG.classes || {});
    const onglets = classes
      .map((cle, i) => `<button class="btn ${i === 0 ? "btn-secondary" : "btn-ghost"} btn-sm onglet-emploi" data-cle="${cle}">${esc(nomClasse(cle))}</button>`)
      .join(" ");
    emploiEl.innerHTML = `
      <div class="form-actions" style="margin:0 0 1.15rem">${onglets}</div>
      <div id="vie-emploi-zone">${emploiHTML(classes[0])}</div>`;

    $$(".onglet-emploi", emploiEl).forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".onglet-emploi", emploiEl).forEach((b) => b.classList.replace("btn-secondary", "btn-ghost"));
        btn.classList.replace("btn-ghost", "btn-secondary");
        $("#vie-emploi-zone").innerHTML = emploiHTML(btn.dataset.cle);
      });
    });
  }

  /* Ressources */
  const resEl = $("#vie-ressources");
  if (resEl) {
    resEl.innerHTML = RESSOURCES.length
      ? `<div class="grid grid-3">${RESSOURCES
          .map(
            (r) => `
          <a class="ressource-card reveal" href="${esc(r.url)}" target="_blank" rel="noopener">
            <div class="ressource-pastille c-${esc(r.couleur || "violet")}">${ICONS.link}</div>
            <h3>${esc(r.titre)}</h3>
            <p>${esc(r.desc)}</p>
            <span class="url">Ouvrir le lien ↗</span>
          </a>`
          )
          .join("")}</div>`
      : `<div class="empty">${ICONS.link}<p>Les ressources utiles seront ajoutées ici.</p></div>`;
  }

  /* Règles */
  const reglesEl = $("#vie-regles");
  if (reglesEl) {
    reglesEl.innerHTML = REGLES.length
      ? REGLES.map(
          (r, i) => `
        <div class="regle-item reveal">
          <span class="regle-num">${i + 1}</span>
          <div>${esc(r)}</div>
        </div>`
        ).join("")
      : `<div class="empty">${ICONS.info}<p>Les règles du cours seront affichées ici.</p></div>`;
  }
}

/* ---------- Page Calendrier ---------- */
function renderCalendrier() {
  const grid = $("#cal-grid");
  const titre = $("#cal-titre");
  if (!grid) return;

  const auj = new Date();
  let annee = auj.getFullYear();
  let mois = auj.getMonth();

  function dessiner() {
    if (titre) titre.textContent = `${MOIS_LONG[mois]} ${annee}`;

    const premier = new Date(annee, mois, 1);
    /* Lundi = 1er colonne */
    let debut = (premier.getDay() + 6) % 7;
    const nbJours = new Date(annee, mois + 1, 0).getDate();

    const evts = DEVOIRS.filter((d) => {
      const dt = parseDate(d.echeance);
      return dt.getFullYear() === annee && dt.getMonth() === mois;
    });

    let html = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"]
      .map((j) => `<div class="cal-jour-nom">${j}</div>`)
      .join("");

    for (let i = 0; i < debut; i++) html += `<div class="cal-case vide"></div>`;

    for (let jour = 1; jour <= nbJours; jour++) {
      const iso = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
      const estAujourdhui = iso === todayISO();
      const duJour = evts.filter((d) => d.echeance === iso);
      const offs = evenementsOfficiels(iso);
      const estVac = offs.some((e) => e.type === "vacances");
      const estFerie = offs.some((e) => e.type === "ferie");
      const classesCase = ["cal-case"];
      if (estAujourdhui) classesCase.push("aujourdhui");
      if (estVac) classesCase.push("cal-vac");
      if (estFerie) classesCase.push("cal-ferie");
      const epreuvesHTML = ["3si1", "4si2"]
        .map((cle) => {
          const ep = epreuveLe(cle, iso);
          if (!ep) return "";
          if (duJour.some((d) => d.examen && d.classe === cle)) return "";
          const court = ep.nom.replace("Devoir de contrôle", "DC").replace("Devoir de synthèse", "DS");
          return `<div class="cal-off epreuve" title="${esc(ep.nom)} — ${esc(nomClasse(cle))}">📝 ${esc(court)} · ${cle === "3si1" ? "3SI1" : "4SI2"}</div>`;
        })
        .join("");
      const offsHTML =
        epreuvesHTML +
        (estFerie ? `<div class="cal-off">🚩 Férié</div>` : "") +
        (estVac ? `<div class="cal-off">🏖️ Vacances</div>` : "");
      html += `
        <div class="${classesCase.join(" ")}">
          <div class="cal-num">${jour}</div>
          ${duJour
            .map(
              (d) =>
                `<button class="cal-event e-${esc(d.classe)}" data-id="${esc(d.id)}" title="${esc(d.titre)}">${esc(d.titre)}</button>`
            )
            .join("")}
          ${offsHTML}
        </div>`;
    }

    const reste = (7 - ((debut + nbJours) % 7)) % 7;
    for (let i = 0; i < reste; i++) html += `<div class="cal-case vide"></div>`;

    grid.innerHTML = html;

    /* Les détails des devoirs se consultent dans l'espace de chacun
       (sujet et correction visibles à partir du lendemain de l'épreuve). */
  }

  $("#cal-prev")?.addEventListener("click", () => {
    mois--;
    if (mois < 0) { mois = 11; annee--; }
    dessiner();
  });

  $("#cal-next")?.addEventListener("click", () => {
    mois++;
    if (mois > 11) { mois = 0; annee++; }
    dessiner();
  });

  dessiner();

  /* Liste des prochaines échéances */
  const liste = $("#cal-liste");
  if (liste) {
    const aVenir = trierDevoirs(DEVOIRS.filter((d) => joursRestants(d.echeance) >= 0 && !d.corrige));
    liste.innerHTML = aVenir.length
      ? aVenir
          .map(
            (d) => `
        <div class="horaire-cours reveal" style="border-left-color:${d.classe === "3si1" ? "var(--rose)" : "var(--cyan)"}">
          <span class="horaire-heure" style="background:${d.classe === "3si1" ? "var(--soft-rose);color:var(--rose)" : "var(--soft-cyan);color:#0e7490"}">${fmtDateCourte(d.echeance)}</span>
          <span class="intitule">${esc(d.titre)} <span class="text-muted" style="font-weight:400">(${esc(nomClasse(d.classe))})</span></span>
          <span class="salle">${echeanceTexte(d.echeance)}</span>
        </div>`
          )
          .join("")
      : `<div class="empty">${ICONS.calendar}<p>Aucune échéance à venir.</p></div>`;
  }

  /* Calendrier officiel tunisien (Vie scolaire) : jalons + épreuves */
  const TYPES_JALON = {
    eval: ["📝 Évaluation", "var(--rose)"],
    bloc: ["🔒 Semaine bloquée", "var(--violet)"],
    vac: ["🏖️ Vacances", "var(--green)"],
    hol: ["🚩 Jour férié", "var(--orange)"],
    admin: ["🗂️ Administration", "var(--cyan)"],
    info: ["ℹ️ Repère", "var(--amber)"],
    start: ["🎒 Rentrée", "var(--green)"],
    end: ["🏁 Fin d'année", "var(--violet)"]
  };

  function rendreOfficiel() {
    const zone = $("#cal-officiel");
    const src = $("#cal-source");
    if (src) src.innerHTML = sourceOfficielHTML();
    if (!zone) return;
    if (!OFFICIEL) {
      zone.innerHTML = `<div class="empty">${ICONS.calendar}<p>Calendrier officiel indisponible pour le moment.</p></div>`;
      return;
    }
    const aujIso = todayISO();
    const jalons = (OFFICIEL.jalons || [])
      .filter((j) => (j.to || j.date) >= aujIso)
      .sort((a, b) => (a.from || a.date).localeCompare(b.from || b.date))
      .slice(0, 8);
    const jalonsHTML = jalons
      .map((j) => {
        const [badge, couleur] = TYPES_JALON[j.type] || TYPES_JALON.info;
        const quand = j.date ? fmtDate(j.date) : `du ${fmtDate(j.from)} au ${fmtDate(j.to)}`;
        return `
        <div class="horaire-cours reveal" style="border-left-color:${couleur}">
          <span class="horaire-heure">${esc(badge)}</span>
          <span class="intitule">${esc(j.label)}${j.s ? ` <span class="text-muted" style="font-weight:400">— ${esc(j.s)}</span>` : ""}</span>
          <span class="salle">${esc(quand)}</span>
        </div>`;
      })
      .join("");

    const epreuvesHTML = Object.keys(CFG.classes || {})
      .map((cle) => {
        const prochaines = ((OFFICIEL.epreuves || {})[cle] || []).filter((e) => e.date >= aujIso).slice(0, 4);
        if (!prochaines.length) return "";
        return `
        <div class="horaire-cours reveal" style="border-left-color:${cle === "3si1" ? "var(--rose)" : "var(--cyan)"}">
          <span class="horaire-heure" style="background:${cle === "3si1" ? "var(--soft-rose);color:var(--rose)" : "var(--soft-cyan);color:#0e7490"}">${esc(nomClasse(cle))}</span>
          <span class="intitule">${prochaines.map((e) => `${esc(e.nom)} : <strong>${fmtDateCourte(e.date)}</strong>`).join(" · ")}</span>
          <span class="salle">épreuves officielles</span>
        </div>`;
      })
      .join("");

    zone.innerHTML = (epreuvesHTML || "") + (jalonsHTML || `<div class="empty">${ICONS.calendar}<p>Aucun jalon officiel à venir.</p></div>`);
  }

  rendreOfficiel();
  quandOfficielPret(() => { dessiner(); rendreOfficiel(); });
}

/* ---------- Page Dépôt ---------- */
function renderDepot() {
  const selDevoir = $("#depot-devoir");
  const selEleve = $("#depot-eleve");
  const params = new URLSearchParams(location.search);
  const devoirId = params.get("devoir");

  if (selDevoir) {
    const ouverts = trierDevoirs(DEVOIRS.filter((d) => !d.corrige && !d.examen));
    selDevoir.innerHTML =
      `<option value="">— Choisir un devoir —</option>` +
      ouverts.map((d) => `<option value="${d.id}">${esc(nomClasse(d.classe))} · ${esc(d.titre)} (avant le ${fmtDateCourte(d.echeance)})</option>`).join("");
    if (devoirId && ouverts.some((d) => d.id === devoirId)) selDevoir.value = devoirId;
  }

  if (selEleve) {
    selEleve.innerHTML =
      `<option value="">— Choisir mon nom —</option>` +
      [...ELEVES]
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
        .map((e) => `<option value="${e.id}">${esc(e.nom)} — ${esc(nomClasse(e.classe))}</option>`)
        .join("");
  }

  const zone = $("#depot-confirmation");
  const btnGen = $("#btn-generer");

  function construireTexte() {
    const d = getDevoir(selDevoir.value);
    const e = getEleve(selEleve.value);
    const lien = $("#depot-lien")?.value.trim() || "";
    const commentaire = $("#depot-commentaire")?.value.trim() || "";

    if (!d || !e) return null;

    const corps =
      `Bonjour ${CFG.prof || "Monsieur"},\n\n` +
      `Je vous dépose mon travail pour le devoir suivant :\n\n` +
      `• Élève : ${e.nom} (${nomClasse(e.classe)})\n` +
      `• Devoir : ${d.titre}\n` +
      `• Échéance : ${fmtDate(d.echeance)}\n` +
      (lien ? `• Lien vers mon travail : ${lien}\n` : "") +
      (commentaire ? `• Commentaire : ${commentaire}\n` : "") +
      `\nCordialement,\n${e.nom}`;

    const sujet = `[${nomClasse(e.classe)}] Dépôt de devoir — ${d.titre} — ${e.nom}`;
    return { d, e, lien, commentaire, corps, sujet };
  }

  btnGen?.addEventListener("click", () => {
    const info = construireTexte();
    if (!zone) return;
    if (!info) {
      zone.classList.remove("hidden");
      zone.innerHTML = `<div class="callout callout-warning">${ICONS.alert}<div>Merci de choisir <strong>un devoir</strong> et <strong>votre nom</strong> avant de générer le dépôt.</div></div>`;
      return;
    }
    zone.classList.remove("hidden");
    zone.innerHTML = `
      <div class="callout callout-success">${ICONS.check}<div><strong>Récapitulatif prêt !</strong> Copiez le texte ci-dessous ou envoyez-le directement par e-mail.</div></div>
      <div class="code-block" id="depot-texte">${esc(info.corps)}</div>
      <div class="copy-row">
        <button class="btn btn-outline btn-sm" id="btn-copier-2">${ICONS.copy} Copier le texte</button>
        <a class="btn btn-primary btn-sm" id="btn-mail-2" href="#">${ICONS.upload} Envoyer par e-mail</a>
        <span class="copy-feedback" id="copie-feedback">Copié ✓</span>
      </div>
      <p class="text-muted mt-2" style="font-size:.88rem">💡 Astuce : si vous déposez un fichier (PDF, .zip…), hébergez-le d'abord sur Google Drive (ou équivalent), puis collez le lien de partage dans le champ « Lien vers mon travail ».</p>`;

    const mailto = `mailto:${encodeURIComponent(CFG.email || "")}?subject=${encodeURIComponent(info.sujet)}&body=${encodeURIComponent(info.corps)}`;
    $("#btn-mail-2")?.setAttribute("href", mailto);

    $("#btn-copier-2")?.addEventListener("click", () => copierTexte(info.corps));
  });
}

function copierTexte(texte, feedbackEl) {
  const done = () => {
    const f = feedbackEl || $("#copie-feedback");
    if (f) {
      f.classList.add("show");
      setTimeout(() => f.classList.remove("show"), 2200);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texte).then(done).catch(() => fallbackCopie(texte, done));
  } else {
    fallbackCopie(texte, done);
  }
}

function fallbackCopie(texte, done) {
  const ta = document.createElement("textarea");
  ta.value = texte;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) { /* ignoré */ }
  ta.remove();
  done();
}

/* ---------- Page Suivi ---------- */
function renderSuivi() {
  const zoneLogin = $("#suivi-login");
  const zoneProfil = $("#suivi-profil");
  const codeInput = $("#suivi-code");
  const btnValider = $("#btn-valider-code");
  const erreur = $("#suivi-erreur");

  function afficher(eleveId) {
    const eleve = getEleve(eleveId);
    if (!eleve) return;

    localStorage.setItem("suivi_eleve", eleveId);
    zoneLogin.classList.add("hidden");
    zoneProfil.classList.remove("hidden");

    const devoirs = trierDevoirs(DEVOIRS.filter((d) => d.classe === eleve.classe));
    const moy = moyenneEleve(eleveId);
    const nbNotes = NOTES.filter((n) => n.eleve === eleveId).length;
    const nbRendus = RENDUS.filter((r) => r.eleve === eleveId).length;
    const total = devoirs.length || 1;
    const pctRendus = Math.round((nbRendus / total) * 100);
    const pctNotes = Math.round((nbNotes / total) * 100);

    $("#suivi-nom").textContent = eleve.nom;
    $("#suivi-classe").textContent = nomClasse(eleve.classe);

    /* Progression */
    const prog = $("#suivi-progression");
    if (prog) {
      prog.innerHTML = `
        <div class="mb-3 progress-block">
          <p style="font-weight:700; margin-bottom:.55rem">📥 Devoirs rendus</p>
          <div class="progress"><div class="progress-fill" style="width:0%" data-width="${pctRendus}%"></div></div>
          <div class="progress-legend"><span>${nbRendus} sur ${devoirs.length} devoirs</span><span>${pctRendus}%</span></div>
        </div>
        <div class="progress-block">
          <p style="font-weight:700; margin-bottom:.55rem">🎯 Devoirs notés</p>
          <div class="progress"><div class="progress-fill" style="width:0%" data-width="${pctNotes}%; background: var(--grad-2)"></div></div>
          <div class="progress-legend"><span>${nbNotes} notes reçues</span><span>${pctNotes}%</span></div>
        </div>`;
      requestAnimationFrame(() => {
        $$(".progress-fill", prog).forEach((el) => {
          el.style.width = el.dataset.width.split("%")[0] + "%";
        });
      });
    }

    /* Statistiques */
    const resume = $("#suivi-resume");
    resume.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon blue">${ICONS.book}</div>
        <div><div class="num">${devoirs.length}</div><div class="label">devoirs de la classe</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber">${ICONS.upload}</div>
        <div><div class="num">${nbRendus}</div><div class="label">devoirs rendus</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">${ICONS.award}</div>
        <div><div class="num">${nbNotes}</div><div class="label">notes reçues</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rose">${ICONS.star}</div>
        <div>
          <div class="num moyenne-big"><span class="val ${moy !== null ? classeNoteCls(moy) : ""}">${moy !== null ? fmtNote(moy) : "—"}</span><span class="sur">/ 20</span></div>
          <div class="label">moyenne générale</div>
        </div>
      </div>`;

    /* Graphique des notes */
    const chart = $("#suivi-graphique");
    if (chart) {
      const avecNotes = NOTES.filter((n) => n.eleve === eleveId)
        .map((n) => ({ ...n, devoirInfo: getDevoir(n.devoir) }))
        .filter((n) => n.devoirInfo)
        .sort((a, b) => parseDate(a.date) - parseDate(b.date));

      chart.innerHTML = avecNotes.length
        ? `<div class="chart-box reveal">
            <h3 class="card-title">📈 Mes notes dans le temps</h3>
            <p class="text-muted" style="margin-bottom:1.5rem">Chaque barre représente une note ramenée sur 20.</p>
            <div class="chart-bars">
              ${avecNotes
                .map((n) => {
                  const val = (n.note / n.sur) * 20;
                  return `
                  <div class="chart-col">
                    <div class="chart-bar" style="height:0%" data-height="${Math.max(6, (val / 20) * 100)}%">
                      <span class="val">${fmtNote(val)}</span>
                    </div>
                    <div class="chart-label">${esc(n.devoirInfo.titre)}</div>
                  </div>`;
                })
                .join("")}
            </div>
          </div>`
        : `<div class="empty">${ICONS.star}<p>Votre graphique de notes apparaîtra dès la première note.</p></div>`;
      requestAnimationFrame(() => {
        $$(".chart-bar", chart).forEach((el) => {
          el.style.height = el.dataset.height;
        });
      });
    }

    /* Tableau de suivi */
    const corps = devoirs
      .map((d) => {
        const st = statutEleve(d, eleveId);
        const note = getNote(eleveId, d.id);
        const noteTxt = note
          ? `<span class="note-value ${classeNoteCls((note.note / note.sur) * 20)}">${fmtNote(note.note)} / ${fmtNote(note.sur)}</span>`
          : '<span class="text-muted">—</span>';
        const app = note && note.appreciation ? esc(note.appreciation) : '<span class="text-muted">—</span>';
        return `<tr>
          <td><strong>${esc(d.titre)}</strong><br/><span class="text-muted" style="font-size:.84rem">${esc(typeLabel(d.type))} · échéance ${fmtDateCourte(d.echeance)}</span></td>
          <td><span class="badge ${st.cls}">${st.label}</span></td>
          <td>${noteTxt}</td>
          <td>${app}</td>
        </tr>`;
      })
      .join("");

    $("#suivi-tableau").innerHTML = devoirs.length
      ? `<div class="table-wrap reveal"><table>
          <thead><tr><th>Devoir</th><th>Statut</th><th>Note</th><th>Appréciation</th></tr></thead>
          <tbody>${corps}</tbody>
        </table></div>`
      : `<div class="empty">${ICONS.inbox}<p>Aucun devoir pour votre classe.</p></div>`;

    /* Relevé de notes imprimable */
    const releve = $("#releve");
    if (releve) {
      const lignes = NOTES.filter((n) => n.eleve === eleveId)
        .map((n) => ({ ...n, devoirInfo: getDevoir(n.devoir) }))
        .filter((n) => n.devoirInfo)
        .sort((a, b) => parseDate(a.date) - parseDate(b.date));
      releve.innerHTML = `
        <div class="releve-head">
          <div>
            <h1>Relevé de notes</h1>
            <p><strong>${esc(eleve.nom)}</strong> — ${esc(nomClasse(eleve.classe))}</p>
            <p>${esc(CFG.matiere || "")} · Année scolaire ${esc(CFG.annee || "")}</p>
          </div>
          <div class="sceau">
            ${esc(CFG.prof || "")}<br/>
            Édité le ${fmtDate(todayISO())}
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Devoir</th><th>Date</th><th>Note</th><th>Appréciation</th></tr>
          </thead>
          <tbody>
            ${lignes
              .map(
                (n) => `<tr>
                <td>${esc(n.devoirInfo.titre)}</td>
                <td>${fmtDate(n.date)}</td>
                <td><strong>${fmtNote(n.note)} / ${fmtNote(n.sur)}</strong></td>
                <td>${esc(n.appreciation || "")}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="moyenne-finale">
          Moyenne générale : ${moy !== null ? fmtNote(moy) : "—"} / 20
        </div>`;
    }

    $("#btn-imprimer")?.addEventListener("click", () => window.print());

    $("#btn-deconnexion")?.addEventListener("click", () => {
      localStorage.removeItem("suivi_eleve");
      location.reload();
    });
  }

  btnValider?.addEventListener("click", () => {
    const code = (codeInput?.value || "").trim().toUpperCase();
    const eleve = ELEVES.find((e) => e.code.toUpperCase() === code);
    if (!eleve) {
      erreur.classList.remove("hidden");
      return;
    }
    erreur.classList.add("hidden");
    afficher(eleve.id);
  });

  codeInput?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") btnValider?.click();
  });

  const connu = localStorage.getItem("suivi_eleve");
  if (connu && getEleve(connu)) afficher(connu);
}

/* ---------- Page Admin ---------- */
function renderAdmin() {
  /* Devoirs */
  const selClasseD = $("#admin-devoir-classe");
  if (selClasseD) {
    selClasseD.innerHTML = Object.entries(CFG.classes || {})
      .map(([cle, nom]) => `<option value="${cle}">${esc(nom)}</option>`)
      .join("");
  }

  /* Notes */
  const selClasseN = $("#admin-note-classe");
  const selEleveN = $("#admin-note-eleve");
  if (selClasseN) {
    selClasseN.innerHTML = Object.entries(CFG.classes || {})
      .map(([cle, nom]) => `<option value="${cle}">${esc(nom)}</option>`)
      .join("");
    function majEleves() {
      const cle = selClasseN.value;
      selEleveN.innerHTML = ELEVES.filter((e) => e.classe === cle)
        .map((e) => `<option value="${e.id}">${esc(e.nom)}</option>`)
        .join("");
    }
    selClasseN.addEventListener("change", majEleves);
    majEleves();
  }

  const selDevoirN = $("#admin-note-devoir");
  if (selDevoirN) {
    selDevoirN.innerHTML = DEVOIRS.map((d) => `<option value="${d.id}">${esc(nomClasse(d.classe))} · ${esc(d.titre)}</option>`).join("");
  }

  /* Rendus */
  const selClasseR = $("#admin-rendu-classe");
  const selEleveR = $("#admin-rendu-eleve");
  if (selClasseR) {
    selClasseR.innerHTML = Object.entries(CFG.classes || {})
      .map(([cle, nom]) => `<option value="${cle}">${esc(nom)}</option>`)
      .join("");
    function majElevesR() {
      const cle = selClasseR.value;
      selEleveR.innerHTML = ELEVES.filter((e) => e.classe === cle)
        .map((e) => `<option value="${e.id}">${esc(e.nom)}</option>`)
        .join("");
    }
    selClasseR.addEventListener("change", majElevesR);
    majElevesR();
  }

  const selDevoirR = $("#admin-rendu-devoir");
  if (selDevoirR) {
    selDevoirR.innerHTML = DEVOIRS.map((d) => `<option value="${d.id}">${esc(nomClasse(d.classe))} · ${esc(d.titre)}</option>`).join("");
  }

  const today = todayISO();
  ["#admin-devoir-ajout", "#admin-note-date", "#admin-rendu-date", "#admin-anonce-date"].forEach((sel) => {
    const el = $(sel);
    if (el) el.value = today;
  });

  function afficherBloc(zoneId, texte) {
    const zone = $(zoneId);
    if (!zone) return;
    zone.classList.remove("hidden");
    zone.querySelector(".code-block").textContent = texte;
    const fb = zone.querySelector(".copy-feedback");
    const btn = zone.querySelector(".btn-copy");
    btn.onclick = () => copierTexte(texte, fb);
  }

  $("#btn-gen-devoir")?.addEventListener("click", () => {
    const titre = $("#admin-devoir-titre").value.trim();
    if (!titre) { alert("Donnez un titre au devoir."); return; }
    const id = "d" + (Math.max(0, ...DEVOIRS.map((d) => Number(String(d.id).replace(/\D/g, "")) || 0)) + 1);
    const bloc = `  {
    id: "${id}",
    titre: ${JSON.stringify(titre)},
    classe: "${$("#admin-devoir-classe").value}",
    type: "interro",
    date_ajout: "${$("#admin-devoir-ajout").value}",
    echeance: "${$("#admin-devoir-echeance").value}",
    description: ${JSON.stringify($("#admin-devoir-desc").value.trim())},
    fichiers: [],
    corrige: false,
    examen: true
  },`;
    afficherBloc("#zone-devoir", bloc);
  });

  $("#btn-gen-note")?.addEventListener("click", () => {
    const eleveId = $("#admin-note-eleve").value;
    const devoirId = $("#admin-note-devoir").value;
    const note = $("#admin-note-valeur").value.trim();
    if (!eleveId || !devoirId || !note) { alert("Élève, devoir et note sont obligatoires."); return; }
    const sur = $("#admin-note-sur").value.trim() || "20";
    const app = $("#admin-note-appreciation").value.trim();
    const bloc = `  { eleve: "${eleveId}", devoir: "${devoirId}", note: ${note.replace(",", ".")}, sur: ${sur}, appreciation: ${JSON.stringify(app)}, date: "${$("#admin-note-date").value}" },`;
    afficherBloc("#zone-note", bloc);
  });

  $("#btn-gen-rendu")?.addEventListener("click", () => {
    const eleveId = $("#admin-rendu-eleve").value;
    const devoirId = $("#admin-rendu-devoir").value;
    if (!eleveId || !devoirId) { alert("Élève et devoir sont obligatoires."); return; }
    const com = $("#admin-rendu-commentaire").value.trim();
    const bloc = `  { eleve: "${eleveId}", devoir: "${devoirId}", date: "${$("#admin-rendu-date").value}", commentaire: ${JSON.stringify(com)} },`;
    afficherBloc("#zone-rendu", bloc);
  });

  $("#btn-gen-anonce")?.addEventListener("click", () => {
    const titre = $("#admin-anonce-titre").value.trim();
    if (!titre) { alert("Donnez un titre à l'annonce."); return; }
    const id = "a" + (Math.max(0, ...ANNONCES.map((a) => Number(String(a.id).replace(/\D/g, "")) || 0)) + 1);
    const important = $("#admin-anonce-importante").checked;
    const bloc = `  {
    id: "${id}",
    titre: ${JSON.stringify(titre)},
    date: "${$("#admin-anonce-date").value}",
    texte: ${JSON.stringify($("#admin-anonce-texte").value.trim())},
    important: ${important}
  },`;
    afficherBloc("#zone-anonce", bloc);
  });

  /* Alertes : échéances en conflit avec le calendrier officiel */
  const alertesEl = $("#admin-alertes");
  if (alertesEl) {
    const majAlertes = () => {
      if (!OFFICIEL) {
        alertesEl.innerHTML = `<div class="callout callout-warning">${ICONS.alert}<div>Calendrier officiel indisponible : impossible de vérifier les dates.</div></div>`;
        return;
      }
      const conflits = conflitsDates();
      if (!conflits.length) {
        alertesEl.innerHTML = `
          <div class="callout callout-success">${ICONS.check}<div><strong>Aucun conflit détecté</strong> : toutes les échéances à venir sont compatibles avec le calendrier officiel (vacances, jours fériés, semaines bloquées et épreuves DC/DS).</div></div>
          <p class="text-muted mt-1" style="font-size:.85rem">${sourceOfficielHTML()}</p>`;
        return;
      }
      alertesEl.innerHTML =
        conflits
          .map(({ devoir: d, raisons }) => {
            const suggestion = prochainJourCours(d.classe, d.echeance);
            return `
          <div class="callout callout-warning mb-1">${ICONS.alert}<div>
            <strong>${esc(d.titre)}</strong> (${esc(nomClasse(d.classe))}) — échéance le ${fmtDate(d.echeance)}<br/>
            ⚠️ ${raisons.map((r) => esc(r)).join(" · ")}
            ${suggestion ? `<br/>💡 Prochain jour de cours possible : <strong>${fmtDate(suggestion)}</strong>` : ""}
          </div></div>`;
          })
          .join("") +
        `<p class="text-muted mt-1" style="font-size:.85rem">${sourceOfficielHTML()} · Modifiez la date dans <code>data/devoirs.js</code> si besoin.</p>`;
    };
    majAlertes();
    quandOfficielPret(majAlertes);
  }

  /* Calendrier de choix de date (calendrier officiel) */
  const zoneChoix = $("#calendrier-choix");
  if (zoneChoix) creerCalendrierChoix(zoneChoix);

  $$(".lien-edition").forEach((a) => {
    const repo = a.dataset.repo || "aymenessouyah/devoirs2026-2027";
    a.href = `https://github.com/${repo}/edit/main/data/${a.dataset.fichier}`;
  });
}

/* ---------- Démarrage ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  /* Réorganisation v4 : la page d'accueil EST la page de connexion ;
     toutes les autres pages sont réservées aux comptes connectés
     (la validation par l'admin est vérifiée dans les espaces). */
  const PAGES_PUBLIQUES = ["connexion"];
  if (!PAGES_PUBLIQUES.includes(page) && !(typeof sbConnecte === "function" && sbConnecte())) {
    location.replace("index.html");
    return;
  }

  injectLayout();
  switch (page) {
    case "accueil": renderAccueil(); break;
    case "devoirs": renderDevoirs(); break;
    case "classe": renderClasse(); break;
    case "calendrier": renderCalendrier(); break;
    case "vie": renderVie(); break;
    case "depot": renderDepot(); break;
    case "suivi": renderSuivi(); break;
    case "admin": renderAdmin(); break;
  }

  initReveal();

  /* Service worker (PWA installable + fonctionnement hors-ligne) */
  if ("serviceWorker" in navigator) {
    const avaitControleur = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" })
        .then((inscription) => inscription.update())
        .catch(() => { /* ignoré */ });
    /* Une nouvelle version du site prend le contrôle : on recharge la
       page une seule fois pour l'afficher immédiatement (fini les
       anciennes versions servies par le cache). */
    if (avaitControleur) {
      let dejaRecharge = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!dejaRecharge) { dejaRecharge = true; location.reload(); }
      });
    }
  }
});

/* Filet de sécurité : si le serveur propose une version plus récente que
   ce code-ci, on nettoie caches et Service Worker puis on recharge. */
window.__VERSION_ATTENDUE = 22; /* numéro du cache de sw.js correspondant */
setTimeout(async () => {
  try {
    if (sessionStorage.getItem("maj-verifiee")) return;
    sessionStorage.setItem("maj-verifiee", "1");
    const rep = await fetch("sw.js?controle=" + Date.now(), { cache: "no-store" });
    const txt = await rep.text();
    const m = txt.match(/devoirs-v(\d+)/);
    if (m && parseInt(m[1], 10) > window.__VERSION_ATTENDUE) {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches) {
        const cles = await caches.keys();
        await Promise.all(cles.map((k) => caches.delete(k)));
      }
      location.reload();
    }
  } catch (e) { /* silencieux : ne jamais gêner la navigation */ }
}, 1200);

/* Applique le thème le plus tôt possible (anti-flash) */
initTheme();
