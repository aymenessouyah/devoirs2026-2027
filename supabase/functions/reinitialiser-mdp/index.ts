// ============================================================
//  Fonction Supabase « reinitialiser-mdp » — Devoirs Lycée
//  Permet à l'administrateur (ou à l'enseignant de la classe)
//  de régénérer le mot de passe provisoire d'un élève, sans
//  supprimer son compte (ses notes sont conservées).
//  La clé service_role reste côté serveur (variable
//  d'environnement automatique des fonctions Supabase).
//
//  Déploiement (une seule fois) :
//    supabase functions deploy reinitialiser-mdp
//  ou via le Dashboard : Edge Functions -> Create function
//  -> nom « reinitialiser-mdp » -> coller ce fichier.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const EMAIL_ADMIN = "aymenessouyah@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!SERVICE_KEY) return json({ error: "Clé service_role introuvable côté serveur." }, 500);

  // --- 1) Identifier l'appelant (enseignant validé) ---
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Non connecté." }, 401);
  const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth },
  });
  if (!uRes.ok) return json({ error: "Session invalide." }, 401);
  const user = await uRes.json();

  const pRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profils?select=role,statut,classes,email&id=eq.${user.id}`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth } },
  );
  const profilsAppelant = await pRes.json().catch(() => []);
  const appelant = Array.isArray(profilsAppelant) ? profilsAppelant[0] : null;
  if (!appelant || appelant.role !== "enseignant" || appelant.statut !== "accepte") {
    return json({ error: "Réservé aux enseignants validés." }, 403);
  }
  const estAdmin = String(appelant.email || user.email || "").toLowerCase() === EMAIL_ADMIN;

  // --- 2) Lire la demande ---
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "Demande illisible." }, 400); }
  const eleveId = String(body.eleve_id || "");
  const motDePasse = String(body.mot_de_passe || "");
  if (!eleveId) return json({ error: "Élève manquant." }, 400);
  if (motDePasse.length < 6) return json({ error: "Mot de passe trop court (6 caractères minimum)." }, 400);

  // --- 3) Vérifier la cible : un élève, dans le périmètre de l'appelant ---
  const cRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profils?select=role,classe,nom&id=eq.${eleveId}`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth } },
  );
  const cibles = await cRes.json().catch(() => []);
  const cible = Array.isArray(cibles) ? cibles[0] : null;
  if (!cible || cible.role !== "eleve") return json({ error: "Compte élève introuvable." }, 404);
  const classesAppelant: string[] = Array.isArray(appelant.classes) ? appelant.classes : [];
  const memeClasse = classesAppelant.some(
    (c) => String(c).toLowerCase() === String(cible.classe || "").toLowerCase(),
  );
  if (!estAdmin && !memeClasse) {
    return json({ error: "Cet élève n'est pas dans vos classes." }, 403);
  }

  // --- 4) Changer le mot de passe via l'API Admin (service_role) ---
  const aRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${eleveId}`, {
    method: "PUT",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: motDePasse }),
  });
  if (!aRes.ok) {
    const detail = await aRes.text().catch(() => "");
    return json({ error: `Échec du changement de mot de passe (${aRes.status}). ${detail.slice(0, 200)}` }, 502);
  }
  return json({ ok: true, eleve: cible.nom || "" });
});
