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
      navigator.serviceWorker.register("/sw.js").catch(() => {
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
