// App Lock (Face ID / Touch ID) — opt-in, OFF by default, APP-ONLY.
//
// Same safety model as `notifications.ts`: this is a SAFE no-op everywhere
// except the Capacitor iOS app:
//   - During SSR / `npm run build` there is no `window`, so every entry point
//     returns early before touching any browser or native API.
//   - In a normal browser (the website, mobile web) `window.Capacitor` is
//     absent / not native, so we never load a plugin and never lock.
//   - The native plugins (`@aparajita/capacitor-biometric-auth`,
//     `@capacitor/app`) are only ever pulled in via a DYNAMIC `import()`
//     *inside* an already-confirmed native runtime, so they are never evaluated
//     on the web and never throw there (and never get statically bundled, so
//     SSR + the production build stay green).
//
// The on/off preference is mirrored to localStorage so the More-page toggle and
// the lock provider can read it synchronously across launches. Default: OFF.

const APP_LOCK_STORAGE_KEY = "pmf_app_lock";

type CapacitorGlobal = {
  Capacitor?: { isNativePlatform?: () => boolean };
};

// True only inside the Capacitor native runtime. False during SSR/build (no
// `window`) and in any normal browser.
function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (window as unknown as CapacitorGlobal).Capacitor;
  return typeof capacitor?.isNativePlatform === "function" && capacitor.isNativePlatform();
}

// Reads the persisted preference. SSR-safe and never throws. Default OFF.
export function isAppLockEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem(APP_LOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// Persists the on/off preference. SSR-safe and never throws.
export function setAppLockEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage?.setItem(APP_LOCK_STORAGE_KEY, "1");
    } else {
      window.localStorage?.removeItem(APP_LOCK_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (private mode, etc.) — nothing else to do.
  }
}

// True only when Face ID / Touch ID hardware is present AND the user has
// enrolled. Always false on web/SSR (no native plugin reached there).
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable === true;
  } catch {
    // Plugin missing / not synced into the native project — treat as unavailable.
    return false;
  }
}

// Prompts Face ID / Touch ID with a device-passcode fallback. Resolves true on
// success, false on cancel / failure / web. Never throws.
export async function authenticate(): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
    await BiometricAuth.authenticate({
      reason: "Unlock Plan My FIRE",
      cancelTitle: "Cancel",
      // Fall back to the device passcode after a failed biometric attempt.
      allowDeviceCredential: true,
      iosFallbackTitle: "Use Passcode"
    });
    return true;
  } catch {
    // BiometryError (cancel, lockout, failure, …) — treat as "not unlocked".
    return false;
  }
}

// Subscribes to the app returning to the foreground. Calls `callback` whenever
// the app becomes active again (e.g. after backgrounding). Returns an
// unsubscribe function. No-op on web/SSR — returns a no-op unsubscribe — and
// the `@capacitor/app` plugin is only reached inside the native path.
export function onAppResume(callback: () => void): () => void {
  if (!isNativeApp()) return () => {};

  let removed = false;
  let handle: { remove: () => void } | null = null;

  void (async () => {
    try {
      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) callback();
      });
      // If unsubscribe ran before the async listener resolved, remove it now.
      if (removed) {
        listener.remove();
      } else {
        handle = listener;
      }
    } catch {
      // Plugin unavailable — lock-on-launch still works; resume just won't fire.
    }
  })();

  return () => {
    removed = true;
    handle?.remove();
    handle = null;
  };
}
