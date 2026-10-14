/* ============================================================
   Service Worker — mise en cache pour usage hors-ligne (PWA)
   ⚠️ Lors d'une mise à jour du site, changez la VERSION ci-dessous.
   ============================================================ */
const VERSION = "devoirs-v10";
const FICHIERS = [
  "./",
  "./index.html",
  "./devoirs.html",
  "./calendrier.html",
  "./vie-de-classe.html",
  "./classe-3si1.html",
  "./classe-4si2.html",
  "./depot.html",
  "./suivi.html",
  "./admin.html",
  "./connexion.html",
  "./espace-eleve.html",
  "./espace-enseignant.html",
  "./css/style.css",
  "./js/app.js",
  "./js/supabase.js",
  "./js/espaces.js",
  "./data/config.js",
  "./data/devoirs.js",
  "./data/eleves.js",
  "./data/notes.js",
  "./data/annonces.js",
  "./data/vie.js",
  "./data/calendrier.js",
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
  /* Appels externes (Supabase : comptes, notes, fichiers) : réseau direct, aucun cache */
  if (new URL(ev.request.url).origin !== self.location.origin) return;
  ev.respondWith(
    caches.match(ev.request).then((cached) => {
      const reseau = fetch(ev.request)
        .then((res) => {
          const copie = res.clone();
          caches.open(VERSION).then((cache) => cache.put(ev.request, copie));
          return res;
        })
        .catch(() => cached);
      return cached || reseau;
    })
  );
});
