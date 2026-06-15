// v1 native shell points at the HOSTED site (hosted-shell approach) — it does NOT
// bundle a static web build. `webDir: "public"` is only a placeholder to satisfy
// the Capacitor CLI; the live app is loaded from `server.url` below.
//
// ⚠️ Revisit before App Store submission re: Apple Guideline 4.2 ("Minimum
// Functionality" — a pure webview wrapper gets rejected). To clear it we'll need
// genuine native value (v1: Face ID lock) and likely some bundling / offline
// snapshot / native features rather than a bare pointer at the website.
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.planmyfi.app',
  appName: 'Plan My FIRE',
  webDir: 'public',
  server: {
    url: 'https://www.planmyfi.com',
    cleartext: false,
  },
};

export default config;
