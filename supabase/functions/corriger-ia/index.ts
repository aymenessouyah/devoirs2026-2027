// ============================================================
//  Fonction Supabase « corriger-ia » — Devoirs Lycée
//  Correction automatique des solutions des élèves par l'IA
//  Google Gemini (clé secrète côté serveur, jamais dans le site).
//
//  Déploiement (une seule fois) :
//    supabase functions deploy corriger-ia
//    supabase secrets set GEMINI_API_KEY=votre_cle_gratuite
//  Clé gratuite : https://aistudio.google.com/apikey
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY") || "";
  if (!GEMINI_API_KEY) {
    return json({ error: "Clé Gemini manquante côté serveur : exécutez « supabase secrets set GEMINI_API_KEY=... »." }, 500);
  }

  // --- 1) Vérifier l'utilisateur connecté (enseignant validé uniquement) ---
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Non connecté." }, 401);
  const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth },
  });
  if (!uRes.ok) return json({ error: "Session invalide." }, 401);
  const user = await uRes.json();

  const pRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profils?select=role,statut&id=eq.${user.id}`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth } },
  );
  const profils = await pRes.json().catch(() => []);
  const profil = Array.isArray(profils) ? profils[0] : null;
  if (!profil || profil.role !== "enseignant" || profil.statut !== "accepte") {
    return json({ error: "Réservé aux enseignants validés." }, 403);
  }

  // --- 2) Lire la demande ---
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "Demande illisible." }, 400); }
  const devoir = (body.devoir || {}) as Record<string, unknown>;
  const fichier = (body.fichier || {}) as Record<string, unknown>;
  const bareme = Number(devoir.bareme) || 20;
  const texte = String(fichier.texte || "");
  const base64 = String(fichier.base64 || "");
  const consignes = String(body.consignes || "").slice(0, 3000).trim();
  const exemplesBruts = Array.isArray(body.exemples) ? body.exemples.slice(0, 3) : [];
  const exemplesTxt = exemplesBruts.map((e, i) => {
    const ex = (e || {}) as Record<string, unknown>;
    const ext = String(ex.extrait || "").slice(0, 1500).trim();
    return `Exemple ${i + 1} (déjà validé par l'enseignant) — note : ${Number(ex.note) || 0}/${Number(ex.sur) || 20} — appréciation donnée : « ${String(ex.appreciation || "").slice(0, 300)} »${ext ? `\nExtrait de la copie de l'élève :\n${ext}` : ""}`;
  }).join("\n\n");
  if (!texte && !base64) return json({ error: "Aucun contenu de fichier à corriger." }, 400);

  // --- 3) Construire le prompt de correction ---
  const prompt = `Tu es un enseignant tunisien expérimenté qui corrige la copie d'un élève de lycée.
Tu dois corriger la solution de l'élève en la comparant au corrigé type, de façon juste, bienveillante et précise.

DEVOIR
- Titre : ${devoir.titre || ""}
- Matière : ${devoir.matiere || ""} (${devoir.type || ""}, classe ${devoir.classe || ""})
- Barème : note sur ${bareme}

SUJET :
${String(devoir.sujet || "(non fourni)")}

CORRIGÉ TYPE DE L'ENSEIGNANT (référence principale de notation) :
${String(devoir.correction || "(non fourni : corrige alors à partir du sujet et de tes connaissances, en restant prudent)")}
${consignes ? `\nCONSIGNES PERSONNELLES DE L'ENSEIGNANT (prioritaires, à appliquer strictement) :\n${consignes}\n` : ""}${exemplesTxt ? `\nEXEMPLES DE CORRECTIONS DÉJÀ VALIDÉES PAR CET ENSEIGNANT (imite son niveau d'exigence et son style d'appréciation) :\n${exemplesTxt}\n` : ""}

CONSIGNES DE NOTATION
- Note l'élève sur ${bareme}, au quart de point près (ex. 13.25).
- Tiens compte du raisonnement même si le résultat final est faux (points intermédiaires).
- Pour du code : vérifie la logique, les cas limites, la lisibilité et le respect de l'énoncé.
- Sois cohérent avec le corrigé type : même niveau d'exigence pour tous les élèves.
- L'appréciation doit être courte (1 à 2 phrases), encourageante et précise, en français, vue par l'élève.
- Le détail doit expliquer, question par question ou point par point, ce qui est juste, ce qui manque et où des points ont été perdus.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, au format :
{"note": <nombre entre 0 et ${bareme}>, "appreciation": "<1 à 2 phrases>", "details": "<correction détaillée, avec des retours à la ligne>"}`;

  const sujetF = (body.sujetFichier || {}) as Record<string, unknown>;
  const corrigeF = (body.corrigeFichier || {}) as Record<string, unknown>;

  // deno-lint-ignore no-explicit-any
  const parts: any[] = [{ text: prompt }];
  if (String(corrigeF.texte || "")) {
    parts.push({ text: `\n\nCORRIGÉ TYPE FOURNI EN FICHIER (« ${String(corrigeF.nom || "corrigé")} ») — RÉFÉRENCE PRINCIPALE DE NOTATION :\n\n${String(corrigeF.texte).slice(0, 60000)}` });
  } else if (String(corrigeF.base64 || "")) {
    parts.push({ text: `\n\nCORRIGÉ TYPE : le document joint ci-après (« ${String(corrigeF.nom || "corrigé")} ») est la RÉFÉRENCE PRINCIPALE de notation.` });
    parts.push({ inline_data: { mime_type: String(corrigeF.mime || "application/pdf"), data: String(corrigeF.base64) } });
  }
  if (String(sujetF.texte || "")) {
    parts.push({ text: `\n\nSUJET FOURNI EN FICHIER (« ${String(sujetF.nom || "sujet")} ») :\n\n${String(sujetF.texte).slice(0, 40000)}` });
  } else if (String(sujetF.base64 || "")) {
    parts.push({ text: `\n\nSUJET : le document joint ci-après (« ${String(sujetF.nom || "sujet")} ») est le sujet officiel du devoir.` });
    parts.push({ inline_data: { mime_type: String(sujetF.mime || "application/pdf"), data: String(sujetF.base64) } });
  }
  if (texte) {
    parts.push({ text: `\n\nSOLUTION DE L'ÉLÈVE (fichier « ${fichier.nom || "fichier"} ») :\n\n${texte.slice(0, 80000)}` });
  } else {
    parts.push({ text: `\n\nSOLUTION DE L'ÉLÈVE : le document joint ci-dessous (fichier « ${fichier.nom || "fichier"} »). Lis-le entièrement puis corrige-le.` });
    parts.push({ inline_data: { mime_type: String(fichier.mime || "application/pdf"), data: base64 } });
  }

  // --- 4) Appeler Gemini ---
  const modele = Deno.env.get("GEMINI_MODELE") || "gemini-2.0-flash";
  const gRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: 2048 },
      }),
    },
  );
  if (!gRes.ok) {
    const err = await gRes.text();
    return json({ error: `Le service IA a refusé la demande (${gRes.status}). Vérifiez la clé Gemini et le quota. Détail : ${err.slice(0, 300)}` }, 502);
  }
  const gData = await gRes.json();
  const sortie = gData?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";

  // --- 5) Extraire le JSON de la réponse ---
  let parsed: { note?: unknown; appreciation?: unknown; details?: unknown } | null = null;
  try { parsed = JSON.parse(sortie); } catch {
    const m = sortie.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch { parsed = null; } }
  }
  if (!parsed || isNaN(Number(parsed.note))) {
    return json({ error: "Réponse de l'IA illisible : réessayez la correction." }, 502);
  }
  let note = Math.max(0, Math.min(bareme, Number(parsed.note)));
  note = Math.round(note * 4) / 4;

  return json({
    note,
    appreciation: String(parsed.appreciation || "").slice(0, 500),
    details: String(parsed.details || "").slice(0, 6000),
  });
});
