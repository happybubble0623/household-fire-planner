"use client";

import { useEffect } from "react";

// Registers the offline service worker (/sw.js) in the browser only. Guarded so
// SSR and non-supporting environments are a no-op — it never runs during the
// server render and never throws if registration fails (the app still works
// online). Site-wide: improves the web PWA and powers offline support inside the
// iOS Capacitor shell.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const register = () => {
      // `updateViaCache: "none"` makes the browser fetch /sw.js from the network
      // (bypassing the HTTP cache) on every update check, so a new service
      // worker — and its cache-busting VERSION bump — is never shadowed by a
      // cached copy of the script. Combined with skipWaiting + clients.claim in
      // sw.js, a deploy takes over promptly instead of waiting up to 24h.
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
        // Non-fatal — registration can fail (private mode, unsupported). The app
        // still works online; offline support is simply unavailable.
      });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
