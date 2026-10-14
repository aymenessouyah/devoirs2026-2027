/* ============================================================
   Espaces connectés (Phase 3 — Supabase) :
   connexion, espace élève, espace enseignant.
   Utilise le mini-client de js/supabase.js (même projet que
   l'espace Vie scolaire). Les devoirs/annonces restent dans les
   fichiers data/ ; seuls comptes, notes en ligne et dépôts de
   fichiers sont dans la base.
   ============================================================ */

function espaceMessage(zoneId, type, texte) {
  const zone = $(zoneId);
  if (!zone) return;
  const cls = type === "erreur" ? "callout-warning" : type === "succes" ? "callout-success" : "callout-info";
  const icone = type === "erreur" ? ICONS.alert : type === "succes" ? ICONS.check : ICONS.info;
  zone.innerHTML = `<div class="callout ${cls}">${icone}<div>${texte}</div></div>`;
}

/* Inscription : le code est vérifié dans l'annuaire en base (géré par
   l'enseignant depuis le site) ; repli sur le fichier data/eleves.js. */
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

/* ---------- Garde d'accès commun ---------- */
async function accesEspace(roleAttendu) {
  const contenu = $("#espace-contenu");
  const session = await sbSessionValide();
  if (!session) {
    location.href = "connexion.html";
    return null;
  }
  let profil = null;
  try {
    profil = await sbMonProfil();
  } catch (e) {
    if (contenu) {
      contenu.innerHTML = `
        <div class="callout callout-warning">${ICONS.alert}<div>
          <strong>La base de données n'est pas encore installée.</strong><br/>
          ${esc(e.message)}<br/>
          L'enseignant doit d'abord exécuter le script <code>supabase/schema.sql</code>
          (voir le guide de mise en place des comptes).
        </div></div>`;
    }
    return null;
  }
  if (!profil) {
    /* Compte d'authentification existant (ex. créé sur Vie scolaire) sans profil ici */
    if (contenu) {
      contenu.innerHTML = `
        <div class="card">
          <h2 class="card-title">👋 Bienvenue ! Dernière étape : votre profil</h2>
          <p class="text-muted">Votre compte de connexion existe déjà, mais pas encore votre profil sur ce site.</p>
          <div class="form-grid mt-2">
            <div class="field full">
              <label for="profil-nom">Nom affiché</label>
              <input type="text" id="profil-nom" placeholder="Ex. : Prénom NOM" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" id="btn-creer-profil">Créer mon profil</button>
            <button class="btn btn-ghost" id="btn-deco">Se déconnecter</button>
          </div>
          <div id="profil-msg" class="mt-2"></div>
        </div>`;
      $("#btn-deco")?.addEventListener("click", async () => { await sbDeconnexion(); location.href = "connexion.html"; });
      $("#btn-creer-profil")?.addEventListener("click", async () => {
        const nom = $("#profil-nom").value.trim();
        if (!nom) { espaceMessage("#profil-msg", "erreur", "Indiquez votre nom."); return; }
        try {
          await sbCreerProfil({ id: session.user.id, role: "eleve", nom, classe: null, code: null });
          location.reload();
        } catch (err) {
          espaceMessage("#profil-msg", "erreur", esc(err.message));
        }
      });
    }
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
          <strong>Compte non activé comme enseignant.</strong><br/>
          Votre compte « ${esc(profil.nom)} » existe, mais il n'a pas encore le rôle enseignant.
          ${sbEstAdminEmail(session.user.email) ? `Votre e-mail est celui de l'<strong>admin du site</strong> : la promotion est automatique dès que le schéma SQL à jour est exécuté dans Supabase — (ré)exécutez <code>supabase/schema.sql</code>, puis reconnectez-vous.<br/>` : `Dans Supabase (SQL Editor), exécutez :<br/>`}
          <code>update public.profils set role = 'enseignant' where id = (select id from auth.users where email = '${esc(session.user.email || "")}');</code><br/>
          puis reconnectez-vous.
        </div></div>
        <div class="form-actions"><button class="btn btn-outline" id="btn-deco">Se déconnecter</button></div>`;
      $("#btn-deco")?.addEventListener("click", async () => { await sbDeconnexion(); location.href = "connexion.html"; });
    }
    return null;
  }
  return { session, profil };
}

function enteteEspaceHTML(profil, titre, email) {
  return `
    <div class="section-head">
      <div>
        <h2>${titre}</h2>
        <p>${profil.role === "enseignant" ? "🧑‍🏫" : "👨‍🎓"} <strong>${esc(profil.nom)}</strong>
        ${profil.classe ? `· ${esc(nomClasse(profil.classe))}` : ""}${profil.code ? ` · code ${esc(profil.code)}` : ""}${sbEstAdminEmail(email) ? ` · <span class="badge badge-note">⭐ Admin du site</span>` : ""}</p>
      </div>
      <button class="btn btn-outline btn-sm" id="btn-deconnexion">Se déconnecter</button>
    </div>`;
}

function brancherDeconnexion() {
  $("#btn-deconnexion")?.addEventListener("click", async () => {
    await sbDeconnexion();
    location.href = "connexion.html";
  });
}

/* ============================================================
   PAGE CONNEXION
   ============================================================ */
function renderConnexion() {
  if (sbConnecte()) {
    location.href = "espace-eleve.html";
    return;
  }

  /* Onglets Élève / Enseignant */
  const panneaux = { eleve: $("#panneau-eleve"), enseignant: $("#panneau-enseignant") };
  $$(".onglet-connexion").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".onglet-connexion").forEach((b) => b.classList.replace("btn-secondary", "btn-ghost"));
      btn.classList.replace("btn-ghost", "btn-secondary");
      Object.entries(panneaux).forEach(([cle, el]) => { if (el) el.classList.toggle("hidden", cle !== btn.dataset.panneau); });
    });
  });

  /* État de la base */
  sbBasePrete().then((prete) => {
    const zone = $("#etat-base");
    if (zone && !prete) {
      zone.innerHTML = `<div class="callout callout-warning">${ICONS.alert}<div><strong>Base de données pas encore installée.</strong> L'enseignant doit d'abord suivre le guide de mise en place des comptes (script SQL dans Supabase). Les inscriptions échoueront tant que ce n'est pas fait.</div></div>`;
    }
  });

  /* --- Élève : connexion --- */
  $("#form-eleve-connexion")?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const code = $("#el-co-code").value.trim();
    const mdp = $("#el-co-mdp").value;
    try {
      await sbConnexion(emailEleve(code), mdp);
      location.href = "espace-eleve.html";
    } catch (e) {
      espaceMessage("#msg-eleve", "erreur", esc(e.message));
    }
  });

  /* --- Élève : inscription --- */
  $("#form-eleve-inscription")?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const code = $("#el-in-code").value.trim().toUpperCase();
    const mdp = $("#el-in-mdp").value;
    const mdp2 = $("#el-in-mdp2").value;
    const fiche = await trouverElevePourInscription(code);
    if (!fiche) { espaceMessage("#msg-eleve", "erreur", "Code élève inconnu. Vérifiez le code donné par votre enseignant (ex. 3SI1-01)."); return; }
    if (mdp.length < 6) { espaceMessage("#msg-eleve", "erreur", "Mot de passe trop court (6 caractères minimum)."); return; }
    if (mdp !== mdp2) { espaceMessage("#msg-eleve", "erreur", "Les deux mots de passe ne correspondent pas."); return; }
    try {
      const session = await sbInscription(emailEleve(code), mdp);
      await sbCreerProfil({ id: session.user.id, role: "eleve", nom: fiche.nom, classe: fiche.classe, code: fiche.code });
      espaceMessage("#msg-eleve", "succes", `Compte créé, bienvenue ${esc(fiche.nom)} ! Redirection…`);
      setTimeout(() => { location.href = "espace-eleve.html"; }, 700);
    } catch (e) {
      await sbDeconnexion();
      espaceMessage("#msg-eleve", "erreur", esc(e.message));
    }
  });

  /* --- Enseignant : connexion --- */
  $("#form-prof-connexion")?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    try {
      await sbConnexion($("#pr-co-email").value.trim(), $("#pr-co-mdp").value);
      location.href = "espace-enseignant.html";
    } catch (e) {
      espaceMessage("#msg-prof", "erreur", esc(e.message));
    }
  });

  /* --- Enseignant : inscription --- */
  $("#form-prof-inscription")?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const nom = $("#pr-in-nom").value.trim();
    const email = $("#pr-in-email").value.trim();
    const mdp = $("#pr-in-mdp").value;
    if (!nom || !email) { espaceMessage("#msg-prof", "erreur", "Nom et e-mail sont obligatoires."); return; }
    try {
      const session = await sbInscription(email, mdp);
      await sbCreerProfil({ id: session.user.id, role: "eleve", nom, classe: null, code: null });
      espaceMessage("#msg-prof", "succes", "Compte créé ! Dernière étape : promouvez-le en enseignant dans Supabase (SQL du guide), puis connectez-vous.");
    } catch (e) {
      espaceMessage("#msg-prof", "erreur", esc(e.message));
    }
  });
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

  /* Données en ligne (base) + repli sur les fichiers (ancien système) */
  let notesDB = [], rendusDB = [];
  try { notesDB = await sbSelect("notes", `select=*&eleve_id=eq.${uid}&order=date.asc`); } catch (e) { /* vide */ }
  try { rendusDB = await sbSelect("rendus", `select=*&eleve_id=eq.${uid}&order=date.desc`); } catch (e) { /* vide */ }

  const fiche = ELEVES.find((e) => String(e.code).toUpperCase() === String(profil.code || "").toUpperCase());
  const notesAff = notesDB.length
    ? notesDB.map((n) => ({ devoir: n.devoir_id, note: n.note, sur: n.sur, appreciation: n.appreciation, date: n.date }))
    : (fiche ? NOTES.filter((n) => n.eleve === fiche.id) : []);
  const rendusIds = new Set(rendusDB.map((r) => r.devoir_id));
  if (fiche) RENDUS.filter((r) => r.eleve === fiche.id).forEach((r) => rendusIds.add(r.devoir));

  const devoirsClasse = DEVOIRS.filter((d) => d.classe === profil.classe);
  const aDeposer = trierDevoirs(devoirsClasse.filter((d) => !d.examen));
  const examens = trierDevoirs(devoirsClasse.filter((d) => d.examen && joursRestants(d.echeance) >= 0)).slice(0, 5);
  const moyenne = notesAff.length
    ? notesAff.reduce((s, n) => s + (Number(n.note) / Number(n.sur || 20)) * 20, 0) / notesAff.length
    : null;
  const nbAfaire = devoirsClasse.filter((d) => !d.examen).length;
  const nbExamens = devoirsClasse.filter((d) => d.examen).length;
  const pctRendus = nbAfaire ? Math.round((rendusIds.size / nbAfaire) * 100) : 0;
  const pctNotes = nbExamens ? Math.round((notesAff.length / nbExamens) * 100) : 0;

  const statutRendu = (d) => {
    const rDB = rendusDB.find((r) => r.devoir_id === d.id);
    if (rDB) return { txt: `Rendu le ${dateHeureFr(rDB.date)}`, cls: "badge-rendu" };
    if (rendusIds.has(d.id)) return { txt: "Rendu (fichier)", cls: "badge-rendu" };
    if (d.corrige) return { txt: "Corrigé", cls: "badge-corrigé" };
    return joursRestants(d.echeance) < 0
      ? { txt: "En retard", cls: "badge-retard" }
      : { txt: "À faire", cls: "badge-afaire" };
  };

  contenu.innerHTML = `
    ${enteteEspaceHTML(profil, "🎒 Mon espace élève", session.user.email)}

    <div class="grid grid-3 mb-3">
      <div class="card stat-card"><div class="num">${moyenne !== null ? fmtNote(moyenne) + "/20" : "—"}</div><div class="label">Moyenne générale</div></div>
      <div class="card stat-card"><div class="num">${nbExamens}</div><div class="label">Épreuves (DC + DS) cette année</div></div>
      <div class="card stat-card"><div class="num">${notesAff.length}</div><div class="label">Notes reçues</div></div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">📈 Ma progression</h2>
      ${nbAfaire ? `
      <div class="progress-block mt-2">
        <div class="progress-legend"><span>Dépôts effectués</span><strong>${pctRendus}%</strong></div>
        <div class="progress"><div class="progress-fill" style="width:${pctRendus}%"></div></div>
      </div>` : ""}
      <div class="progress-block mt-2">
        <div class="progress-legend"><span>Épreuves notées</span><strong>${pctNotes}%</strong></div>
        <div class="progress"><div class="progress-fill" style="width:${pctNotes}%"></div></div>
      </div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">📌 Mes devoirs à déposer</h2>
      <div id="liste-devoirs-eleve">
      ${aDeposer.map((d) => {
        const st = statutRendu(d);
        const deja = rendusDB.find((r) => r.devoir_id === d.id);
        return `
        <div class="horaire-cours" style="border-left-color:${d.classe === "3si1" ? "var(--rose)" : "var(--cyan)"}">
          <span class="horaire-heure">${fmtDateCourte(d.echeance)}</span>
          <span class="intitule">${esc(d.titre)}<br/>
            <span class="badge ${st.cls}">${st.txt}</span>
            <button class="btn btn-primary btn-sm btn-deposer" data-devoir="${esc(d.id)}">${deja ? "Modifier mon dépôt" : "Déposer"}</button>
          </span>
          <span class="salle">${echeanceTexte(d.echeance)}</span>
        </div>
        <div class="depot-zone hidden" id="depot-zone-${esc(d.id)}">
          <div class="form-grid">
            <div class="field full">
              <label>Fichier à déposer (PDF, image, .zip…)</label>
              <input type="file" id="fichier-${esc(d.id)}" />
            </div>
            <div class="field full">
              <label>…ou lien vers mon travail (Google Drive)</label>
              <input type="url" id="lien-${esc(d.id)}" placeholder="https://drive.google.com/…" value="${esc(deja ? deja.lien || "" : "")}" />
            </div>
            <div class="field full">
              <label>Commentaire</label>
              <input type="text" id="commentaire-${esc(d.id)}" value="${esc(deja ? deja.commentaire || "" : "")}" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary btn-envoyer-depot" data-devoir="${esc(d.id)}">📤 Envoyer le dépôt</button>
            <span class="text-muted" id="msg-depot-${esc(d.id)}"></span>
          </div>
        </div>`;
      }).join("") || `<div class="empty">${ICONS.inbox}<p>Rien à déposer : les devoirs de contrôle et de synthèse sont des épreuves passées en classe. 📝</p></div>`}
      </div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">📝 Mes prochaines épreuves</h2>
      ${examens.map((d) => `
        <div class="horaire-cours" style="border-left-color:var(--violet)">
          <span class="horaire-heure" style="background:var(--soft-violet);color:var(--violet)">${fmtDateCourte(d.echeance)}</span>
          <span class="intitule">${esc(d.titre)}</span>
          <span class="salle">${echeanceTexte(d.echeance)}</span>
        </div>`).join("") || `<p class="text-muted">Aucune épreuve à venir.</p>`}
    </div>

    <div class="card">
      <h2 class="card-title">🎯 Mes notes</h2>
      ${notesAff.length ? `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Devoir</th><th>Note</th><th>Appréciation</th><th>Date</th></tr></thead>
        <tbody>
        ${notesAff.map((n) => {
          const d = getDevoir(n.devoir);
          return `<tr><td>${esc(d ? d.titre : n.devoir)}</td><td><strong>${fmtNote(n.note)}/${fmtNote(n.sur || 20)}</strong></td><td>${esc(n.appreciation || "")}</td><td>${n.date ? fmtDateCourte(n.date) : ""}</td></tr>`;
        }).join("")}
        </tbody></table></div>` : `<p class="text-muted">Aucune note pour le moment. Vos notes apparaîtront ici dès leur saisie par l'enseignant.</p>`}
    </div>`;

  brancherDeconnexion();

  /* Ouverture/fermeture des zones de dépôt */
  $$(".btn-deposer", contenu).forEach((btn) => {
    btn.addEventListener("click", () => {
      const zone = $(`#depot-zone-${btn.dataset.devoir}`);
      if (zone) zone.classList.toggle("hidden");
    });
  });

  /* Envoi d'un dépôt */
  $$(".btn-envoyer-depot", contenu).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const devoirId = btn.dataset.devoir;
      const msg = $(`#msg-depot-${devoirId}`);
      const fichier = $(`#fichier-${devoirId}`)?.files?.[0] || null;
      const lien = $(`#lien-${devoirId}`)?.value.trim() || "";
      const commentaire = $(`#commentaire-${devoirId}`)?.value.trim() || "";
      if (!fichier && !lien) { if (msg) msg.textContent = "Choisissez un fichier ou collez un lien."; return; }
      btn.disabled = true;
      if (msg) msg.textContent = "Envoi en cours…";
      try {
        let chemin = "";
        const ancien = rendusDB.find((r) => r.devoir_id === devoirId);
        if (ancien && ancien.fichier) chemin = ancien.fichier;
        if (fichier) chemin = await sbEnvoyerFichier(sbCheminFichier(uid, devoirId, fichier.name), fichier);
        await sbUpsert("rendus", {
          eleve_id: uid, devoir_id: devoirId, lien,
          fichier: chemin, commentaire, date: new Date().toISOString()
        }, "eleve_id,devoir_id");
        if (msg) msg.textContent = "Dépôt enregistré ✓";
        setTimeout(() => renderEspaceEleve(), 800);
      } catch (e) {
        if (msg) msg.textContent = e.message;
        btn.disabled = false;
      }
    });
  });
}

/* ============================================================
   ESPACE ENSEIGNANT
   ============================================================ */
async function renderEspaceEnseignant() {
  const contenu = $("#espace-contenu");
  if (!contenu) return;
  const acces = await accesEspace("enseignant");
  if (!acces) return;
  const { profil } = acces;

  let elevesInscrits = [], rendusTous = [], notesToutes = [];
  try { elevesInscrits = await sbSelect("profils", "select=*&role=eq.eleve&order=classe.asc,nom.asc"); } catch (e) { /* vide */ }
  try { rendusTous = await sbSelect("rendus", "select=*&order=date.desc"); } catch (e) { /* vide */ }
  try { notesToutes = await sbSelect("notes", "select=*"); } catch (e) { /* vide */ }

  const codesInscrits = new Set(elevesInscrits.map((p) => String(p.code || "").toUpperCase()));
  const nonInscrits = ELEVES.filter((e) => !codesInscrits.has(String(e.code).toUpperCase()));

  contenu.innerHTML = `
    ${enteteEspaceHTML(profil, "🧑‍🏫 Espace enseignant", acces.session.user.email)}

    <div class="grid grid-3 mb-3">
      <div class="card stat-card"><div class="num">${elevesInscrits.length}</div><div class="label">Élèves inscrits</div></div>
      <div class="card stat-card"><div class="num">${rendusTous.length}</div><div class="label">Dépôts reçus</div></div>
      <div class="card stat-card"><div class="num">${notesToutes.length}</div><div class="label">Notes saisies en ligne</div></div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">🗓️ Choisir la date d'un devoir (calendrier officiel)</h2>
      <p class="text-muted">Choisissez la classe, puis le devoir : le calendrier n'autorise que les dates compatibles avec le calendrier officiel tunisien (jours de cours de la classe, hors vacances, jours fériés et semaines bloquées). La modification générée se colle ensuite dans <code>data/devoirs.js</code>.</p>
      <div id="calendrier-choix-enseignant" class="mt-2"></div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">📊 Suivi par devoir — dépôts et saisie des notes</h2>
      <div class="form-grid mt-2">
        <div class="field full">
          <label for="suivi-devoir">Devoir</label>
          <select id="suivi-devoir">
            <option value="">— Choisir un devoir —</option>
            ${trierDevoirs(DEVOIRS).map((d) => `<option value="${esc(d.id)}">${esc(nomClasse(d.classe))} · ${esc(d.titre)} (${fmtDateCourte(d.echeance)})</option>`).join("")}
          </select>
        </div>
      </div>
      <div id="suivi-resultat" class="mt-2">
        <p class="text-muted">Choisissez un devoir pour voir qui a déposé et saisir les notes (enregistrées dans la base, visibles aussitôt par les élèves).</p>
      </div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">👨‍🎓 Élèves inscrits (${elevesInscrits.length})</h2>
      ${elevesInscrits.length ? `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Nom</th><th>Classe</th><th>Code</th><th>Inscription</th></tr></thead>
        <tbody>
        ${elevesInscrits.map((p) => `<tr><td>${esc(p.nom)}</td><td>${p.classe ? esc(nomClasse(p.classe)) : ""}</td><td>${esc(p.code || "")}</td><td>${dateHeureFr(p.created_at)}</td></tr>`).join("")}
        </tbody></table></div>` : `<p class="text-muted">Aucun élève inscrit pour le moment.</p>`}
      ${nonInscrits.length ? `<p class="text-muted mt-2">⏳ Sans compte pour le moment (${nonInscrits.length}) : ${nonInscrits.map((e) => esc(e.nom)).join(", ")}.</p>` : ""}
    </div>

    <div class="card mb-3">
      <h2 class="card-title">📋 Annuaire des élèves — codes d'inscription</h2>
      <p class="text-muted">Ajoutez ou corrigez ici les élèves autorisés à créer un compte (nom, classe, code). Effet immédiat à l'inscription, sans toucher aux fichiers du site.</p>
      <div id="gestion-eleves" class="mt-2"><p class="text-muted">Chargement…</p></div>
    </div>

    <div class="card mb-3">
      <h2 class="card-title">🧑‍🏫 Enseignants du site</h2>
      <p class="text-muted">Promouvez un compte en enseignant ou corrigez un nom. (La personne crée d'abord son compte sur la page Connexion, onglet Enseignant.)</p>
      <div id="gestion-enseignants" class="mt-2"><p class="text-muted">Chargement…</p></div>
    </div>

    <div class="card">
      <h2 class="card-title">🧰 Outils</h2>
      <p class="text-muted">
        <a href="admin.html">Générateurs (devoirs, annonces…)</a> ·
        <a href="calendrier.html">Calendrier officiel</a> ·
        <a href="https://github.com/aymenessouyah/devoirs2026-2027/blob/main/supabase/schema.sql" target="_blank" rel="noopener">Schéma SQL de la base</a>
      </p>
    </div>`;

  brancherDeconnexion();
  const zoneChoixEns = $("#calendrier-choix-enseignant");
  if (zoneChoixEns && typeof creerCalendrierChoix === "function") creerCalendrierChoix(zoneChoixEns);
  chargerAnnuaire();
  chargerEnseignants();

  /* ---------- Annuaire des élèves (table « eleves ») ---------- */
  async function chargerAnnuaire() {
    const zone = $("#gestion-eleves");
    if (!zone) return;
    let annuaire = null;
    try {
      annuaire = await sbSelect("eleves", "select=*&order=classe.asc,nom.asc");
    } catch (e) { /* table absente : schéma SQL à mettre à jour */ }

    if (!annuaire) {
      zone.innerHTML = `
        <div class="callout callout-info">${ICONS.info}<div>
          L'annuaire en ligne n'est pas encore actif (table « eleves » absente).
          (Ré)exécutez <code>supabase/schema.sql</code> dans Supabase pour l'activer.
          En attendant, la liste des fichiers reste utilisée : ${ELEVES.length} élèves
          (${ELEVES.map((e) => esc(e.nom)).join(", ")}).
        </div></div>`;
      return;
    }

    const codesComptes = new Set(elevesInscrits.map((p) => String(p.code || "").toUpperCase()));
    const classesCfg = Object.entries(CFG.classes || {});
    const prefixe = (cle) => cle.toUpperCase();
    const codeSuggere = (cle) => {
      const p = prefixe(cle);
      const nums = [...annuaire, ...ELEVES]
        .filter((e) => e.classe === cle && String(e.code).toUpperCase().startsWith(p + "-"))
        .map((e) => Number(String(e.code).split("-")[1]) || 0);
      return `${p}-${String(Math.max(0, ...nums) + 1).padStart(2, "0")}`;
    };

    function rendre(modeId) {
      const enEdition = modeId ? annuaire.find((e) => e.id === modeId) : null;
      zone.innerHTML = `
        <div class="form-grid">
          <div class="field">
            <label for="ge-nom">Nom de l'élève</label>
            <input type="text" id="ge-nom" placeholder="Ex. : Prénom NOM" value="${enEdition ? esc(enEdition.nom) : ""}" />
          </div>
          <div class="field">
            <label for="ge-classe">Classe</label>
            <select id="ge-classe">
              ${classesCfg.map(([cle, nom]) => `<option value="${cle}" ${enEdition && enEdition.classe === cle ? "selected" : ""}>${esc(nom)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="ge-code">Code d'inscription</label>
            <input type="text" id="ge-code" style="text-transform:uppercase" value="${enEdition ? esc(enEdition.code) : esc(codeSuggere(classesCfg[0][0]))}" />
          </div>
          <div class="field">
            <label>&nbsp;</label>
            <div style="display:flex;gap:.5rem">
              <button class="btn btn-primary" id="ge-enregistrer">${enEdition ? "💾 Enregistrer" : "➕ Ajouter l'élève"}</button>
              ${enEdition ? `<button class="btn btn-ghost" id="ge-annuler">Annuler</button>` : ""}
            </div>
          </div>
        </div>
        <div id="ge-msg" class="mt-1"></div>
        ${annuaire.length === 0 ? `
        <div class="callout callout-info mt-2">${ICONS.info}<div>
          L'annuaire est vide. <button class="btn btn-outline btn-sm" id="ge-import">📥 Importer les ${ELEVES.length} élèves des fichiers</button>
          pour démarrer avec vos listes actuelles.
        </div></div>` : `
        <div class="table-wrap mt-2"><table class="table">
          <thead><tr><th>Nom</th><th>Classe</th><th>Code</th><th>Compte</th><th>Actions</th></tr></thead>
          <tbody>
          ${annuaire.map((e) => `
            <tr>
              <td>${esc(e.nom)}</td>
              <td>${esc(nomClasse(e.classe))}</td>
              <td><strong>${esc(e.code)}</strong></td>
              <td>${codesComptes.has(String(e.code).toUpperCase()) ? `<span class="badge badge-note">✓ Créé</span>` : `<span class="badge badge-afaire">En attente</span>`}</td>
              <td>
                <button class="btn btn-ghost btn-sm ge-modif" data-id="${esc(e.id)}">✏️ Modifier</button>
                <button class="btn btn-ghost btn-sm ge-suppr" data-id="${esc(e.id)}">🗑️ Supprimer</button>
              </td>
            </tr>`).join("")}
          </tbody></table></div>
        <p class="text-muted mt-1" style="font-size:.85rem">${annuaire.length} élève(s) dans l'annuaire. Supprimer un élève de l'annuaire ne supprime pas son compte s'il est déjà créé.</p>`}`;

      $("#ge-classe")?.addEventListener("change", (ev) => {
        if (!modeId) $("#ge-code").value = codeSuggere(ev.target.value);
      });
      $("#ge-annuler")?.addEventListener("click", () => rendre(null));
      $("#ge-import")?.addEventListener("click", async () => {
        try {
          await sbUpsert("eleves", ELEVES.map((e) => ({ nom: e.nom, classe: e.classe, code: e.code })), "code");
          chargerAnnuaire();
        } catch (e) { espaceMessage("#ge-msg", "erreur", esc(e.message)); }
      });
      $$(".ge-modif", zone).forEach((b) => b.addEventListener("click", () => rendre(b.dataset.id)));
      $$(".ge-suppr", zone).forEach((b) => b.addEventListener("click", async () => {
        const e = annuaire.find((x) => x.id === b.dataset.id);
        if (!e || !confirm(`Supprimer « ${e.nom} » (${e.code}) de l'annuaire ?`)) return;
        try {
          await sbReq(`eleves?id=eq.${e.id}`, { method: "DELETE" });
          chargerAnnuaire();
        } catch (err) { espaceMessage("#ge-msg", "erreur", esc(err.message)); }
      }));
      $("#ge-enregistrer")?.addEventListener("click", async () => {
        const nom = $("#ge-nom").value.trim();
        const classe = $("#ge-classe").value;
        const code = $("#ge-code").value.trim().toUpperCase();
        if (!nom || !code) { espaceMessage("#ge-msg", "erreur", "Nom et code sont obligatoires."); return; }
        try {
          if (modeId) await sbReq(`eleves?id=eq.${modeId}`, { method: "PATCH", body: { nom, classe, code }, prefer: "return=representation" });
          else await sbReq("eleves", { method: "POST", body: { nom, classe, code }, prefer: "return=representation" });
          chargerAnnuaire();
        } catch (err) {
          espaceMessage("#ge-msg", "erreur", /duplicate|unique/i.test(err.message) ? "Ce code existe déjà dans l'annuaire." : esc(err.message));
        }
      });
    }

    rendre(null);
  }

  /* ---------- Gestion des enseignants (table « profils ») ---------- */
  async function chargerEnseignants() {
    const zone = $("#gestion-enseignants");
    if (!zone) return;
    let profils = [];
    try {
      profils = await sbSelect("profils", "select=*&order=nom.asc");
    } catch (e) {
      zone.innerHTML = `<p class="text-muted">Impossible de charger les comptes (${esc(e.message)}).</p>`;
      return;
    }
    const uid = acces.session.user.id;
    const enseignants = profils.filter((p) => p.role === "enseignant");
    const enAttente = profils.filter((p) => p.role !== "enseignant" && !p.classe);
    const ligne = (p, boutons) => `
      <tr>
        <td>${esc(p.nom)}${p.id === uid ? ` <span class="badge badge-note">vous</span>` : ""}${sbEstAdminEmail(p.id === uid ? acces.session.user.email : "") ? ` <span class="badge badge-note">⭐ Admin</span>` : ""}</td>
        <td>${p.role === "enseignant" ? "Enseignant" : "Compte à activer"}</td>
        <td>${boutons}</td>
      </tr>`;
    zone.innerHTML = `
      ${enseignants.length || enAttente.length ? `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Nom</th><th>Rôle</th><th>Actions</th></tr></thead>
        <tbody>
        ${enseignants.map((p) => ligne(p, `
          <button class="btn btn-ghost btn-sm pr-renommer" data-id="${esc(p.id)}">✏️ Renommer</button>
          ${p.id !== uid ? `<button class="btn btn-ghost btn-sm pr-retro" data-id="${esc(p.id)}">Rétrograder</button>` : ""}`)).join("")}
        ${enAttente.map((p) => ligne(p, `
          <button class="btn btn-primary btn-sm pr-promouvoir" data-id="${esc(p.id)}">🧑‍🏫 Promouvoir enseignant</button>
          <button class="btn btn-ghost btn-sm pr-renommer" data-id="${esc(p.id)}">✏️ Renommer</button>`)).join("")}
        </tbody></table></div>` : `<p class="text-muted">Aucun autre compte enseignant.</p>`}
      <p class="text-muted mt-1" style="font-size:.85rem">Pour ajouter un enseignant : la personne crée son compte (page Connexion → onglet Enseignant), puis vous la promouvez ici. Les comptes élèves (avec une classe) ne sont pas listés dans ce tableau.</p>`;

    $$(".pr-promouvoir", zone).forEach((b) => b.addEventListener("click", async () => {
      try {
        await sbReq(`profils?id=eq.${b.dataset.id}`, { method: "PATCH", body: { role: "enseignant" }, prefer: "return=representation" });
        renderEspaceEnseignant();
      } catch (e) { alert(e.message); }
    }));
    $$(".pr-retro", zone).forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Rétrograder ce compte en simple compte (il perdra l'accès enseignant) ?")) return;
      try {
        await sbReq(`profils?id=eq.${b.dataset.id}`, { method: "PATCH", body: { role: "eleve" }, prefer: "return=representation" });
        renderEspaceEnseignant();
      } catch (e) { alert(e.message); }
    }));
    $$(".pr-renommer", zone).forEach((b) => b.addEventListener("click", async () => {
      const p = profils.find((x) => x.id === b.dataset.id);
      const nouveau = prompt("Nom affiché :", p ? p.nom : "");
      if (!nouveau || !nouveau.trim()) return;
      try {
        await sbReq(`profils?id=eq.${b.dataset.id}`, { method: "PATCH", body: { nom: nouveau.trim() }, prefer: "return=representation" });
        renderEspaceEnseignant();
      } catch (e) { alert(e.message); }
    }));
  }

  const zoneRes = $("#suivi-resultat");
  $("#suivi-devoir")?.addEventListener("change", async (ev) => {
    const d = getDevoir(ev.target.value);
    if (!d || !zoneRes) { if (zoneRes) zoneRes.innerHTML = ""; return; }
    zoneRes.innerHTML = `<p class="text-muted">Chargement…</p>`;
    let rendus = [], notes = [];
    try { rendus = await sbSelect("rendus", `select=*&devoir_id=eq.${d.id}`); } catch (e) { /* vide */ }
    try { notes = await sbSelect("notes", `select=*&devoir_id=eq.${d.id}`); } catch (e) { /* vide */ }

    const inscritsClasse = elevesInscrits.filter((p) => p.classe === d.classe);
    const lignes = inscritsClasse.map((p) => {
      const r = rendus.find((x) => x.eleve_id === p.id);
      const n = notes.find((x) => x.eleve_id === p.id);
      const fiche = ELEVES.find((e) => String(e.code).toUpperCase() === String(p.code || "").toUpperCase());
      const noteFichier = fiche ? getNote(fiche.id, d.id) : null;
      const renduFichier = fiche ? estRendu(fiche.id, d.id) : false;
      let statut;
      if (n) statut = `<span class="badge badge-note">Noté ${fmtNote(n.note)}/${fmtNote(n.sur)}</span>`;
      else if (r) statut = `<span class="badge badge-rendu">Rendu le ${dateHeureFr(r.date)}</span>`;
      else if (renduFichier) statut = `<span class="badge badge-rendu">Rendu (fichier)</span>`;
      else if (joursRestants(d.echeance) < 0 && !d.corrige) statut = `<span class="badge badge-retard">Non rendu</span>`;
      else statut = `<span class="badge badge-afaire">En attente</span>`;
      const lienFichier = r && r.fichier
        ? `<button class="btn btn-ghost btn-sm btn-voir-fichier" data-chemin="${esc(r.fichier)}">📎 Fichier</button>`
        : r && r.lien ? `<a class="btn btn-ghost btn-sm" href="${esc(r.lien)}" target="_blank" rel="noopener">🔗 Lien</a>` : "";
      return `
      <tr>
        <td>${esc(p.nom)}<br/><span class="text-muted" style="font-size:.8rem">${esc(p.code || "")}</span></td>
        <td>${statut} ${lienFichier}${r && r.commentaire ? `<br/><span class="text-muted" style="font-size:.8rem">« ${esc(r.commentaire)} »</span>` : ""}
          ${noteFichier && !n ? `<br/><span class="text-muted" style="font-size:.8rem">Note fichier : ${fmtNote(noteFichier.note)}/${fmtNote(noteFichier.sur)}</span>` : ""}</td>
        <td><input type="text" class="input-note" data-eleve="${esc(p.id)}" value="${n ? esc(String(n.note)) : ""}" placeholder="—" style="width:70px" /></td>
        <td><input type="text" class="input-sur" data-eleve="${esc(p.id)}" value="${n ? esc(String(n.sur)) : "20"}" style="width:55px" /></td>
        <td><input type="text" class="input-app" data-eleve="${esc(p.id)}" value="${n ? esc(n.appreciation || "") : ""}" placeholder="Appréciation" /></td>
        <td><button class="btn btn-primary btn-sm btn-enregistrer-note" data-eleve="${esc(p.id)}">Enregistrer</button>
            <span class="text-muted retour-note" data-eleve="${esc(p.id)}"></span></td>
      </tr>`;
    }).join("");

    zoneRes.innerHTML = inscritsClasse.length ? `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Élève</th><th>Dépôt</th><th>Note</th><th>/</th><th>Appréciation</th><th></th></tr></thead>
        <tbody>${lignes}</tbody>
      </table></div>
      <p class="text-muted mt-1" style="font-size:.85rem">${inscritsClasse.length} élève(s) inscrit(s) dans cette classe. Les élèves sans compte n'apparaissent pas ici : leurs notes restent gérables par l'ancien système (fichiers).</p>`
    : `<p class="text-muted">Aucun élève inscrit dans la classe de ce devoir pour le moment.</p>`;

    $$(".btn-voir-fichier", zoneRes).forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const url = await sbLienSigne(btn.dataset.chemin);
          window.open(url, "_blank", "noopener");
        } catch (e) { alert(e.message); }
      });
    });

    $$(".btn-enregistrer-note", zoneRes).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const eleveId = btn.dataset.eleve;
        const noteVal = $(`.input-note[data-eleve="${eleveId}"]`, zoneRes)?.value.trim().replace(",", ".");
        const surVal = $(`.input-sur[data-eleve="${eleveId}"]`, zoneRes)?.value.trim().replace(",", ".") || "20";
        const appVal = $(`.input-app[data-eleve="${eleveId}"]`, zoneRes)?.value.trim() || "";
        const retour = $(`.retour-note[data-eleve="${eleveId}"]`, zoneRes);
        if (!noteVal || isNaN(Number(noteVal))) { if (retour) retour.textContent = "Note invalide"; return; }
        btn.disabled = true;
        try {
          await sbUpsert("notes", {
            eleve_id: eleveId, devoir_id: d.id,
            note: Number(noteVal), sur: Number(surVal) || 20,
            appreciation: appVal, date: todayISO()
          }, "eleve_id,devoir_id");
          if (retour) retour.textContent = "✓ Enregistré";
        } catch (e) {
          if (retour) retour.textContent = e.message;
        }
        btn.disabled = false;
      });
    });
  });
}

/* ---------- Démarrage (pages des espaces) ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "connexion") renderConnexion();
  else if (page === "espace-eleve") renderEspaceEleve();
  else if (page === "espace-enseignant") renderEspaceEnseignant();
});
