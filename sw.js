/* ============================================================
   Service Worker — Devoirs Lycée (application unique : index.html)
   Stratégie réseau d'abord ; le cache ne sert que hors-ligne.
   ⚠️ Lors d'une mise à jour du site, changez la VERSION ci-dessous.
   ============================================================ */
const VERSION = "devoirs-v36";
const FICHIERS = [
  "./",
  "./index.html",
  "./espace-eleve.html",
  "./espace-enseignant.html",
  "./espace-admin.html",
  "./calendrier.html",
  "./vie-de-classe.html",
  "./reparer.html?v=500",
  "./js/supabase.js?v=500",
  "./data/config.js?v=500",
  "./data/devoirs.js?v=500",
  "./data/eleves.js?v=500",
  "./data/notes.js?v=500",
  "./data/annonces.js?v=500",
  "./data/vie.js?v=500",
  "./data/calendrier.js?v=500",
  "./img/profil-admin.jpg?v=500",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(FICHIERS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  if (ev.request.method !== "GET") return;
  /* Appels externes (Supabase, CDN du design) : réseau direct, aucun cache */
  if (new URL(ev.request.url).origin !== self.location.origin) return;
  /* Réseau d'abord : chaque mise à jour publiée est visible immédiatement */
  ev.respondWith(
    fetch(ev.request)
      .then((res) => {
        const copie = res.clone();
        caches.open(VERSION).then((cache) => cache.put(ev.request, copie));
        return res;
      })
      .catch(() => caches.match(ev.request))
  );
});
