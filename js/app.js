/* ============================================================
   3SI1 & 4SI2 — Devoirs · Logique du site
   (aucune dépendance externe — JavaScript pur)
   ============================================================ */

/* ---------- Petites utilitaires ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

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

/* Statut « public » d'un devoir */
function statutDevoir(d) {
  if (d.corrige) return { key: "corrigé", label: "Corrigé", cls: "badge-corrigé" };
  if (joursRestants(d.echeance) < 0) return { key: "attente", label: "En attente de correction", cls: "badge-attente" };
  return { key: "afaire", label: "À faire", cls: "badge-afaire" };
}

/* Statut personnalisé pour un élève */
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
  award: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>'
};

/* ---------- Mise en page commune (en-tête + pied de page) ---------- */
function injectLayout() {
  const page = document.body.dataset.page || "";
  const titre = CFG.titre || "Devoirs";
  const sous = CFG.sousTitre || "";

  const liens = [
    { key: "accueil", href: "index.html", label: "Accueil" },
    { key: "devoirs", href: "devoirs.html", label: "Devoirs" },
    { key: "classe-3si1", href: "classe-3si1.html", label: "3ème SI 1" },
    { key: "classe-4si2", href: "classe-4si2.html", label: "4ème SI 2" },
    { key: "depot", href: "depot.html", label: "Déposer" },
    { key: "suivi", href: "suivi.html", label: "Mon suivi" },
    { key: "admin", href: "admin.html", label: "Admin" }
  ];

  const nav = liens
    .map((l) => `<a href="${l.href}"${page === l.key ? ' class="active" aria-current="page"' : ""}>${l.label}</a>`)
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
          <a href="devoirs.html">Devoirs</a>
          <a href="depot.html">Déposer un devoir</a>
          <a href="suivi.html">Mon suivi</a>
          <a href="admin.html">Espace enseignant</a>
        </div>
        <div class="muted">Publié avec GitHub Pages</div>
      </div>
    </footer>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  const toggle = $("#nav-toggle");
  const navEl = $("#main-nav");
  if (toggle && navEl) {
    toggle.addEventListener("click", () => {
      const ouvert = navEl.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(ouvert));
    });
  }

  const h1 = $("title");
  if (h1 && CFG.titre) document.title = document.title || `${titre}`;
}

/* ---------- Composant : carte de devoir ---------- */
function carteDevoirHTML(d, opts = {}) {
  const st = opts.statut || statutDevoir(d);
  const eleveId = opts.eleveId;
  const note = eleveId ? getNote(eleveId, d.id) : null;
  const classeNom = nomClasse(d.classe);
  const j = joursRestants(d.echeance);

  let bandeauNote = "";
  if (note) {
    const val = (note.note / note.sur) * 20;
    bandeauNote = `
      <div class="pill" style="border-color:#bbf7d0;background:#f0fdf4;color:#166534">
        ${ICONS.award} Ma note : <strong>&nbsp;${fmtNote(note.note)}/${fmtNote(note.sur)}</strong>
      </div>`;
  }

  return `
    <article class="devoir-card">
      <div class="devoir-top">
        <div>
          <span class="devoir-type">${TYPE_ICONS[d.type] || "📄"} ${esc(typeLabel(d.type))}</span>
          <h3 class="mt-1">${esc(d.titre)}</h3>
        </div>
        <span class="badge ${st.cls}">${st.label}</span>
      </div>
      <p class="devoir-desc">${esc(d.description)}</p>
      ${bandeauNote}
      <div class="devoir-meta">
        <span class="item">${ICONS.users} ${esc(classeNom)}</span>
        <span class="item">${ICONS.calendar} Échéance : ${fmtDate(d.echeance)} <em style="font-style:normal;opacity:.75">(${echeanceTexte(d.echeance)})</em></span>
        <span class="item">${ICONS.clock} Publié le ${fmtDateCourte(d.date_ajout)}</span>
      </div>
      <div class="devoir-actions">
        <a class="btn btn-primary btn-sm" href="depot.html?devoir=${encodeURIComponent(d.id)}">${ICONS.upload} Déposer ce devoir</a>
        <a class="btn btn-ghost btn-sm" href="suivi.html">Voir mon suivi</a>
      </div>
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

/* ============================================================
   PAGES
   ============================================================ */

/* ---------- Accueil ---------- */
function renderAccueil() {
  const afaire = DEVOIRS.filter((d) => statutDevoir(d).key === "afaire");
  const corriges = DEVOIRS.filter((d) => d.corrige);
  const prochain = trierDevoirs(afaire)[0];
  const derniers = trierDevoirs(DEVOIRS).slice(0, 6);

  $("#stats")?.replaceChildren();
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
      ? `<div class="callout callout-info">
           ${ICONS.clock}
           <div>
             <strong>Prochaine échéance : ${esc(prochain.titre)}</strong> — ${nomClasse(prochain.classe)}<br/>
             ${fmtDate(prochain.echeance)} <em style="font-style:normal;opacity:.8">(${echeanceTexte(prochain.echeance)})</em>
           </div>
         </div>`
      : "";
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
          <a class="class-tile" href="classe-${cle}.html">
            <span class="cl-badge">${esc(cle.toUpperCase())}</span>
            <h3>${esc(nom)}</h3>
            <p>${nbEleves} élèves · ${nb} devoir${nb > 1 ? "s" : ""} en ligne</p>
          </a>`;
      })
      .join("");
  }
}

/* ---------- Page Devoirs (filtres) ---------- */
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

  /* Planning : prochaines échéances */
  const planning = $("#classe-planning");
  if (planning) {
    const aVenir = devoirs.filter((d) => joursRestants(d.echeance) >= 0 && !d.corrige);
    planning.innerHTML = aVenir.length
      ? `<div class="table-wrap"><table>
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

  /* Moyennes de classe par devoir corrigé */
  const moyennes = $("#classe-moyennes");
  if (moyennes) {
    const avecNotes = devoirs.filter((d) => notesDuDevoir(d.id).length > 0);
    moyennes.innerHTML = avecNotes.length
      ? `<div class="table-wrap"><table>
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
}

/* ---------- Page Dépôt ---------- */
function renderDepot() {
  const selDevoir = $("#depot-devoir");
  const selEleve = $("#depot-eleve");
  const params = new URLSearchParams(location.search);
  const devoirId = params.get("devoir");

  if (selDevoir) {
    const ouverts = trierDevoirs(DEVOIRS.filter((d) => !d.corrige));
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
  const btnCopy = $("#btn-copier");
  const btnMail = $("#btn-mail");

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

    $("#btn-copier-2")?.addEventListener("click", () => {
      copierTexte(info.corps);
    });
  });

  btnCopy?.addEventListener("click", () => {
    const info = construireTexte();
    if (info) copierTexte(info.corps);
  });

  btnMail?.addEventListener("click", (ev) => {
    const info = construireTexte();
    if (!info) {
      ev.preventDefault();
      alert("Merci de choisir un devoir et votre nom avant d'envoyer.");
      return;
    }
    const mailto = `mailto:${encodeURIComponent(CFG.email || "")}?subject=${encodeURIComponent(info.sujet)}&body=${encodeURIComponent(info.corps)}`;
    ev.target.setAttribute("href", mailto);
    setTimeout(() => { window.location.href = mailto; }, 50);
    ev.preventDefault();
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

    $("#suivi-nom").textContent = eleve.nom;
    $("#suivi-classe").textContent = nomClasse(eleve.classe);

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
        <div class="stat-icon purple">${ICONS.star}</div>
        <div>
          <div class="num moyenne-big"><span class="val ${moy !== null ? classeNoteCls(moy) : ""}">${moy !== null ? fmtNote(moy) : "—"}</span><span class="sur">/ 20</span></div>
          <div class="label">moyenne générale</div>
        </div>
      </div>`;

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
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Devoir</th><th>Statut</th><th>Note</th><th>Appréciation</th></tr></thead>
          <tbody>${corps}</tbody>
        </table></div>`
      : `<div class="empty">${ICONS.inbox}<p>Aucun devoir pour votre classe.</p></div>`;

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

  /* Session existante ? */
  const connu = localStorage.getItem("suivi_eleve");
  if (connu && getEleve(connu)) afficher(connu);
}

/* ---------- Page Admin (générateurs de code) ---------- */
function renderAdmin() {
  /* Remplissage des listes déroulantes */
  const selClasseD = $("#admin-devoir-classe");
  if (selClasseD) {
    selClasseD.innerHTML = Object.entries(CFG.classes || {})
      .map(([cle, nom]) => `<option value="${cle}">${esc(nom)}</option>`)
      .join("");
  }

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

  /* Date du jour par défaut */
  const today = todayISO();
  ["#admin-devoir-ajout", "#admin-note-date", "#admin-rendu-date"].forEach((sel) => {
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

  /* Générateur : devoir */
  $("#btn-gen-devoir")?.addEventListener("click", () => {
    const titre = $("#admin-devoir-titre").value.trim();
    if (!titre) { alert("Donnez un titre au devoir."); return; }
    const id = "d" + (Math.max(0, ...DEVOIRS.map((d) => Number(String(d.id).replace(/\D/g, "")) || 0)) + 1);
    const bloc = `  {
    id: "${id}",
    titre: ${JSON.stringify(titre)},
    classe: "${$("#admin-devoir-classe").value}",
    type: "${$("#admin-devoir-type").value}",
    date_ajout: "${$("#admin-devoir-ajout").value}",
    echeance: "${$("#admin-devoir-echeance").value}",
    description: ${JSON.stringify($("#admin-devoir-desc").value.trim())},
    fichiers: [],
    corrige: false
  },`;
    afficherBloc("#zone-devoir", bloc);
  });

  /* Générateur : note */
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

  /* Générateur : rendu */
  $("#btn-gen-rendu")?.addEventListener("click", () => {
    const eleveId = $("#admin-rendu-eleve").value;
    const devoirId = $("#admin-rendu-devoir").value;
    if (!eleveId || !devoirId) { alert("Élève et devoir sont obligatoires."); return; }
    const com = $("#admin-rendu-commentaire").value.trim();
    const bloc = `  { eleve: "${eleveId}", devoir: "${devoirId}", date: "${$("#admin-rendu-date").value}", commentaire: ${JSON.stringify(com)} },`;
    afficherBloc("#zone-rendu", bloc);
  });

  /* Liens d'édition GitHub */
  $$(".lien-edition").forEach((a) => {
    const repo = a.dataset.repo || "aymenessouyah/devoirs2026-2027";
    a.href = `https://github.com/${repo}/edit/main/data/${a.dataset.fichier}`;
  });
}

/* ---------- Démarrage ---------- */
document.addEventListener("DOMContentLoaded", () => {
  injectLayout();

  const page = document.body.dataset.page;
  switch (page) {
    case "accueil": renderAccueil(); break;
    case "devoirs": renderDevoirs(); break;
    case "classe": renderClasse(); break;
    case "depot": renderDepot(); break;
    case "suivi": renderSuivi(); break;
    case "admin": renderAdmin(); break;
  }
});
