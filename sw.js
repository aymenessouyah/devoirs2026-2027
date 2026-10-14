/* ============================================================
   Service Worker — mise en cache pour usage hors-ligne (PWA)
   ⚠️ Lors d'une mise à jour du site, changez la VERSION ci-dessous.
   ============================================================ */
const VERSION = "devoirs-v24";
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
  "./espace-admin.html",
  "./reparer.html?v=432",
  "./css/style.css?v=432",
  "./js/app.js?v=432",
  "./js/supabase.js?v=432",
  "./js/espaces.js?v=432",
  "./data/config.js?v=432",
  "./data/devoirs.js?v=432",
  "./data/eleves.js?v=432",
  "./data/notes.js?v=432",
  "./data/annonces.js?v=432",
  "./data/vie.js?v=432",
  "./data/calendrier.js?v=432",
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
  /* Réseau d'abord pour tout le site : chaque mise à jour publiée est
     visible immédiatement. Le cache ne sert que hors-ligne. */
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
