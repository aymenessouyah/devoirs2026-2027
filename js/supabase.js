/* ============================================================
   Mini-client Supabase (REST + Auth) — aucune dépendance.
   Projet partagé avec l'espace Vie scolaire (même compte
   enseignant, même base). La clé ci-dessous est la clé PUBLIQUE
   (« anon ») : la sécurité est assurée par les règles RLS
   (voir supabase/schema.sql).
   ============================================================ */
const SUPABASE_URL = "https://oaahxobzbnmaohcmdrbu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hYWh4b2J6Ym5tYW9oY21kcmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDE2MDAsImV4cCI6MjEwNjcxNzYwMH0.e6cVFx7_BoF8jFvIAows2i-awIEaM6MS3K4LdCq4INs";

const SB_SESSION_KEY = "sb-session-devoirs";

/* Admin du site : ce compte est automatiquement « enseignant »
   (déclencheur SQL dans supabase/schema.sql, §5). */
const SB_ADMIN_EMAIL = "aymenessouyah@gmail.com";

function sbEstAdminEmail(email) {
  return String(email || "").toLowerCase() === SB_ADMIN_EMAIL;
}

/* ---------- E-mail de connexion d'un élève (à partir de son code) ---------- */
function emailEleve(code) {
  return `${String(code || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "")}@devoirs2026.tn`;
}

/* ---------- Session (localStorage) ---------- */
function sbSession() {
  try {
    return JSON.parse(localStorage.getItem(SB_SESSION_KEY)) || null;
  } catch (e) {
    return null;
  }
}

function sbSetSession(s) {
  if (s) localStorage.setItem(SB_SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SB_SESSION_KEY);
}

function sbConnecte() {
  const s = sbSession();
  return !!(s && s.access_token && s.user);
}

async function sbRafraichir() {
  const s = sbSession();
  if (!s || !s.refresh_token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!res.ok) throw new Error("refresh");
    const data = await sbLireReponse(res);
    const session = sbNormaliserSession(data);
    sbSetSession(session);
    return session;
  } catch (e) {
    sbSetSession(null);
    return null;
  }
}

function sbNormaliserSession(data) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    user: data.user ? { id: data.user.id, email: data.user.email } : null
  };
}

async function sbSessionValide() {
  const s = sbSession();
  if (!s) return null;
  if (s.expires_at && s.expires_at < Date.now() + 60000) return sbRafraichir();
  return s;
}

/* ---------- Lecture des réponses + messages d'erreur en français ---------- */
async function sbLireReponse(res) {
  const texte = await res.text();
  let data = null;
  try { data = texte ? JSON.parse(texte) : null; } catch (e) { data = null; }
  if (!res.ok) {
    const brut = (data && (data.msg || data.message || data.error_description || data.error)) || texte || `HTTP ${res.status}`;
    throw new Error(sbMessageErreur(brut, res.status));
  }
  return data;
}

function sbMessageErreur(brut, status) {
  const m = String(brut);
  if (/Invalid login credentials/i.test(m)) return "Identifiant ou mot de passe incorrect.";
  if (/User already registered/i.test(m)) return "Ce compte existe déjà : connectez-vous.";
  if (/Password should be at least/i.test(m)) return "Mot de passe trop court (6 caractères minimum).";
  if (/Signups not allowed/i.test(m)) return "Les inscriptions sont fermées dans Supabase : activez « Allow new users to sign up » (voir le guide).";
  if (/Email not confirmed/i.test(m)) return "E-mail non confirmé : désactivez « Confirm email » dans Supabase (voir le guide).";
  if (/relation .* does not exist|Could not find the table/i.test(m)) return "La base n'est pas encore installée : exécutez supabase/schema.sql dans Supabase (voir le guide).";
  if (status === 401 || status === 403) return "Accès refusé : vérifiez que le script SQL a été exécuté et que vous êtes bien connecté.";
  return m;
}

/* ---------- Auth ---------- */
async function sbInscription(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await sbLireReponse(res);
  if (data && data.access_token) {
    const session = sbNormaliserSession(data);
    sbSetSession(session);
    return session;
  }
  /* Pas de session = confirmation e-mail exigée côté Supabase */
  throw new Error("Inscription créée mais non confirmée : désactivez « Confirm email » dans Supabase (voir le guide), puis connectez-vous.");
}

async function sbConnexion(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await sbLireReponse(res);
  const session = sbNormaliserSession(data);
  sbSetSession(session);
  return session;
}

async function sbDeconnexion() {
  const s = sbSession();
  sbSetSession(null);
  sbEffacerProfilCache();
  if (s && s.access_token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${s.access_token}` }
      });
    } catch (e) { /* session locale déjà supprimée */ }
  }
}

/* ---------- Profil courant (cache léger pour la navigation) ---------- */
const SB_PROFIL_KEY = "sb-profil-devoirs";

function sbStockerProfil(p) {
  if (!p) return;
  try {
    localStorage.setItem(SB_PROFIL_KEY, JSON.stringify({
      role: p.role, statut: p.statut || "accepte", nom: p.nom,
      classe: p.classe, matiere: p.matiere
    }));
  } catch (e) { /* stockage indisponible */ }
}

function sbProfilCache() {
  try { return JSON.parse(localStorage.getItem(SB_PROFIL_KEY)) || null; }
  catch (e) { return null; }
}

function sbEffacerProfilCache() {
  try { localStorage.removeItem(SB_PROFIL_KEY); } catch (e) { /* ignoré */ }
}

/* Connexion par identifiant libre : e-mail, ou ancien code élève
   (ex. 3SI1-01) pour les comptes créés avant la v4. */
async function sbConnexionIdentifiant(identifiant, password) {
  const idf = String(identifiant || "").trim();
  const email = idf.includes("@") ? idf : emailEleve(idf);
  return sbConnexion(email, password);
}

/* Récupère le profil du compte connecté ; le crée si une inscription a été
   interrompue (confirmation e-mail activée dans Supabase) et que les
   informations sont encore en attente dans le navigateur. */
async function sbAssurerProfil() {
  let profil = await sbMonProfil();
  if (profil) { sbStockerProfil(profil); return profil; }
  try {
    const session = sbSession();
    const attente = JSON.parse(localStorage.getItem("sb-inscription") || "null");
    if (session && session.user && attente && attente.email &&
        attente.email.toLowerCase() === String(session.user.email || "").toLowerCase()) {
      const rows = await sbCreerProfil({
        id: session.user.id,
        role: attente.role || "eleve",
        nom: attente.nom || "",
        classe: attente.classe || null,
        matiere: attente.matiere || null,
        code: null,
        email: session.user.email,
        statut: "en_attente"
      });
      localStorage.removeItem("sb-inscription");
      profil = Array.isArray(rows) ? rows[0] : rows;
      if (profil) sbStockerProfil(profil);
    }
  } catch (e) { /* le profil sera créé depuis l'écran prévu à cet effet */ }
  return profil;
}

/* Écritures génériques */
function sbInsert(table, ligne) {
  return sbReq(table, { method: "POST", body: ligne, prefer: "return=representation" });
}

function sbPatch(table, filtre, champs) {
  return sbReq(`${table}?${filtre}`, { method: "PATCH", body: champs, prefer: "return=representation" });
}

function sbSupprimer(table, filtre) {
  return sbReq(`${table}?${filtre}`, { method: "DELETE" });
}

/* ---------- Requêtes REST (PostgREST) ---------- */
async function sbReq(chemin, opts = {}) {
  const session = await sbSessionValide();
  const url = `${SUPABASE_URL}/rest/v1/${chemin}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session ? session.access_token : SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...(opts.headers || {})
  };
  if (opts.prefer) headers.Prefer = opts.prefer;
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await sbLireReponse(res);
  return data;
}

function sbSelect(table, requete = "select=*") {
  return sbReq(`${table}?${requete}`);
}

async function sbMonProfil() {
  const session = sbSession();
  if (!session || !session.user) return null;
  const rows = await sbSelect("profils", `select=*&id=eq.${session.user.id}`);
  return rows && rows.length ? rows[0] : null;
}

function sbCreerProfil(profil) {
  return sbReq("profils", { method: "POST", body: profil, prefer: "return=representation" });
}

function sbUpsert(table, ligne, conflit) {
  return sbReq(`${table}?on_conflict=${conflit}`, {
    method: "POST",
    body: ligne,
    prefer: "resolution=merge-duplicates,return=representation"
  });
}

/* ---------- Stockage de fichiers (bucket privé « depots ») ---------- */
function sbCheminFichier(uid, devoirId, nomFichier) {
  const propre = String(nomFichier || "fichier")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${uid}/${devoirId}/${Date.now()}-${propre}`;
}

async function sbEnvoyerFichier(chemin, fichier) {
  const session = await sbSessionValide();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/depots/${chemin}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": fichier.type || "application/octet-stream",
      "x-upsert": "true"
    },
    body: fichier
  });
  await sbLireReponse(res);
  return chemin;
}

async function sbLienSigne(chemin, duree = 3600) {
  const session = await sbSessionValide();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/depots/${chemin}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expiresIn: duree })
  });
  const data = await sbLireReponse(res);
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}

/* Diagnostic : la base est-elle installée et joignable ? */
async function sbBasePrete() {
  try {
    await sbReq("profils?select=id&limit=1");
    return true;
  } catch (e) {
    return false;
  }
}
