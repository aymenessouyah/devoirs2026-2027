/* ============================================================
   Espaces connectés (v4 — Supabase) :
   • page d'accueil = connexion / inscription (e-mail + mot de
     passe, choix du type : enseignant ou élève) ;
   • chaque compte attend la validation de l'admin du site
     (aymenessouyah@gmail.com, validé automatiquement) ;
   • enseignant validé : devoirs en base (date choisie au
     calendrier officiel, sujet, correction), élèves de ses
     classes, notes et observations ;
   • élève validé : dates des devoirs tout de suite, sujet et
     correction à partir du lendemain de l'épreuve (J+1),
     ses notes et les remarques de l'enseignant.
   ============================================================ */

function espaceMessage(zoneId, type, texte) {
  const zone = $(zoneId);
  if (!zone) return;
  const cls = type === "erreur" ? "callout-warning" : type === "succes" ? "callout-success" : "callout-info";
  const icone = type === "erreur" ? ICONS.alert : type === "succes" ? ICONS.check : ICONS.info;
  zone.innerHTML = `<div class="callout ${cls}">${icone}<div>${texte}</div></div>`;
}

/* Ancien système : le code élève est vérifié dans l'annuaire en base,
   repli sur le fichier data/eleves.js (comptes créés avant la v4). */
async function trouverElevePourInscription(code) {
  const CODE = String(code || "").trim().toUpperCase();
  try {
    const rows = await sbSelect("eleves", `select=*&code=eq.${encodeURIComponent(CODE)}`);
    if (rows && rows.length) return { nom: rows[0].nom, classe: rows[0].classe, code: rows[0].code };
  } catch (e) { /* repli sur les fichiers */ }
  const fiche = ELEVES.find((e) => String(e.code).toUpperCase() === CODE);
  return fiche ? { nom: fiche.nom, classe: fiche.classe, code: fiche.code } : null;
}

function dateHeureFr(isoVal) {
  try {
    return new Date(isoVal).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return esc(isoVal);
  }
}

/* ---------- Constantes et petits utilitaires v4 ---------- */
const MATIERES = (window.CONFIG && window.CONFIG.matieres) || ["STI"];
const CLASSES_CLES = Object.keys((window.CONFIG && window.CONFIG.classes) || {});

/* ---------- Classes : déterminées par l'admin (table « classes ») ---------- */
/* La liste réelle vit dans la base (interface ⭐ Administration) ; repli
   sur data/config.js tant que la table est vide ou injoignable. */
let CLASSES_DYN = [];

function listeClasses() {
  if (CLASSES_DYN.length) return CLASSES_DYN;
  return CLASSES_CLES.map((cle) => ({ cle, nom: (CFG.classes || {})[cle] || cle }));
}

function nomClasseDyn(cle) {
  const c = listeClasses().find((x) => x.cle === cle);
  return c ? c.nom : ((CFG.classes || {})[cle] || cle);
}

async function chargerClassesDynamiques() {
  try {
    const rows = await sbSelect("classes", "select=*&order=nom.asc");
    if (rows && rows.length) CLASSES_DYN = rows.map((r) => ({ cle: r.id, nom: r.nom }));
  } catch (e) { /* table absente : repli sur la configuration */ }
  return listeClasses();
}

function slugClasse(nom) {
  return String(nom || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24);
}

/* Recharge les listes déroulantes de classes une fois la base répondue */
function rafraichirSelectsClasses(racine) {
  $$("select.select-classes", racine || document).forEach((sel) => {
    const v = sel.value;
    sel.innerHTML = optionsClassesHTML(v);
  });
}

/* Statut d'un profil ; les profils créés avant la v4 n'ont pas de
   colonne statut : ils sont considérés comme acceptés. */
function statutProfil(p) {
  return (p && p.statut) || "accepte";
}

/* Règle J+1 : le sujet (et la correction) d'un devoir ne sont visibles
   que le LENDEMAIN de l'épreuve. */
function contenuVisibleLe(dateISO, aujourdHui) {
  return (aujourdHui || todayISO()) > dateISO;
}

function datePlusUn(iso) {
  const d = parseDate(iso);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function typeDepuisTitre(titre) {
  return /synth/i.test(titre || "") ? "DS" : "DC";
}

function typeLibelle(type) {
  return type === "DS" ? "Devoir de synthèse" : "Devoir de contrôle";
}

function badgeTypeHTML(type) {
  return type === "DS"
    ? `<span class="pill" style="border-color:var(--rose);background:var(--soft-rose);color:var(--rose)">📝 DS · Synthèse</span>`
    : `<span class="pill" style="border-color:var(--violet);background:var(--soft-violet);color:var(--violet)">📝 DC · Contrôle</span>`;
}

/* Forme commune des devoirs, qu'ils viennent de la base ou du fichier */
function normaliserDevoirDB(l) {
  return {
    id: l.id, source: "base", titre: l.titre, classe: l.classe,
    matiere: l.matiere || "", type: l.type || "DC", date: l.date,
    sujet: l.sujet || "", correction: l.correction || "",
    bareme: Number(l.bareme || 20),
    enseignant_id: l.enseignant_id || null, enseignant_nom: l.enseignant_nom || ""
  };
}

function normaliserDevoirFichier(d) {
  return {
    id: d.id, source: "fichier", titre: d.titre, classe: d.classe,
    matiere: CFG.matiere || "STI", type: typeDepuisTitre(d.titre), date: d.echeance,
    sujet: d.description || "", correction: "",
    bareme: 20, enseignant_id: null, enseignant_nom: CFG.prof || ""
  };
}

/* Les matières d'un enseignant : 1 ou 2, choisies dans son espace */
function sesMatieres(profil) {
  return [profil && profil.matiere, profil && profil.matiere_2]
    .filter((m) => m && String(m).trim())
    .filter((m, i, arr) => arr.indexOf(m) === i);
}

/* Trimestre scolaire d'une date (bornes dans data/config.js) */
function trimestreDe(dateISO) {
  return ((CFG && CFG.trimestres) || []).find((t) => dateISO >= t.debut && dateISO <= t.fin) || null;
}

/* Règle du site : 2 devoirs de contrôle + 1 devoir de synthèse par
   trimestre, par classe et par matière. Compte les devoirs en base de
   l'enseignant + les épreuves du fichier (hors doublons déjà importés). */
function etatQuota(mesDevoirsDB, classe, matiere, type, dateISO, ignoreId) {
  const max = type === "DS" ? 1 : 2;
  const tr = trimestreDe(dateISO);
  if (!tr) return { trimestre: null, nb: 0, max, ok: true };
  const memeTrimestre = (d) => {
    const t = trimestreDe(d.date);
    return t && t.id === tr.id;
  };
  const clesDB = new Set(mesDevoirsDB.map((d) => `${d.titre}|${d.date}`));
  let nb = mesDevoirsDB.filter((d) =>
    d.id !== ignoreId && d.classe === classe && d.type === type &&
    (!matiere || !d.matiere || d.matiere === matiere) && memeTrimestre(d)).length;
  nb += DEVOIRS.filter((d) => d.examen && d.classe === classe)
    .map(normaliserDevoirFichier)
    .filter((d) =>
      !clesDB.has(`${d.titre}|${d.date}`) && d.type === type &&
      (!matiere || d.matiere === matiere) && memeTrimestre(d)).length;
  return { trimestre: tr, nb, max, ok: nb < max };
}

function optionsClassesHTML(selection) {
  return listeClasses().map((c) => `<option value="${esc(c.cle)}" ${c.cle === selection ? "selected" : ""}>${esc(c.nom)}</option>`).join("");
}

function optionsMatieresHTML(selection) {
  return MATIERES.map((m) => `<option value="${esc(m)}" ${m === selection ? "selected" : ""}>${esc(m)}</option>`).join("");
}

/* ---------- Garde d'accès commun ---------- */
async function accesEspace(roleAttendu) {
  const contenu = $("#espace-contenu");
  const session = await sbSessionValide();
  if (!session) {
    location.href = "index.html";
    return null;
  }
  let profil = null;
  try {
    profil = await sbAssurerProfil();
  } catch (e) {
    if (contenu) {
      contenu.innerHTML = `
        <div class="callout callout-warning">${ICONS.alert}<div>
          <strong>La base de données n'est pas encore installée (ou pas à jour).</strong><br/>
          ${esc(e.message)}<br/>
          L'administrateur doit exécuter le script <code>supabase/schema.sql</code> dans Supabase
          (voir le guide de mise en place).
        </div></div>`;
    }
    return null;
  }
  if (!profil) {
    /* Compte de connexion existant, mais pas encore de profil sur ce site */
    if (contenu) {
      contenu.innerHTML = `
        <div class="card">
          <h2 class="card-title">👋 Bienvenue ! Dernière étape : votre profil</h2>
          <p class="text-muted">Votre compte de connexion existe déjà, mais pas encore votre profil sur ce site.
          Choisissez votre type de compte : il sera ensuite <strong>validé par l'administrateur</strong> du site.</p>
          <div class="form-grid mt-2">
            <div class="field full">
              <label for="profil-nom">Nom affiché</label>
              <input type="text" id="profil-nom" placeholder="Ex. : Prénom NOM" />
            </div>
            <div class="field">
              <label for="profil-role">Je suis…</label>
              <select id="profil-role">
                <option value="eleve">👨‍🎓 Élève</option>
                <option value="enseignant">🧑‍🏫 Enseignant</option>
              </select>
            </div>
            <div class="field" id="profil-zone-classe">
              <label for="profil-classe">Ma classe (élèves)</label>
              <select id="profil-classe" class="select-classes">${optionsClassesHTML(CLASSES_CLES[0])}</select>
            </div>
            <div class="field full">
              <label for="profil-matiere">Matière</label>
              <select id="profil-matiere">${optionsMatieresHTML(MATIERES[0])}</select>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" id="btn-creer-profil">Envoyer ma demande</button>
            <button class="btn btn-ghost" id="btn-deco">Se déconnecter</button>
          </div>
          <div id="profil-msg" class="mt-2"></div>
        </div>`;
      const majRole = () => {
        const estEleve = $("#profil-role").value === "eleve";
        $("#profil-zone-classe")?.classList.toggle("hidden", !estEleve);
      };
      $("#profil-role")?.addEventListener("change", majRole);
      majRole();
      chargerClassesDynamiques().then(() => rafraichirSelectsClasses(contenu));
      $("#btn-deco")?.addEventListener("click", async () => { await sbDeconnexion(); location.href = "index.html"; });
      $("#btn-creer-profil")?.addEventListener("click", async () => {
        const nom = $("#profil-nom").value.trim();
        if (!nom) { espaceMessage("#profil-msg", "erreur", "Indiquez votre nom."); return; }
        try {
          const role = $("#profil-role").value;
          await sbCreerProfil({
            id: session.user.id, role, nom,
            classe: role === "eleve" ? $("#profil-classe").value : null,
            matiere: $("#profil-matiere").value,
            code: null, email: session.user.email, statut: "en_attente"
          });
          location.reload();
        } catch (err) {
          espaceMessage("#profil-msg", "erreur", esc(err.message));
        }
      });
    }
    return null;
  }

  const st = statutProfil(profil);
  if (st !== "accepte") {
    if (contenu) contenu.innerHTML = ecranAttenteHTML(profil, session.user.email, st);
    brancherDeconnexion();
    return null;
  }
  if (roleAttendu === "eleve" && profil.role === "enseignant") {
    location.href = "espace-enseignant.html";
    return null;
  }
  if (roleAttendu === "enseignant" && profil.role !== "enseignant") {
    if (contenu) {
      contenu.innerHTML = `
        <div class="callout callout-warning">${ICONS.lock}<div>
          <strong>Ceci est un compte élève.</strong><br/>
          Le compte « ${esc(profil.nom)} » n'a pas le rôle enseignant.
          Si vous êtes enseignant, l'administrateur du site (${esc(SB_ADMIN_EMAIL)})
          peut changer le rôle de votre compte depuis son tableau de bord.
        </div></div>
        <div class="form-actions">
          <a class="btn btn-primary" href="espace-eleve.html">Aller à mon espace élève</a>
          <button class="btn btn-outline" id="btn-deconnexion">Se déconnecter</button>
        </div>`;
      brancherDeconnexion();
    }
    return null;
  }
  return { session, profil };
}

function ecranAttenteHTML(profil, email, st) {
  const refuse = st === "refuse";
  return `
    <div class="card" style="max-width:640px;margin:2rem auto;text-align:center">
      <div style="font-size:3rem">${refuse ? "❌" : "⏳"}</div>
      <h2 class="card-title" style="justify-content:center">${refuse ? "Compte refusé" : "Compte en attente de validation"}</h2>
      <p class="text-muted">
        ${refuse
          ? `Votre demande d'inscription a été refusée par l'administrateur du site. Si vous pensez qu'il s'agit d'une erreur, contactez-le : <strong>${esc(SB_ADMIN_EMAIL)}</strong>.`
          : `Votre demande a bien été envoyée à l'administrateur du site (<strong>${esc(SB_ADMIN_EMAIL)}</strong>).
             Vous pourrez vous connecter dès qu'il l'aura acceptée — réessayez un peu plus tard.`}
      </p>
      <div class="table-wrap mt-2"><table class="table">
        <tbody>
          <tr><td><strong>Nom</strong></td><td>${esc(profil.nom)}</td></tr>
          <tr><td><strong>Type de compte</strong></td><td>${profil.role === "enseignant" ? "🧑‍🏫 Enseignant" : "👨‍🎓 Élève"}</td></tr>
          ${profil.classe ? `<tr><td><strong>Classe</strong></td><td>${esc(nomClasseDyn(profil.classe))}</td></tr>` : ""}
          ${profil.matiere ? `<tr><td><strong>Matière</strong></td><td>${esc(profil.matiere)}</td></tr>` : ""}
          <tr><td><strong>E-mail</strong></td><td>${esc(email || profil.email || "")}</td></tr>
        </tbody></table></div>
      <div class="form-actions" style="justify-content:center">
        <button class="btn btn-outline" id="btn-deconnexion">Se déconnecter</button>
      </div>
    </div>`;
}

function enteteEspaceHTML(profil, titre, email) {
  return `
    <div class="section-head">
      <div>
        <h2>${titre}</h2>
        <p>${profil.role === "enseignant" ? "🧑‍🏫" : "👨‍🎓"} <strong>${esc(profil.nom)}</strong>
        ${profil.classe ? `· ${esc(nomClasseDyn(profil.classe))}` : ""}${profil.matiere ? ` · 📚 ${esc(profil.matiere)}` : ""}${profil.code ? ` · code ${esc(profil.code)}` : ""}${sbEstAdminEmail(email) ? ` · <span class="badge badge-note">⭐ Admin du site</span>` : ""}</p>
      </div>
      <button class="btn btn-outline btn-sm" id="btn-deconnexion">Se déconnecter</button>
    </div>`;
}

function brancherDeconnexion() {
  $("#btn-deconnexion")?.addEventListener("click", async () => {
    await sbDeconnexion();
    location.href = "index.html";
  });
}

/* Redirection selon le profil après une connexion réussie */
async function routerApresConnexion(profil) {
  if (!profil) { location.href = "espace-eleve.html"; return; } // l'espace affichera l'écran « compléter le profil »
  const st = statutProfil(profil);
  if (st !== "accepte") {
    const zone = $("#auth-zone");
    if (zone) {
      zone.innerHTML = ecranAttenteHTML(profil, (sbSession() || {}).user?.email, st);
      brancherDeconnexion();
    }
    return;
  }
  location.href = profil.role === "enseignant" ? "espace-enseignant.html" : "espace-eleve.html";
}

/* ============================================================
   PAGE D'ACCUEIL = CONNEXION / INSCRIPTION
   ============================================================ */
function renderConnexion() {
  const zone = $("#auth-zone");
  if (!zone) return;

  if (sbConnecte()) {
    zone.innerHTML = `<div class="card" style="max-width:560px;margin:2rem auto;text-align:center"><p class="text-muted">⏳ Vérification de votre compte…</p></div>`;
    sbAssurerProfil()
      .then((profil) => routerApresConnexion(profil))
      .catch(() => { location.href = "espace-eleve.html"; });
    return;
  }

  /* État de la base */
  sbBasePrete().then((prete) => {
    const z = $("#etat-base");
    if (z && !prete) {
      z.innerHTML = `<div class="callout callout-warning">${ICONS.alert}<div><strong>Base de données pas encore installée.</strong> L'administrateur doit d'abord exécuter le script <code>supabase/schema.sql</code> dans Supabase (voir le guide). Les inscriptions échoueront tant que ce n'est pas fait.</div></div>`;
    }
  });

  let vueInscription = false;
  let roleChoisi = "eleve";

  function rendre() {
    zone.innerHTML = `
    <div class="card" style="max-width:560px;margin:0 auto">
      <div class="form-actions mb-3" style="justify-content:center;margin-top:0">
        <button type="button" class="btn ${vueInscription ? "btn-ghost" : "btn-secondary"} auth-onglet" data-vue="connexion">Se connecter</button>
        <button type="button" class="btn ${vueInscription ? "btn-secondary" : "btn-ghost"} auth-onglet" data-vue="inscription">Créer un compte</button>
      </div>

      ${vueInscription ? `
      <h2 class="card-title">✨ Créer un compte</h2>
      <div class="form-actions mt-2" style="margin-bottom:1rem">
        <button type="button" class="btn ${roleChoisi === "eleve" ? "btn-secondary" : "btn-ghost"} auth-role" data-role="eleve">👨‍🎓 Je suis élève</button>
        <button type="button" class="btn ${roleChoisi === "enseignant" ? "btn-secondary" : "btn-ghost"} auth-role" data-role="enseignant">🧑‍🏫 Je suis enseignant</button>
      </div>
      <form id="form-inscription" class="form-grid">
        <div class="field full">
          <label for="in-nom">Nom complet</label>
          <input type="text" id="in-nom" placeholder="Ex. : Prénom NOM" autocomplete="name" required />
        </div>
        <div class="field full">
          <label for="in-email">E-mail</label>
          <input type="email" id="in-email" placeholder="vous@exemple.com" autocomplete="email" required />
        </div>
        <div class="field ${roleChoisi === "eleve" ? "" : "hidden"}" id="in-zone-classe">
          <label for="in-classe">Ma classe</label>
          <select id="in-classe" class="select-classes">${optionsClassesHTML(CLASSES_CLES[0])}</select>
        </div>
        <div class="field">
          <label for="in-matiere">${roleChoisi === "eleve" ? "Matière de mon enseignant" : "Ma matière"}</label>
          <select id="in-matiere">${optionsMatieresHTML((CFG && CFG.matiere) || MATIERES[0])}</select>
        </div>
        <div class="field">
          <label for="in-mdp">Mot de passe (6 caractères min.)</label>
          <input type="password" id="in-mdp" autocomplete="new-password" required />
        </div>
        <div class="field">
          <label for="in-mdp2">Répéter le mot de passe</label>
          <input type="password" id="in-mdp2" autocomplete="new-password" required />
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="submit" style="width:100%">Envoyer ma demande d'inscription</button>
        </div>
      </form>
      <p class="text-muted mt-2" style="font-size:.88rem">⏳ Après l'envoi, votre compte attend la <strong>validation de l'administrateur</strong> du site (${esc(SB_ADMIN_EMAIL)}). Vous pourrez vous connecter dès qu'il l'aura acceptée.</p>
      ` : `
      <h2 class="card-title">👋 Se connecter</h2>
      <form id="form-connexion" class="form-grid mt-2">
        <div class="field full">
          <label for="co-identifiant">E-mail</label>
          <input type="text" id="co-identifiant" placeholder="vous@exemple.com" autocomplete="username" required />
        </div>
        <div class="field full">
          <label for="co-mdp">Mot de passe</label>
          <input type="password" id="co-mdp" autocomplete="current-password" required />
        </div>
        <div class="field full">
          <button class="btn btn-primary" type="submit" style="width:100%">Se connecter</button>
        </div>
      </form>
      <p class="text-muted mt-2" style="font-size:.88rem">👨‍🎓 Élèves inscrits avec l'ancien système : vous pouvez aussi taper votre <strong>code élève</strong> (ex. 3SI1-01) à la place de l'e-mail.</p>
      `}
      <div id="auth-msg" class="mt-2"></div>
    </div>`;

    $$(".auth-onglet", zone).forEach((b) => b.addEventListener("click", () => {
      vueInscription = b.dataset.vue === "inscription";
      rendre();
    }));
    $$(".auth-role", zone).forEach((b) => b.addEventListener("click", () => {
      roleChoisi = b.dataset.role;
      rendre();
    }));

    $("#form-connexion", zone)?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const idf = $("#co-identifiant").value.trim();
      const mdp = $("#co-mdp").value;
      try {
        await sbConnexionIdentifiant(idf, mdp);
        const profil = await sbAssurerProfil();
        routerApresConnexion(profil);
      } catch (e) {
        espaceMessage("#auth-msg", "erreur", esc(e.message));
      }
    });

    $("#form-inscription", zone)?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const nom = $("#in-nom").value.trim();
      const email = $("#in-email").value.trim();
      const mdp = $("#in-mdp").value;
      const mdp2 = $("#in-mdp2").value;
      const classe = roleChoisi === "eleve" ? $("#in-classe").value : null;
      const matiere = $("#in-matiere").value;
      if (!nom || !email) { espaceMessage("#auth-msg", "erreur", "Nom et e-mail sont obligatoires."); return; }
      if (mdp.length < 6) { espaceMessage("#auth-msg", "erreur", "Mot de passe trop court (6 caractères minimum)."); return; }
      if (mdp !== mdp2) { espaceMessage("#auth-msg", "erreur", "Les deux mots de passe ne correspondent pas."); return; }
      /* Conservé dans le navigateur au cas où Supabase exigerait une
         confirmation d'e-mail : le profil sera créé à la 1re connexion. */
      try { localStorage.setItem("sb-inscription", JSON.stringify({ email, role: roleChoisi, nom, classe, matiere })); } catch (e) { /* ignoré */ }
      try {
        const session = await sbInscription(email, mdp);
        const rows = await sbCreerProfil({
          id: session.user.id, role: roleChoisi, nom, classe,
          matiere, code: null, email, statut: "en_attente"
        });
        try { localStorage.removeItem("sb-inscription"); } catch (e) { /* ignoré */ }
        const cree = Array.isArray(rows) ? rows[0] : rows;
        if (cree) sbStockerProfil(cree);
        if (cree && statutProfil(cree) === "accepte") {
          espaceMessage("#auth-msg", "succes", "⭐ Compte administrateur créé et validé automatiquement ! Redirection…");
          setTimeout(() => routerApresConnexion(cree), 800);
        } else {
          zone.innerHTML = ecranAttenteHTML(
            cree || { nom, role: roleChoisi, classe, matiere, email },
            email, "en_attente");
          brancherDeconnexion();
        }
      } catch (e) {
        if (/non confirmée/i.test(e.message)) {
          espaceMessage("#auth-msg", "erreur", "Compte créé, mais Supabase exige une confirmation d'e-mail : l'administrateur doit désactiver « Confirm email » (voir le guide), puis connectez-vous.");
        } else {
          espaceMessage("#auth-msg", "erreur", esc(e.message));
        }
      }
    });
  }

  rendre();
  chargerClassesDynamiques().then(() => rafraichirSelectsClasses(zone));
}

/* ============================================================
   ESPACE ÉLÈVE
   ============================================================ */
async function renderEspaceEleve() {
  const contenu = $("#espace-contenu");
  if (!contenu) return;
  const acces = await accesEspace("eleve");
  if (!acces) return;
  const { session, profil } = acces;
  const uid = session.user.id;
  await chargerClassesDynamiques();

  if (!profil.classe) {
    contenu.innerHTML = `
      ${enteteEspaceHTML(profil, "🎒 Mon espace élève", session.user.email)}
      <div class="callout callout-warning">${ICONS.alert}<div><strong>Aucune classe n'est associée à votre compte.</strong><br/>Demandez à l'administrateur du site de corriger votre profil (votre classe doit y figurer).</div></div>`;
    brancherDeconnexion();
    return;
  }

  /* Devoirs de ma classe : la base d'abord, le fichier du site en repli */
  let devoirsDB = [], baseOk = true;
  try {
    devoirsDB = (await sbSelect("devoirs", `select=*&classe=eq.${encodeURIComponent(profil.classe)}&order=date.asc`)).map(normaliserDevoirDB);
  } catch (e) { baseOk = false; }
  let devoirs;
  if (devoirsDB.length) {
    devoirs = profil.matiere
      ? devoirsDB.filter((d) => !d.matiere || d.matiere === profil.matiere)
      : devoirsDB;
  } else {
    /* Repli : les épreuves du fichier du site (matière principale du site) */
    devoirs = (!profil.matiere || profil.matiere === (CFG.matiere || "STI"))
      ? DEVOIRS.filter((d) => d.classe === profil.classe).map(normaliserDevoirFichier)
      : [];
  }

  let notesDB = [];
  try { notesDB = await sbSelect("notes", `select=*&eleve_id=eq.${uid}&order=date.asc`); } catch (e) { /* vide */ }
  const noteParDevoir = {};
  notesDB.forEach((n) => { noteParDevoir[n.devoir_id] = n; });
  const titreDevoir = (id) => {
    const d = devoirs.find((x) => x.id === id) || getDevoir(id);
    return d ? d.titre : id;
  };

  const auj = todayISO();
  const aVenir = devoirs.filter((d) => d.date >= auj).sort((a, b) => a.date.localeCompare(b.date));
  const passes = devoirs.filter((d) => d.date < auj).sort((a, b) => b.date.localeCompare(a.date));
  const notesR20 = notesDB.map((n) => (Number(n.note) / Number(n.sur || 20)) * 20);
  const moyenne = notesR20.length ? notesR20.reduce((s, v) => s + v, 0) / notesR20.length : null;
  const prochain = aVenir[0] || null;
  const pctNotes = passes.length ? Math.round((notesDB.length / passes.length) * 100) : 0;

  const ligneProchain = (d) => `
    <div class="horaire-cours" style="border-left-color:var(--violet)">
      <span class="horaire-heure" style="background:var(--soft-violet);color:var(--violet)">${fmtDateCourte(d.date)}</span>
      <span class="intitule">${esc(d.titre)} ${badgeTypeHTML(d.type)}<br/>
        <span class="text-muted" style="font-size:.85rem">${esc(d.matiere || "")}${d.enseignant_nom ? ` · ${esc(d.enseignant_nom)}` : ""} · ${fmtDate(d.date)}</span><br/>
        <span class="badge badge-afaire">🔒 Sujet visible le ${fmtDateCourte(datePlusUn(d.date))} (lendemain de l'épreuve)</span>
      </span>
      <span class="salle">${echeanceTexte(d.date)}</span>
    </div>`;

  const lignePasse = (d) => {
    const n = noteParDevoir[d.id];
    const idS = `sujet-${esc(d.id)}`, idC = `corr-${esc(d.id)}`;
    return `
    <div class="horaire-cours" style="border-left-color:${d.type === "DS" ? "var(--rose)" : "var(--violet)"}">
      <span class="horaire-heure">${fmtDateCourte(d.date)}</span>
      <span class="intitule">${esc(d.titre)} ${badgeTypeHTML(d.type)}<br/>
        <span class="text-muted" style="font-size:.85rem">${esc(d.matiere || "")}${d.enseignant_nom ? ` · ${esc(d.enseignant_nom)}` : ""} · ${fmtDate(d.date)}</span><br/>
        ${n ? `<span class="badge badge-note">🎯 Ma note : ${fmtNote(n.note)}/${fmtNote(n.sur || 20)}</span>` : `<span class="badge badge-attente">Note pas encore saisie</span>`}
        <button class="btn btn-outline btn-sm btn-bascule" data-cible="${idS}">📄 Sujet</button>
        <button class="btn btn-outline btn-sm btn-bascule" data-cible="${idC}">✅ Correction</button>
        <div id="${idS}" class="hidden boite-texte mt-1"><strong>📄 Sujet du devoir</strong>\n${esc(d.sujet || "Le sujet n'a pas été publié par l'enseignant.")}</div>
        <div id="${idC}" class="hidden boite-texte mt-1"><strong>✅ Correction</strong>\n${esc(d.correction || "La correction n'a pas encore été publiée par l'enseignant.")}</div>
        ${n && n.appreciation ? `<div class="boite-texte mt-1"><strong>💬 Remarque de l'enseignant :</strong> ${esc(n.appreciation)}</div>` : ""}
      </span>
      <span class="salle">${echeanceTexte(d.date)}</span>
    </div>`;
  };

  contenu.innerHTML = `
    ${enteteEspaceHTML(profil, "🎒 Mon espace élève", session.user.email)}

    ${profil.observation ? `
    <div class="callout callout-info mb-3">${ICONS.info}<div><strong>💬 Observation de l'enseignant :</strong> ${esc(profil.observation)}</div></div>` : ""}

    <div class="grid grid-3 mb-3">
      <div class="card stat-card"><div class="num">${moyenne !== null ? fmtNote(moyenne) + "/20" : "—"}</div><div class="label">Moyenne générale</div></div>
      <div class="card stat-card"><div class="num">${notesDB.length}</div><div class="label">Notes reçues</div></div>
      <div class="card stat-card"><div class="num">${prochain ? fmtDateCourte(prochain.date) : "—"}</div><div class="label">Prochain devoir${prochain ? ` (${echeanceTexte(prochain.date)})` : ""}</div></div>
    </div>

    ${!baseOk ? `<div class="callout callout-info mb-3">${ICONS.info}<div>Les devoirs affichés proviennent pour le moment du fichier du site : votre enseignant pourra bientôt les gérer directement en ligne.</div></div>` : ""}

    <div class="card mb-3">
      <h2 class="card-title">📈 Ma progression</h2>
      <div class="progress-block mt-2">
        <div class="progress-legend"><span>Devoirs passés notés</span><strong>${pctNotes}%</strong></div>
        <div class="progress"><div class="progress-fill" style="width:${pctNotes}%"></div></div>
      </div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">📅 Mes prochains devoirs</h2>
      <p class="text-muted">Les dates sont connues à l'avance ; le <strong>sujet</strong> et la <strong>correction</strong> ne s'ouvrent que le <strong>lendemain</strong> de l'épreuve.</p>
      <div class="mt-2">
      ${aVenir.map(ligneProchain).join("") || `<p class="text-muted mt-1">Aucun devoir à venir pour le moment.</p>`}
      </div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">📝 Mes devoirs passés — sujets & corrections</h2>
      <div class="mt-2">
      ${passes.map(lignePasse).join("") || `<p class="text-muted mt-1">Aucun devoir passé pour le moment.</p>`}
      </div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">🎯 Mes notes</h2>
      ${notesDB.length ? `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Devoir</th><th>Note</th><th>Remarque de l'enseignant</th><th>Date</th></tr></thead>
        <tbody>
        ${notesDB.map((n) => `<tr><td>${esc(titreDevoir(n.devoir_id))}</td><td><strong>${fmtNote(n.note)}/${fmtNote(n.sur || 20)}</strong></td><td>${esc(n.appreciation || "—")}</td><td>${n.date ? fmtDateCourte(n.date) : ""}</td></tr>`).join("")}
        </tbody></table></div>` : `<p class="text-muted">Aucune note pour le moment. Vos notes et les remarques de l'enseignant apparaîtront ici dès leur saisie.</p>`}
    </div>

    <div class="card">
      <h2 class="card-title">📣 Annonces</h2>
      <div class="mt-2">
      ${trierAnnonces(ANNONCES).slice(0, 3).map((a) => carteAnnonceHTML(a)).join("") || `<p class="text-muted">Aucune annonce pour le moment.</p>`}
      </div>
    </div>`;

  brancherDeconnexion();

  $$(".btn-bascule", contenu).forEach((btn) => {
    btn.addEventListener("click", () => {
      const zone = document.getElementById(btn.dataset.cible);
      if (zone) zone.classList.toggle("hidden");
    });
  });
}

/* ============================================================
   ESPACE ENSEIGNANT (+ tableau de bord admin)
   ============================================================ */
const ENS_ETAT = { classeDevoirs: null, classeEleves: null, devoirNotes: "" };
const CALJ = { classe: null, type: "DC", matiere: "", a: null, m: null };
const COULEURS_CLASSES = ["var(--rose)", "var(--cyan)", "var(--violet)", "var(--green)", "var(--orange)", "var(--amber)"];

function couleurClasse(cle) {
  const i = listeClasses().findIndex((c) => c.cle === cle);
  return COULEURS_CLASSES[(i < 0 ? 0 : i) % COULEURS_CLASSES.length];
}

/* Petit calendrier mensuel pour choisir la date d'un devoir :
   seules les dates compatibles avec le calendrier scolaire officiel
   tunisien sont cliquables (évaluation par evaluerDateChoix). */
function afficherCalendrierChoixDate(zone, options) {
  if (!zone) return;
  const auj = new Date();
  let annee = auj.getFullYear(), mois = auj.getMonth();
  if (options.dateActuelle) {
    const d0 = parseDate(options.dateActuelle);
    annee = d0.getFullYear(); mois = d0.getMonth();
  }
  let selection = options.dateActuelle || null;

  function dessiner() {
    const premier = new Date(annee, mois, 1);
    const debut = (premier.getDay() + 6) % 7;
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    let html = `
      <div class="cal-nav mb-2">
        <button type="button" class="btn btn-outline btn-sm dc-prev">← Précédent</button>
        <h3>${MOIS_LONG[mois]} ${annee}</h3>
        <button type="button" class="btn btn-outline btn-sm dc-next">Suivant →</button>
        <span class="text-muted" style="margin-left:auto;font-size:.82rem">${sourceOfficielHTML()}</span>
      </div>
      <div class="cal-grid">`;
    html += ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((j) => `<div class="cal-jour-nom">${j}</div>`).join("");
    for (let i = 0; i < debut; i++) html += `<div class="cal-case vide"></div>`;
    for (let jour = 1; jour <= nbJours; jour++) {
      const iso = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
      const ev = evaluerDateChoix(options.classe, iso, options.type, "", {
        occupees: options.occupees ? options.occupees() : [],
        ignorees: options.ignorees ? options.ignorees() : []
      });
      const classes = ["cal-case", "choix-case", ev.ok ? "valide" : "invalide"];
      if (iso === todayISO()) classes.push("aujourdhui");
      if (iso === selection) classes.push("selectionne");
      if (options.dateActuelle && iso === options.dateActuelle) classes.push("actuel");
      const icone = CHOIX_ICONES[ev.etat] || "";
      html += `<button type="button" class="${classes.join(" ")}" data-iso="${iso}" ${ev.ok ? "" : "disabled"} title="${esc(ev.raison)}">
        <div class="cal-num">${jour}</div>
        ${icone ? `<div class="cal-off">${icone}</div>` : ""}
        ${options.dateActuelle && iso === options.dateActuelle ? `<div class="cal-off epreuve">actuel</div>` : ""}
      </button>`;
    }
    const reste = (7 - ((debut + nbJours) % 7)) % 7;
    for (let i = 0; i < reste; i++) html += `<div class="cal-case vide"></div>`;
    html += `</div>
      <p class="text-muted mt-1" style="font-size:.85rem">
        <span class="pill" style="border-color:var(--green);background:var(--soft-green);color:var(--green)">🟢 Date possible</span>
        <span class="pill">🏖️ Vacances</span> <span class="pill">🚩 Férié</span> <span class="pill">🔒 Semaine bloquée</span>
        ${options.type === "synthese"
          ? " — un devoir de <strong>synthèse</strong> n'est possible que pendant une <strong>semaine bloquée</strong>."
          : " — un devoir de <strong>contrôle</strong> n'est possible qu'un <strong>jour de cours de la classe</strong>, hors vacances, jours fériés et semaines bloquées."}
      </p>`;
    zone.innerHTML = html;
    $(".dc-prev", zone)?.addEventListener("click", () => { mois--; if (mois < 0) { mois = 11; annee--; } dessiner(); });
    $(".dc-next", zone)?.addEventListener("click", () => { mois++; if (mois > 11) { mois = 0; annee++; } dessiner(); });
    $$(".choix-case.valide", zone).forEach((btn) => {
      btn.addEventListener("click", () => {
        selection = btn.dataset.iso;
        if (options.onChoisir) options.onChoisir(selection);
        dessiner();
      });
    });
  }

  dessiner();
  quandOfficielPret(dessiner);
}

async function renderEspaceEnseignant() {
  const contenu = $("#espace-contenu");
  if (!contenu) return;
  const acces = await accesEspace("enseignant");
  if (!acces) return;
  const { session, profil } = acces;
  const uid = session.user.id;
  const estAdmin = sbEstAdminEmail(session.user.email);
  await chargerClassesDynamiques();

  /* Chargements tolérants : un message clair si le schéma v4 n'est pas
     encore exécuté dans Supabase (table devoirs absente). */
  let devoirsTous = [], devoirsOk = true;
  try { devoirsTous = (await sbSelect("devoirs", "select=*&order=date.asc")).map(normaliserDevoirDB); }
  catch (e) { devoirsOk = false; }
  let elevesAcc = [], profilsTous = [], enAttente = [], profilsOk = true;
  try {
    profilsTous = await sbSelect("profils", "select=*&order=created_at.asc");
    elevesAcc = profilsTous.filter((p) => p.role === "eleve" && statutProfil(p) === "accepte");
    enAttente = profilsTous.filter((p) => statutProfil(p) === "en_attente");
  } catch (e) { profilsOk = false; }
  let notesToutes = [];
  try { notesToutes = await sbSelect("notes", "select=*"); } catch (e) { /* vide */ }

  const mesDevoirs = devoirsTous.filter((d) => d.enseignant_id === uid);
  const visibles = estAdmin ? devoirsTous : mesDevoirs;
  const lc0 = listeClasses();
  if (!lc0.some((c) => c.cle === ENS_ETAT.classeDevoirs)) ENS_ETAT.classeDevoirs = lc0[0] ? lc0[0].cle : null;
  if (!lc0.some((c) => c.cle === ENS_ETAT.classeEleves)) ENS_ETAT.classeEleves = lc0[0] ? lc0[0].cle : null;

  contenu.innerHTML = `
    ${enteteEspaceHTML(profil, "🧑‍🏫 Espace enseignant", session.user.email)}

    <div class="grid grid-3 mb-3">
      <div class="card stat-card"><div class="num">${visibles.length}</div><div class="label">${estAdmin ? "Devoirs (tous les enseignants)" : "Mes devoirs"}</div></div>
      <div class="card stat-card"><div class="num">${elevesAcc.length}</div><div class="label">Élèves validés</div></div>
      <div class="card stat-card"><div class="num">${notesToutes.length}</div><div class="label">Notes saisies en ligne</div></div>
    </div>

    ${!devoirsOk ? `<div class="callout callout-warning mb-3">${ICONS.alert}<div><strong>La table des devoirs n'existe pas encore.</strong> (Ré)exécutez <code>supabase/schema.sql</code> (version v4) dans Supabase pour activer la gestion des devoirs en ligne. En attendant, les élèves continuent de voir les devoirs du fichier du site.</div></div>` : ""}

    ${estAdmin ? `
    <div class="callout callout-info mb-3">${ICONS.star}<div>
      <strong>⭐ Vous êtes l'administrateur du site.</strong>
      ${enAttente.length ? `<strong>${enAttente.length} demande(s) de compte</strong> en attente de validation.` : `Aucune demande de compte en attente.`}
      Votre interface d'administration (validation des comptes, rôles, classes) est séparée de cet espace enseignant, identique à celui de tous les enseignants.<br/>
      <a class="btn btn-primary btn-sm mt-1" href="espace-admin.html">⭐ Ouvrir l'interface d'administration →</a>
    </div></div>` : ""}

    <div class="card mb-3">
      <h2 class="card-title">🎓 Mes classes et mes matières</h2>
      <p class="text-muted">Choisissez les classes que vous enseignez et votre matière — ou vos <strong>2 matières</strong> si vous en enseignez deux en même temps. Vos classes deviennent les <strong>jetons</strong> à placer dans le calendrier ci-dessous.</p>
      <div class="form-grid mt-2">
        <div class="field">
          <label for="mm-mat1">Ma matière</label>
          <select id="mm-mat1">${optionsMatieresHTML(profil.matiere || MATIERES[0])}</select>
        </div>
        <div class="field">
          <label for="mm-mat2">Ma 2e matière (si j'en enseigne deux)</label>
          <select id="mm-mat2">
            <option value="" ${!profil.matiere_2 ? "selected" : ""}>— Aucune —</option>
            ${optionsMatieresHTML(profil.matiere_2 || "")}
          </select>
        </div>
        <div class="field full">
          <label>Mes classes (déterminées par l'admin du site)</label>
          <div class="mm-classes">
            ${listeClasses().map((c) => `
              <label class="mm-classe"><input type="checkbox" class="mm-classe-cb" value="${esc(c.cle)}" ${(profil.classes || []).includes(c.cle) ? "checked" : ""} /> ${esc(c.nom)}</label>`).join("") || `<span class="text-muted">Aucune classe définie pour le moment.</span>`}
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" id="mm-enregistrer">💾 Enregistrer mes classes et matières</button>
        <span class="text-muted" id="mm-msg"></span>
      </div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">🗓️ Mon calendrier — placer mes devoirs</h2>
      <p class="text-muted"><strong>Glissez le jeton d'une classe</strong> dans une case du calendrier (ou cliquez le jeton, puis le jour), puis écrivez le <strong>titre</strong> du devoir. La date respecte le calendrier officiel tunisien du site ; limite : <strong>2 devoirs de contrôle + 1 devoir de synthèse par trimestre</strong>, par classe et par matière. Les élèves voient les dates tout de suite, le sujet et la correction à partir du <strong>lendemain</strong> de l'épreuve.</p>
      <div id="cal-jetons" class="mt-2"></div>
      <div id="dv-msg" class="mt-1"></div>
      <div id="dv-form-zone" class="mt-2"></div>
      <h3 class="mt-3">📋 Mes devoirs en liste (modifier sujets et corrections)</h3>
      <div class="form-grid mt-2">
        <div class="field">
          <label for="dv-classe">Classe</label>
          <select id="dv-classe">${optionsClassesHTML(ENS_ETAT.classeDevoirs)}</select>
        </div>
        <div class="field">
          <label>&nbsp;</label>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button class="btn btn-primary" id="dv-nouveau">➕ Nouveau devoir</button>
            <button class="btn btn-outline" id="dv-import">⬇ Importer les épreuves du fichier</button>
          </div>
        </div>
      </div>
      <div id="dv-liste" class="mt-2"></div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">👨‍🎓 Mes élèves — notes et observations</h2>
      <div class="form-grid mt-2">
        <div class="field">
          <label for="en-classe">Classe</label>
          <select id="en-classe">${optionsClassesHTML(ENS_ETAT.classeEleves)}</select>
        </div>
        <div class="field">
          <label for="en-devoir">Devoir à noter</label>
          <select id="en-devoir"></select>
        </div>
      </div>
      <div id="en-notes" class="mt-2"></div>
      <h3 class="mt-3">📋 Élèves de la classe (comptes validés)</h3>
      <div id="en-liste" class="mt-1"></div>
    </div>

    <div class="card">
      <h2 class="card-title">🧰 Outils</h2>
      <p class="text-muted">
        <a href="calendrier.html">🗓️ Calendrier officiel</a> ·
        <a href="vie-de-classe.html">🏫 Vie de classe</a> ·
        <a href="https://github.com/aymenessouyah/devoirs2026-2027/blob/main/GUIDE-COMPTES.md" target="_blank" rel="noopener">📖 Guide des comptes</a>
      </p>
    </div>`;

  brancherDeconnexion();
  brancherChoixEnseignant();
  afficherCalendrierJetons();
  rendreDevoirs();
  rendreEleves();
  brancherEleves();

  /* ---------------- 🎓 Mes classes et mes matières ---------------- */
  function brancherChoixEnseignant() {
    $("#mm-enregistrer")?.addEventListener("click", async () => {
      const mat1 = $("#mm-mat1").value;
      const mat2 = $("#mm-mat2").value;
      const msg = $("#mm-msg");
      if (mat2 && mat2 === mat1) { if (msg) msg.textContent = "Les deux matières doivent être différentes."; return; }
      const classes = $$(".mm-classe-cb").filter((cb) => cb.checked).map((cb) => cb.value);
      try {
        await sbPatch("profils", `id=eq.${uid}`, { matiere: mat1 || null, matiere_2: mat2 || null, classes });
        CALJ.classe = null;
        CALJ.matiere = "";
        renderEspaceEnseignant();
      } catch (e) { if (msg) msg.textContent = e.message; }
    });
  }

  /* ---------------- 🗓️ Calendrier à jetons ---------------- */
  /* L'enseignant voit SES classes comme des jetons colorés : il glisse
     un jeton dans une case du calendrier (ou clique le jeton puis le
     jour), puis écrit le titre du devoir. Quota : 2 DC + 1 DS par
     trimestre, par classe et par matière. */
  function afficherCalendrierJetons() {
    const zone = $("#cal-jetons");
    if (!zone) return;
    const mesClasses = (profil.classes || []).filter((cle) => listeClasses().some((c) => c.cle === cle));
    if (!mesClasses.length) {
      zone.innerHTML = `<div class="callout callout-info">${ICONS.info}<div><strong>Choisissez d'abord vos classes</strong> dans la carte « 🎓 Mes classes et mes matières » ci-dessus : elles apparaîtront ici comme jetons à placer dans le calendrier.</div></div>`;
      return;
    }
    if (!mesClasses.includes(CALJ.classe)) CALJ.classe = mesClasses[0];
    const mats = sesMatieres(profil);
    if (!mats.includes(CALJ.matiere)) CALJ.matiere = mats[0] || "";
    const auj = new Date();
    if (CALJ.a === null) { CALJ.a = auj.getFullYear(); CALJ.m = auj.getMonth(); }

    function placer(iso, classe) {
      const typeSql = CALJ.type === "DS" ? "synthese" : "controle";
      const ev = evaluerDateChoix(classe, iso, typeSql, "", {
        occupees: devoirsTous.filter((d) => d.classe === classe).map((d) => d.date)
      });
      if (!ev.ok) { espaceMessage("#dv-msg", "erreur", `Date impossible : ${esc(ev.raison)}`); return; }
      const q = etatQuota(mesDevoirs, classe, CALJ.matiere, CALJ.type, iso, null);
      if (!q.ok) {
        espaceMessage("#dv-msg", "erreur", `Limite atteinte pour le ${q.trimestre.label} : maximum ${q.max} ${CALJ.type === "DS" ? "devoir de synthèse" : "devoirs de contrôle"} par trimestre (${esc(nomClasseDyn(classe))} · ${esc(CALJ.matiere || "")}).`);
        return;
      }
      ouvrirFormulaire(null, { classe, type: CALJ.type, date: iso, matiere: CALJ.matiere });
    }

    function quotaHTML() {
      return (CFG.trimestres || []).map((t) => {
        const qDC = etatQuota(mesDevoirs, CALJ.classe, CALJ.matiere, "DC", t.debut, null);
        const qDS = etatQuota(mesDevoirs, CALJ.classe, CALJ.matiere, "DS", t.debut, null);
        return `<span class="pill" title="${esc(t.label)} — ${esc(nomClasseDyn(CALJ.classe))}">${esc(t.label)} · DC ${qDC.nb}/${qDC.max} · DS ${qDS.nb}/${qDS.max}</span>`;
      }).join(" ");
    }

    function dessiner() {
      const typeSql = CALJ.type === "DS" ? "synthese" : "controle";
      const premier = new Date(CALJ.a, CALJ.m, 1);
      const debut = (premier.getDay() + 6) % 7;
      const nbJours = new Date(CALJ.a, CALJ.m + 1, 0).getDate();
      const occupees = devoirsTous.filter((d) => d.classe === CALJ.classe).map((d) => d.date);
      let cases = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((j) => `<div class="cal-jour-nom">${j}</div>`).join("");
      for (let i = 0; i < debut; i++) cases += `<div class="cal-case vide"></div>`;
      for (let jour = 1; jour <= nbJours; jour++) {
        const iso = `${CALJ.a}-${String(CALJ.m + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
        const ev = evaluerDateChoix(CALJ.classe, iso, typeSql, "", { occupees });
        const evts = evenementsOfficiels(iso);
        const icone = evts.some((e) => e.type === "vacances") ? "🏖️"
          : evts.some((e) => e.type === "ferie") ? "🚩"
          : evts.some((e) => e.type === "suspension") ? "🔒" : "";
        const tokens = mesDevoirs.filter((d) => d.date === iso)
          .map((d) => `<button type="button" class="cal-token" style="--jc:${couleurClasse(d.classe)}" data-id="${esc(d.id)}" title="${esc(d.titre)} — ${esc(nomClasseDyn(d.classe))} · ${esc(d.matiere || "")}">${d.type} · ${esc(d.titre)}</button>`).join("");
        const classesCls = ["cal-case", ev.ok ? "valide deposable" : "invalide"];
        if (iso === todayISO()) classesCls.push("aujourdhui");
        cases += `<div class="${classesCls.join(" ")}" data-iso="${iso}" title="${esc(ev.raison)}">
          <div class="cal-num">${jour}</div>
          ${icone ? `<div class="cal-off">${icone}</div>` : ""}
          ${tokens}
        </div>`;
      }
      const reste = (7 - ((debut + nbJours) % 7)) % 7;
      for (let i = 0; i < reste; i++) cases += `<div class="cal-case vide"></div>`;

      zone.innerHTML = `
        <div class="jetons-bar">
          <strong>Mes jetons :</strong>
          ${mesClasses.map((cle) => `<button type="button" class="jeton-classe ${CALJ.classe === cle ? "sel" : ""}" draggable="true" data-cle="${esc(cle)}" style="--jc:${couleurClasse(cle)}" title="Glissez-moi dans le calendrier, ou cliquez puis cliquez un jour"><span class="point"></span>${esc(nomClasseDyn(cle))}</button>`).join("")}
          <span style="margin-left:.4rem">
            <button type="button" class="btn ${CALJ.type === "DC" ? "btn-secondary" : "btn-ghost"} btn-sm cj-type" data-type="DC">DC · Contrôle</button>
            <button type="button" class="btn ${CALJ.type === "DS" ? "btn-secondary" : "btn-ghost"} btn-sm cj-type" data-type="DS">DS · Synthèse</button>
          </span>
          ${mats.length > 1
            ? `<select id="cj-matiere" title="Matière du devoir">${mats.map((m) => `<option ${m === CALJ.matiere ? "selected" : ""}>${esc(m)}</option>`).join("")}</select>`
            : `<span class="pill">📚 ${esc(CALJ.matiere || "")}</span>`}
        </div>
        <p class="text-muted" style="font-size:.88rem">Glissez un jeton dans une case <strong style="color:var(--green)">verte</strong>, ou cliquez le jeton puis le jour. Cliquez un devoir déjà placé pour le modifier (date, sujet, correction).</p>
        <div class="jetons-bar">${quotaHTML()}</div>
        <div class="cal-nav mb-2">
          <button type="button" class="btn btn-outline btn-sm cj-prev">← Précédent</button>
          <h3>${MOIS_LONG[CALJ.m]} ${CALJ.a}</h3>
          <button type="button" class="btn btn-outline btn-sm cj-next">Suivant →</button>
          <span class="text-muted" style="margin-left:auto;font-size:.82rem">${sourceOfficielHTML()}</span>
        </div>
        <div class="cal-grid">${cases}</div>`;

      $$(".jeton-classe", zone).forEach((chip) => {
        chip.addEventListener("click", () => { CALJ.classe = chip.dataset.cle; dessiner(); });
        chip.addEventListener("dragstart", (e) => {
          CALJ.classe = chip.dataset.cle;
          try { e.dataTransfer.setData("text/plain", chip.dataset.cle); e.dataTransfer.effectAllowed = "copy"; } catch (err) { /* ignoré */ }
        });
      });
      $$(".cj-type", zone).forEach((b) => b.addEventListener("click", () => { CALJ.type = b.dataset.type; dessiner(); }));
      $("#cj-matiere", zone)?.addEventListener("change", (e) => { CALJ.matiere = e.target.value; dessiner(); });
      $(".cj-prev", zone)?.addEventListener("click", () => { CALJ.m--; if (CALJ.m < 0) { CALJ.m = 11; CALJ.a--; } dessiner(); });
      $(".cj-next", zone)?.addEventListener("click", () => { CALJ.m++; if (CALJ.m > 11) { CALJ.m = 0; CALJ.a++; } dessiner(); });
      $$(".cal-token", zone).forEach((t) => t.addEventListener("click", (e) => {
        e.stopPropagation();
        const d = mesDevoirs.find((x) => x.id === t.dataset.id);
        if (d) ouvrirFormulaire(d);
      }));
      $$(".cal-case.deposable", zone).forEach((cell) => {
        cell.addEventListener("click", () => placer(cell.dataset.iso, CALJ.classe));
        cell.addEventListener("dragover", (e) => { e.preventDefault(); cell.classList.add("survol"); });
        cell.addEventListener("dragleave", () => cell.classList.remove("survol"));
        cell.addEventListener("drop", (e) => {
          e.preventDefault();
          cell.classList.remove("survol");
          let cle = CALJ.classe;
          try { cle = e.dataTransfer.getData("text/plain") || cle; } catch (err) { /* ignoré */ }
          if (mesClasses.includes(cle)) placer(cell.dataset.iso, cle);
        });
      });
    }

    dessiner();
  }

  /* ---------------- 📝 Mes devoirs ---------------- */
  let formEtat = null; // { id|null, date }

  function devoirsDeLaClasse(classe) {
    return visibles.filter((d) => d.classe === classe).sort((a, b) => a.date.localeCompare(b.date));
  }

  function rendreDevoirs() {
    const zone = $("#dv-liste");
    if (!zone) return;
    const classe = ENS_ETAT.classeDevoirs;
    const liste = devoirsDeLaClasse(classe);
    zone.innerHTML = liste.length ? liste.map((d) => `
      <div class="horaire-cours" style="border-left-color:${d.type === "DS" ? "var(--rose)" : "var(--violet)"}">
        <span class="horaire-heure">${fmtDateCourte(d.date)}</span>
        <span class="intitule">${esc(d.titre)} ${badgeTypeHTML(d.type)}<br/>
          <span class="text-muted" style="font-size:.85rem">${fmtDate(d.date)} · ${esc(d.matiere || "")}${estAdmin && d.enseignant_nom ? ` · ${esc(d.enseignant_nom)}` : ""} · /${fmtNote(d.bareme)}</span><br/>
          <span class="badge ${d.sujet ? "badge-rendu" : "badge-afaire"}">${d.sujet ? "Sujet écrit" : "Sujet à écrire"}</span>
          <span class="badge ${d.correction ? "badge-note" : "badge-afaire"}">${d.correction ? "Correction prête" : "Correction à écrire"}</span>
        </span>
        <span class="salle">
          <button class="btn btn-outline btn-sm dv-modifier" data-id="${esc(d.id)}">✏️ Modifier</button>
          <button class="btn btn-ghost btn-sm dv-supprimer" data-id="${esc(d.id)}">🗑️</button>
        </span>
      </div>`).join("")
      : `<p class="text-muted">Aucun devoir en ligne pour ${esc(nomClasseDyn(classe))} pour le moment. Cliquez sur « ➕ Nouveau devoir » ou importez les épreuves du fichier.</p>`;

    $$(".dv-modifier", zone).forEach((b) => b.addEventListener("click", () => ouvrirFormulaire(liste.find((d) => d.id === b.dataset.id))));
    $$(".dv-supprimer", zone).forEach((b) => b.addEventListener("click", async () => {
      const d = liste.find((x) => x.id === b.dataset.id);
      if (!d || !confirm(`Supprimer le devoir « ${d.titre} » du ${fmtDate(d.date)} ? Les notes liées ne seront plus affichées.`)) return;
      try { await sbSupprimer("devoirs", `id=eq.${d.id}`); renderEspaceEnseignant(); }
      catch (e) { espaceMessage("#dv-msg", "erreur", esc(e.message)); }
    }));
  }

  function ouvrirFormulaire(devoir, preset) {
    const zone = $("#dv-form-zone");
    if (!zone) return;
    const classe = devoir ? devoir.classe : (preset && preset.classe) || ENS_ETAT.classeDevoirs;
    const estNouveau = !devoir;
    formEtat = {
      id: devoir ? devoir.id : null,
      date: devoir ? devoir.date : (preset && preset.date) || null,
      classe
    };
    const typeInit = devoir ? devoir.type : (preset && preset.type) || "DC";
    /* Numéro suggéré pour le titre automatique */
    const proprietaireInit = devoir ? (devoir.enseignant_id || uid) : uid;
    const nbMemeType = devoirsTous.filter((d) => d.enseignant_id === proprietaireInit && d.classe === classe && d.type === typeInit).length
      + DEVOIRS.filter((d) => d.examen && d.classe === classe && typeDepuisTitre(d.titre) === typeInit).length;
    const titreSuggere = `${typeLibelle(typeInit)} n°${nbMemeType + 1}`;

    zone.innerHTML = `
      <div class="card" style="border:2px dashed var(--violet)">
        <h3 class="card-title">${estNouveau ? "➕ Nouveau devoir" : "✏️ Modifier le devoir"} — ${esc(nomClasseDyn(classe))}</h3>
        <div class="form-grid mt-2">
          <div class="field">
            <label for="dvf-type">Type de devoir</label>
            <select id="dvf-type">
              <option value="DC" ${typeInit === "DC" ? "selected" : ""}>Devoir de contrôle</option>
              <option value="DS" ${typeInit === "DS" ? "selected" : ""}>Devoir de synthèse</option>
            </select>
          </div>
          <div class="field">
            <label for="dvf-titre">Titre</label>
            <input type="text" id="dvf-titre" value="${devoir ? esc(devoir.titre) : ""}" placeholder="${esc(titreSuggere)}" />
          </div>
          <div class="field">
            <label for="dvf-matiere">Matière</label>
            <select id="dvf-matiere">${(sesMatieres(profil).length ? sesMatieres(profil) : MATIERES).map((m) => `<option value="${esc(m)}" ${m === (devoir ? devoir.matiere : (preset && preset.matiere) || sesMatieres(profil)[0] || "") ? "selected" : ""}>${esc(m)}</option>`).join("")}</select>
          </div>
          <div class="field">
            <label for="dvf-bareme">Barème (note sur…)</label>
            <input type="number" id="dvf-bareme" min="1" max="100" step="0.5" value="${devoir ? esc(String(devoir.bareme)) : "20"}" />
          </div>
          <div class="field full">
            <label>📅 Date du devoir — cliquez sur un jour vert du calendrier officiel</label>
            <div id="dvf-cal"></div>
            <p class="mt-1"><strong>Date choisie :</strong> <span id="dvf-date-txt">${formEtat.date ? fmtDate(formEtat.date) : "— aucune —"}</span></p>
          </div>
          <div class="field full">
            <label for="dvf-sujet">📄 Le sujet (visible par les élèves le lendemain de l'épreuve)</label>
            <textarea id="dvf-sujet" rows="5" placeholder="Ex. : Chapitres : CSS3 (positionnement) et JavaScript (DOM). Durée : 1 heure. Calculatrice interdite…">${devoir ? esc(devoir.sujet) : ""}</textarea>
          </div>
          <div class="field full">
            <label for="dvf-correction">✅ La correction (visible par les élèves le lendemain de l'épreuve)</label>
            <textarea id="dvf-correction" rows="5" placeholder="Exercice 1 : … / Exercice 2 : …">${devoir ? esc(devoir.correction) : ""}</textarea>
          </div>
        </div>
        <div id="dvf-msg" class="mt-1"></div>
        <div class="form-actions">
          <button class="btn btn-primary" id="dvf-enregistrer">💾 Enregistrer le devoir</button>
          <button class="btn btn-ghost" id="dvf-annuler">Annuler</button>
        </div>
      </div>`;

    const majCalendrier = () => {
      const type = $("#dvf-type").value;
      afficherCalendrierChoixDate($("#dvf-cal"), {
        classe,
        type: type === "DS" ? "synthese" : "controle",
        dateActuelle: formEtat.date,
        occupees: () => devoirsTous
          .filter((x) => x.classe === classe && x.id !== formEtat.id)
          .map((x) => x.date),
        ignorees: () => (devoir && formEtat.date === devoir.date ? [devoir.date] : []),
        onChoisir: (iso) => {
          formEtat.date = iso;
          const txt = $("#dvf-date-txt");
          if (txt) txt.textContent = fmtDate(iso);
        }
      });
    };
    majCalendrier();
    $("#dvf-type")?.addEventListener("change", majCalendrier);
    $("#dvf-annuler")?.addEventListener("click", () => { zone.innerHTML = ""; formEtat = null; });

    $("#dvf-enregistrer")?.addEventListener("click", async () => {
      const type = $("#dvf-type").value;
      const titre = $("#dvf-titre").value.trim() || $("#dvf-titre").placeholder;
      const matiere = $("#dvf-matiere").value;
      const bareme = Number($("#dvf-bareme").value) || 20;
      const sujet = $("#dvf-sujet").value;
      const correction = $("#dvf-correction").value;
      if (!formEtat.date) { espaceMessage("#dvf-msg", "erreur", "Choisissez d'abord une date dans le calendrier (jour vert)."); return; }
      const ev = evaluerDateChoix(classe, formEtat.date, type === "DS" ? "synthese" : "controle", "", {
        occupees: devoirsTous.filter((x) => x.classe === classe && x.id !== formEtat.id).map((x) => x.date),
        ignorees: devoir && formEtat.date === devoir.date ? [devoir.date] : []
      });
      if (!ev.ok) { espaceMessage("#dvf-msg", "erreur", `Date refusée : ${esc(ev.raison)}`); return; }
      const proprietaire = devoir ? (devoir.enseignant_id || uid) : uid;
      const q = etatQuota(devoirsTous.filter((d) => d.enseignant_id === proprietaire), classe, matiere, type, formEtat.date, formEtat.id);
      if (!q.ok) {
        espaceMessage("#dvf-msg", "erreur", `Limite atteinte pour le ${q.trimestre.label} : maximum ${q.max} ${type === "DS" ? "devoir de synthèse" : "devoirs de contrôle"} par trimestre, par classe et par matière. Choisissez une date d'un autre trimestre.`);
        return;
      }
      const ligne = {
        enseignant_id: proprietaire,
        enseignant_nom: devoir ? (devoir.enseignant_nom || profil.nom) : profil.nom,
        classe, matiere, type, titre, date: formEtat.date, sujet, correction, bareme
      };
      try {
        if (formEtat.id) await sbPatch("devoirs", `id=eq.${formEtat.id}`, ligne);
        else await sbInsert("devoirs", ligne);
        espaceMessage("#dv-msg", "succes", `✅ Devoir « ${esc(titre)} » enregistré pour le ${fmtDate(formEtat.date)} (${esc(nomClasseDyn(classe))}).`);
        zone.innerHTML = "";
        formEtat = null;
        renderEspaceEnseignant();
      } catch (e) {
        espaceMessage("#dvf-msg", "erreur", esc(e.message));
      }
    });
  }

  $("#dv-classe")?.addEventListener("change", (ev) => {
    ENS_ETAT.classeDevoirs = ev.target.value;
    const fz = $("#dv-form-zone");
    if (fz) fz.innerHTML = "";
    formEtat = null;
    rendreDevoirs();
  });
  $("#dv-nouveau")?.addEventListener("click", () => ouvrirFormulaire(null));
  $("#dv-import")?.addEventListener("click", async () => {
    const classe = ENS_ETAT.classeDevoirs;
    const statiques = DEVOIRS.filter((d) => d.examen && d.classe === classe);
    const deja = new Set(devoirsTous.filter((d) => d.classe === classe).map((d) => `${d.titre}|${d.date}`));
    const aInserer = statiques
      .filter((d) => !deja.has(`${d.titre}|${d.echeance}`))
      .map((d) => {
        const n = normaliserDevoirFichier(d);
        return {
          enseignant_id: uid, enseignant_nom: profil.nom, classe,
          matiere: profil.matiere || n.matiere, type: n.type, titre: n.titre,
          date: n.date, sujet: n.sujet, correction: "", bareme: 20
        };
      });
    if (!aInserer.length) {
      espaceMessage("#dv-msg", "info", "Toutes les épreuves du fichier sont déjà en ligne pour cette classe.");
      return;
    }
    try {
      await sbInsert("devoirs", aInserer);
      espaceMessage("#dv-msg", "succes", `✅ ${aInserer.length} épreuve(s) importée(s) pour ${esc(nomClasseDyn(classe))}. Vous pouvez maintenant modifier leurs dates, sujets et corrections en ligne.`);
      renderEspaceEnseignant();
    } catch (e) {
      espaceMessage("#dv-msg", "erreur", esc(e.message));
    }
  });

  /* ---------------- 👨‍🎓 Élèves, notes et observations ---------------- */
  function devoirsNotables(classe) {
    /* Devoirs en base (les miens ; tous pour l'admin) + épreuves du
       fichier pas encore importées — les notes acceptent les deux. */
    const enBase = visibles.filter((d) => d.classe === classe);
    const cles = new Set(enBase.map((d) => `${d.titre}|${d.date}`));
    const fichier = DEVOIRS.filter((d) => d.examen && d.classe === classe && !cles.has(`${d.titre}|${d.echeance}`))
      .map(normaliserDevoirFichier);
    return [...enBase, ...fichier].sort((a, b) => a.date.localeCompare(b.date));
  }

  function brancherEleves() {
    const sel = $("#en-classe");
    if (!sel || sel.dataset.branche) return;
    sel.dataset.branche = "1";
    sel.addEventListener("change", (ev) => {
      ENS_ETAT.classeEleves = ev.target.value;
      ENS_ETAT.devoirNotes = "";
      rendreEleves();
    });
  }

  function rendreEleves() {
    const selDevoir = $("#en-devoir");
    const zoneNotes = $("#en-notes");
    const zoneListe = $("#en-liste");
    const classe = ENS_ETAT.classeEleves;
    const notables = devoirsNotables(classe);
    if (selDevoir) {
      selDevoir.innerHTML = `<option value="">— Choisir un devoir —</option>` +
        notables.map((d) => `<option value="${esc(d.id)}" ${d.id === ENS_ETAT.devoirNotes ? "selected" : ""}>${esc(d.titre)} — ${fmtDateCourte(d.date)} (${esc(d.matiere || "")})</option>`).join("");
      selDevoir.onchange = (ev) => { ENS_ETAT.devoirNotes = ev.target.value; rendreEleves(); };
    }

    const elevesClasse = elevesAcc.filter((p) => p.classe === classe);
    const devoirSel = notables.find((d) => d.id === ENS_ETAT.devoirNotes) || null;

    if (zoneNotes) {
      if (!devoirSel) {
        zoneNotes.innerHTML = `<p class="text-muted">Choisissez un devoir pour saisir ou modifier les notes et les remarques (appréciations) des élèves validés de la classe.</p>`;
      } else {
        const concernes = elevesClasse.filter((p) => !devoirSel.matiere || !p.matiere || p.matiere === devoirSel.matiere);
        zoneNotes.innerHTML = concernes.length ? `
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Élève</th><th>Note / ${fmtNote(devoirSel.bareme)}</th><th>💬 Remarque (appréciation)</th><th></th></tr></thead>
            <tbody>
            ${concernes.map((p) => {
              const n = notesToutes.find((x) => x.eleve_id === p.id && x.devoir_id === devoirSel.id);
              return `
              <tr>
                <td><strong>${esc(p.nom)}</strong><br/><span class="text-muted" style="font-size:.8rem">${esc(p.matiere || "")}</span></td>
                <td><input type="text" class="input-note" data-eleve="${esc(p.id)}" value="${n ? esc(String(n.note)) : ""}" placeholder="—" style="width:80px" /></td>
                <td><input type="text" class="input-app" data-eleve="${esc(p.id)}" value="${n ? esc(n.appreciation || "") : ""}" placeholder="Ex. : Bon travail, continue !" /></td>
                <td><button class="btn btn-primary btn-sm btn-enregistrer-note" data-eleve="${esc(p.id)}">Enregistrer</button>
                    <span class="text-muted retour-note" data-eleve="${esc(p.id)}"></span></td>
              </tr>`;
            }).join("")}
            </tbody></table></div>
          <p class="text-muted mt-1" style="font-size:.85rem">Les notes et remarques sont visibles immédiatement par l'élève dans son espace. Pour effacer une note, videz le champ et enregistrez.</p>`
        : `<p class="text-muted">Aucun élève validé dans cette classe pour la matière « ${esc(devoirSel.matiere || "")} ».</p>`;

        $$(".btn-enregistrer-note", zoneNotes).forEach((btn) => {
          btn.addEventListener("click", async () => {
            const eleveId = btn.dataset.eleve;
            const noteVal = $(`.input-note[data-eleve="${eleveId}"]`, zoneNotes)?.value.trim().replace(",", ".");
            const appVal = $(`.input-app[data-eleve="${eleveId}"]`, zoneNotes)?.value.trim() || "";
            const retour = $(`.retour-note[data-eleve="${eleveId}"]`, zoneNotes);
            btn.disabled = true;
            try {
              if (!noteVal) {
                await sbSupprimer("notes", `eleve_id=eq.${eleveId}&devoir_id=eq.${encodeURIComponent(devoirSel.id)}`);
                notesToutes = notesToutes.filter((x) => !(x.eleve_id === eleveId && x.devoir_id === devoirSel.id));
                if (retour) retour.textContent = "✓ Note effacée";
              } else {
                if (isNaN(Number(noteVal))) { if (retour) retour.textContent = "Note invalide"; btn.disabled = false; return; }
                const rows = await sbUpsert("notes", {
                  eleve_id: eleveId, devoir_id: devoirSel.id,
                  note: Number(noteVal), sur: devoirSel.bareme,
                  appreciation: appVal, date: todayISO()
                }, "eleve_id,devoir_id");
                const maj = Array.isArray(rows) ? rows[0] : rows;
                const idx = notesToutes.findIndex((x) => x.eleve_id === eleveId && x.devoir_id === devoirSel.id);
                if (maj) { if (idx >= 0) notesToutes[idx] = maj; else notesToutes.push(maj); }
                if (retour) retour.textContent = "✓ Enregistré";
              }
            } catch (e) {
              if (retour) retour.textContent = e.message;
            }
            btn.disabled = false;
          });
        });
      }
    }

    if (zoneListe) {
      zoneListe.innerHTML = elevesClasse.length ? `
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Élève</th><th>Matière</th><th>Moyenne</th><th>Notes</th><th>💬 Observation générale (vue par l'élève)</th><th></th></tr></thead>
          <tbody>
          ${elevesClasse.map((p) => {
            const ses = notesToutes.filter((n) => n.eleve_id === p.id);
            const moy = ses.length ? ses.reduce((s, n) => s + (Number(n.note) / Number(n.sur || 20)) * 20, 0) / ses.length : null;
            return `
            <tr>
              <td><strong>${esc(p.nom)}</strong></td>
              <td>${esc(p.matiere || "—")}</td>
              <td>${moy !== null ? `<strong>${fmtNote(moy)}/20</strong>` : "—"}</td>
              <td>${ses.length}</td>
              <td><input type="text" class="input-obs" data-eleve="${esc(p.id)}" value="${esc(p.observation || "")}" placeholder="Ex. : Élève sérieux, en progrès." /></td>
              <td><button class="btn btn-outline btn-sm btn-enregistrer-obs" data-eleve="${esc(p.id)}">Enregistrer</button>
                  <span class="text-muted retour-obs" data-eleve="${esc(p.id)}"></span></td>
            </tr>`;
          }).join("")}
          </tbody></table></div>`
        : `<p class="text-muted">Aucun élève validé dans cette classe pour le moment. Les élèves apparaissent ici après leur inscription et la validation de leur compte${estAdmin ? " (⭐ Administration, ci-dessus)" : " par l'administrateur du site"}.</p>`;

      $$(".btn-enregistrer-obs", zoneListe).forEach((btn) => {
        btn.addEventListener("click", async () => {
          const eleveId = btn.dataset.eleve;
          const obs = $(`.input-obs[data-eleve="${eleveId}"]`, zoneListe)?.value.trim() || "";
          const retour = $(`.retour-obs[data-eleve="${eleveId}"]`, zoneListe);
          btn.disabled = true;
          try {
            await sbPatch("profils", `id=eq.${eleveId}`, { observation: obs });
            const p = elevesAcc.find((x) => x.id === eleveId);
            if (p) p.observation = obs;
            if (retour) retour.textContent = "✓";
          } catch (e) {
            if (retour) retour.textContent = e.message;
          }
          btn.disabled = false;
        });
      });
    }
  }
}


/* ============================================================
   INTERFACE ⭐ ADMINISTRATION (admin du site uniquement)
   Interface séparée de l'espace enseignant : validation des
   comptes, rôles, et classes du site (déterminées par l'admin).
   ============================================================ */
async function renderEspaceAdmin() {
  const contenu = $("#espace-contenu");
  if (!contenu) return;
  const session = await sbSessionValide();
  if (!session) { location.href = "index.html"; return; }

  if (!sbEstAdminEmail(session.user.email)) {
    contenu.innerHTML = `
      <div class="callout callout-warning">${ICONS.lock}<div>
        <strong>Interface réservée à l'administrateur du site</strong> (${esc(SB_ADMIN_EMAIL)}).<br/>
        Votre compte n'a pas accès à cette page.
      </div></div>
      <div class="form-actions">
        <a class="btn btn-primary" href="espace-eleve.html">Aller à mon espace</a>
        <button class="btn btn-outline" id="btn-deconnexion">Se déconnecter</button>
      </div>`;
    brancherDeconnexion();
    return;
  }

  let profil = null;
  try { profil = await sbAssurerProfil(); } catch (e) {
    contenu.innerHTML = `<div class="callout callout-warning">${ICONS.alert}<div><strong>La base n'est pas encore installée (ou pas à jour).</strong><br/>${esc(e.message)}<br/>(Ré)exécutez <code>supabase/schema.sql</code> dans Supabase.</div></div>`;
    return;
  }
  if (!profil || profil.role !== "enseignant" || statutProfil(profil) !== "accepte") {
    contenu.innerHTML = `
      <div class="callout callout-warning">${ICONS.alert}<div>
        <strong>Votre compte admin n'est pas encore prêt.</strong><br/>
        Connectez-vous avec le compte créé avec l'e-mail <strong>${esc(SB_ADMIN_EMAIL)}</strong>
        après avoir (ré)exécuté le schéma SQL v4 dans Supabase : il devient enseignant validé automatiquement.
      </div></div>
      <div class="form-actions"><button class="btn btn-outline" id="btn-deconnexion">Se déconnecter</button></div>`;
    brancherDeconnexion();
    return;
  }
  sbStockerProfil(profil);
  await chargerClassesDynamiques();

  let profilsTous = [], classesRows = null, devoirsCount = 0;
  try { profilsTous = await sbSelect("profils", "select=*&order=created_at.asc"); } catch (e) { /* vide */ }
  try { classesRows = await sbSelect("classes", "select=*&order=nom.asc"); } catch (e) { classesRows = null; }
  try { devoirsCount = (await sbSelect("devoirs", "select=id")).length; } catch (e) { /* table absente */ }
  const enAttente = profilsTous.filter((x) => statutProfil(x) === "en_attente");
  const nbEns = profilsTous.filter((x) => x.role === "enseignant" && statutProfil(x) === "accepte").length;
  const nbEle = profilsTous.filter((x) => x.role === "eleve" && statutProfil(x) === "accepte").length;
  const uid = session.user.id;

  contenu.innerHTML = `
    <div class="section-head">
      <div>
        <h2>⭐ Administration du site</h2>
        <p>🧑‍🏫 <strong>${esc(profil.nom)}</strong> · ${esc(session.user.email)} · <span class="badge badge-note">⭐ Admin du site</span></p>
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <a class="btn btn-outline btn-sm" href="espace-enseignant.html">🧑‍🏫 Mon interface enseignant</a>
        <button class="btn btn-outline btn-sm" id="btn-deconnexion">Se déconnecter</button>
      </div>
    </div>

    <div class="grid grid-3 mb-3">
      <div class="card stat-card"><div class="num">${enAttente.length}</div><div class="label">⏳ Demandes en attente</div></div>
      <div class="card stat-card"><div class="num">${nbEns}</div><div class="label">Enseignants validés</div></div>
      <div class="card stat-card"><div class="num">${nbEle}</div><div class="label">Élèves validés</div></div>
      <div class="card stat-card"><div class="num">${classesRows ? classesRows.length : listeClasses().length}</div><div class="label">Classes du site</div></div>
      <div class="card stat-card"><div class="num">${devoirsCount}</div><div class="label">Devoirs en ligne (base)</div></div>
      <div class="card stat-card"><div class="num">${profilsTous.length}</div><div class="label">Comptes au total</div></div>
    </div>

    <div class="card mb-3" style="border:2px solid var(--amber)">
      <h2 class="card-title">⏳ Demandes de comptes en attente (${enAttente.length})</h2>
      <p class="text-muted">Chaque nouvel enseignant ou élève inscrit attend votre validation avant de pouvoir se connecter.</p>
      <div id="admin-attente" class="mt-2"></div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">👥 Tous les comptes (${profilsTous.length})</h2>
      <p class="text-muted">Corrigez le rôle, la classe et la matière de chacun, ré-acceptez un compte refusé ou supprimez un profil.</p>
      <div id="admin-comptes" class="mt-2"></div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">🏫 Les classes du site</h2>
      <p class="text-muted">C'est vous qui déterminez les classes proposées à l'inscription et utilisées dans les espaces. Renommer une classe est immédiat ; sa <strong>clé technique</strong> relie les comptes et les devoirs existants (ne la changez pas après coup).</p>
      <div id="admin-classes" class="mt-2"></div>
    </div>

    <div id="admin-msg" class="mb-3"></div>

    <div class="card">
      <h2 class="card-title">🧰 Outils</h2>
      <p class="text-muted">
        <a href="espace-enseignant.html">🧑‍🏫 Mon interface enseignant</a> ·
        <a href="calendrier.html">🗓️ Calendrier officiel</a> ·
        <a href="https://github.com/aymenessouyah/devoirs2026-2027/blob/main/supabase/schema.sql" target="_blank" rel="noopener">Schéma SQL</a> ·
        <a href="https://github.com/aymenessouyah/devoirs2026-2027/blob/main/GUIDE-COMPTES.md" target="_blank" rel="noopener">📖 Guide des comptes</a>
      </p>
    </div>`;

  brancherDeconnexion();
  rendreAttente();
  rendreComptes();
  rendreClasses();

  const badgeStatut = (x) => {
    const st = statutProfil(x);
    return st === "accepte" ? `<span class="badge badge-note">✓ Accepté</span>`
      : st === "refuse" ? `<span class="badge badge-retard">Refusé</span>`
      : `<span class="badge badge-afaire">⏳ En attente</span>`;
  };
  const erreurAdmin = (e) => espaceMessage("#admin-msg", "erreur", esc(e.message));

  /* ----- Demandes en attente ----- */
  function rendreAttente() {
    const zone = $("#admin-attente");
    if (!zone) return;
    zone.innerHTML = enAttente.length ? `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Nom</th><th>Type</th><th>Classe / Matière</th><th>E-mail</th><th>Demandé le</th><th>Décision</th></tr></thead>
        <tbody>
        ${enAttente.map((x) => `
          <tr>
            <td><strong>${esc(x.nom)}</strong></td>
            <td>${x.role === "enseignant" ? "🧑‍🏫 Enseignant" : "👨‍🎓 Élève"}</td>
            <td>${x.classe ? esc(nomClasseDyn(x.classe)) : "—"}${x.matiere ? ` · ${esc(x.matiere)}` : ""}</td>
            <td>${esc(x.email || "—")}</td>
            <td>${dateHeureFr(x.created_at)}</td>
            <td>
              <button class="btn btn-primary btn-sm adm-accepter" data-id="${esc(x.id)}">✅ Accepter</button>
              <button class="btn btn-ghost btn-sm adm-refuser" data-id="${esc(x.id)}">Refuser</button>
            </td>
          </tr>`).join("")}
        </tbody></table></div>`
      : `<p class="text-muted">Aucune demande en attente. 🎉</p>`;
    $$(".adm-accepter", zone).forEach((b) => b.addEventListener("click", async () => {
      try { await sbPatch("profils", `id=eq.${b.dataset.id}`, { statut: "accepte" }); renderEspaceAdmin(); }
      catch (e) { erreurAdmin(e); }
    }));
    $$(".adm-refuser", zone).forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Refuser ce compte ? La personne ne pourra pas se connecter.")) return;
      try { await sbPatch("profils", `id=eq.${b.dataset.id}`, { statut: "refuse" }); renderEspaceAdmin(); }
      catch (e) { erreurAdmin(e); }
    }));
  }

  /* ----- Tous les comptes ----- */
  function rendreComptes() {
    const zone = $("#admin-comptes");
    if (!zone) return;
    zone.innerHTML = profilsTous.length ? `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Classe</th><th>Matière</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>
        ${profilsTous.map((x) => `
          <tr>
            <td><strong>${esc(x.nom)}</strong>${x.id === uid ? ` <span class="badge badge-note">vous</span>` : ""}</td>
            <td>${esc(x.email || "—")}</td>
            <td>
              <select class="adm-role" data-id="${esc(x.id)}" ${x.id === uid ? "disabled" : ""}>
                <option value="eleve" ${x.role === "eleve" ? "selected" : ""}>Élève</option>
                <option value="enseignant" ${x.role === "enseignant" ? "selected" : ""}>Enseignant</option>
              </select>
            </td>
            <td>
              <select class="adm-classe" data-id="${esc(x.id)}">
                <option value="" ${!x.classe ? "selected" : ""}>—</option>
                ${optionsClassesHTML(x.classe || "")}
              </select>
            </td>
            <td>
              <select class="adm-matiere" data-id="${esc(x.id)}">
                <option value="" ${!x.matiere ? "selected" : ""}>—</option>
                ${optionsMatieresHTML(x.matiere || "")}
              </select>
            </td>
            <td>${badgeStatut(x)}</td>
            <td>
              ${statutProfil(x) !== "accepte" ? `<button class="btn btn-primary btn-sm adm-accepter" data-id="${esc(x.id)}">✅ Accepter</button>` : ""}
              ${statutProfil(x) === "accepte" && x.id !== uid ? `<button class="btn btn-ghost btn-sm adm-refuser" data-id="${esc(x.id)}">Refuser</button>` : ""}
              ${x.id !== uid ? `<button class="btn btn-ghost btn-sm adm-supprimer" data-id="${esc(x.id)}">🗑️</button>` : ""}
            </td>
          </tr>`).join("")}
        </tbody></table></div>
      <p class="text-muted mt-1" style="font-size:.85rem">Supprimer un profil empêche la connexion sur ce site (le compte d'authentification Supabase subsiste ; supprimez-le aussi dans Supabase → Authentication si besoin).</p>`
      : `<p class="text-muted">Aucun compte pour le moment.</p>`;

    $$(".adm-role", zone).forEach((sel) => sel.addEventListener("change", async () => {
      try { await sbPatch("profils", `id=eq.${sel.dataset.id}`, { role: sel.value }); renderEspaceAdmin(); }
      catch (e) { erreurAdmin(e); }
    }));
    $$(".adm-classe", zone).forEach((sel) => sel.addEventListener("change", async () => {
      try { await sbPatch("profils", `id=eq.${sel.dataset.id}`, { classe: sel.value || null }); renderEspaceAdmin(); }
      catch (e) { erreurAdmin(e); }
    }));
    $$(".adm-matiere", zone).forEach((sel) => sel.addEventListener("change", async () => {
      try { await sbPatch("profils", `id=eq.${sel.dataset.id}`, { matiere: sel.value || null }); renderEspaceAdmin(); }
      catch (e) { erreurAdmin(e); }
    }));
    $$(".adm-accepter", zone).forEach((b) => b.addEventListener("click", async () => {
      try { await sbPatch("profils", `id=eq.${b.dataset.id}`, { statut: "accepte" }); renderEspaceAdmin(); }
      catch (e) { erreurAdmin(e); }
    }));
    $$(".adm-refuser", zone).forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Refuser ce compte ? La personne ne pourra plus se connecter.")) return;
      try { await sbPatch("profils", `id=eq.${b.dataset.id}`, { statut: "refuse" }); renderEspaceAdmin(); }
      catch (e) { erreurAdmin(e); }
    }));
    $$(".adm-supprimer", zone).forEach((b) => b.addEventListener("click", async () => {
      const x = profilsTous.find((y) => y.id === b.dataset.id);
      if (!confirm(`Supprimer définitivement le profil de « ${x ? x.nom : ""} » ?`)) return;
      try { await sbSupprimer("profils", `id=eq.${b.dataset.id}`); renderEspaceAdmin(); }
      catch (e) { erreurAdmin(e); }
    }));
  }

  /* ----- Les classes du site (déterminées par l'admin) ----- */
  function rendreClasses() {
    const zone = $("#admin-classes");
    if (!zone) return;
    if (!classesRows) {
      zone.innerHTML = `<div class="callout callout-info">${ICONS.info}<div>La table « classes » n'existe pas encore : (ré)exécutez <code>supabase/schema.sql</code> dans Supabase. En attendant, le site utilise les deux classes de la configuration (${listeClasses().map((c) => esc(c.nom)).join(", ")}).</div></div>`;
      return;
    }
    const nbElevesParClasse = (cle) => profilsTous.filter((x) => x.role === "eleve" && x.classe === cle).length;
    zone.innerHTML = `
      <div class="form-grid">
        <div class="field">
          <label for="cl-nom">Nom de la nouvelle classe</label>
          <input type="text" id="cl-nom" placeholder="Ex. : 3ème SI 2" />
        </div>
        <div class="field">
          <label for="cl-cle">Clé technique (générée, modifiable)</label>
          <input type="text" id="cl-cle" placeholder="ex. 3si2" />
        </div>
        <div class="field">
          <label>&nbsp;</label>
          <button class="btn btn-primary" id="cl-ajouter">➕ Ajouter la classe</button>
        </div>
      </div>
      <div id="cl-msg" class="mt-1"></div>
      ${classesRows.length ? `
      <div class="table-wrap mt-2"><table class="table">
        <thead><tr><th>Nom affiché</th><th>Clé technique</th><th>Élèves (comptes)</th><th>Actions</th></tr></thead>
        <tbody>
        ${classesRows.map((c) => `
          <tr>
            <td><input type="text" class="cl-nom-ligne" data-id="${esc(c.id)}" value="${esc(c.nom)}" /></td>
            <td><code>${esc(c.id)}</code></td>
            <td>${nbElevesParClasse(c.id)}</td>
            <td>
              <button class="btn btn-outline btn-sm cl-enregistrer" data-id="${esc(c.id)}">💾 Enregistrer le nom</button>
              <button class="btn btn-ghost btn-sm cl-supprimer" data-id="${esc(c.id)}">🗑️ Supprimer</button>
            </td>
          </tr>`).join("")}
        </tbody></table></div>
      <p class="text-muted mt-1" style="font-size:.85rem">${classesRows.length} classe(s). Supprimer une classe ne supprime ni les comptes ni les devoirs qui portent sa clé : ils ne seront simplement plus proposés.</p>`
      : `<p class="text-muted mt-2">Aucune classe pour le moment : ajoutez la première ci-dessus.</p>`}`;

    $("#cl-nom")?.addEventListener("input", (ev) => {
      const cle = $("#cl-cle");
      if (cle) cle.value = slugClasse(ev.target.value);
    });
    $("#cl-ajouter")?.addEventListener("click", async () => {
      const nom = $("#cl-nom").value.trim();
      const cle = $("#cl-cle").value.trim().toLowerCase();
      if (!nom) { espaceMessage("#cl-msg", "erreur", "Donnez un nom à la classe."); return; }
      if (!/^[a-z0-9][a-z0-9-]*$/.test(cle)) { espaceMessage("#cl-msg", "erreur", "Clé technique invalide : lettres minuscules, chiffres et tirets (ex. 3si2)."); return; }
      if (classesRows.some((c) => c.id === cle)) { espaceMessage("#cl-msg", "erreur", "Cette clé technique existe déjà."); return; }
      try {
        await sbInsert("classes", { id: cle, nom });
        renderEspaceAdmin();
      } catch (e) { espaceMessage("#cl-msg", "erreur", esc(e.message)); }
    });
    $$(".cl-enregistrer", zone).forEach((b) => b.addEventListener("click", async () => {
      const nom = $(`.cl-nom-ligne[data-id="${b.dataset.id}"]`, zone)?.value.trim();
      if (!nom) { espaceMessage("#cl-msg", "erreur", "Le nom ne peut pas être vide."); return; }
      try {
        await sbPatch("classes", `id=eq.${encodeURIComponent(b.dataset.id)}`, { nom });
        renderEspaceAdmin();
      } catch (e) { espaceMessage("#cl-msg", "erreur", esc(e.message)); }
    }));
    $$(".cl-supprimer", zone).forEach((b) => b.addEventListener("click", async () => {
      const c = classesRows.find((x) => x.id === b.dataset.id);
      const nb = nbElevesParClasse(b.dataset.id);
      if (!confirm(`Supprimer la classe « ${c ? c.nom : ""} » ?${nb ? `\n${nb} compte(s) élève portent encore cette classe.` : ""}`)) return;
      try {
        await sbSupprimer("classes", `id=eq.${encodeURIComponent(b.dataset.id)}`);
        renderEspaceAdmin();
      } catch (e) { espaceMessage("#cl-msg", "erreur", esc(e.message)); }
    }));
  }
}

/* ---------- Démarrage (pages des espaces) ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "connexion") renderConnexion();
  else if (page === "espace-eleve") renderEspaceEleve();
  else if (page === "espace-enseignant") renderEspaceEnseignant();
  else if (page === "espace-admin") renderEspaceAdmin();
});
