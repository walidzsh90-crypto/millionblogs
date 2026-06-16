self.addEventListener("install", function installServiceWorker() {
  self.skipWaiting();
});

self.addEventListener("activate", function activateServiceWorker(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function fetchWithNetworkFirst() {
  return;
});
