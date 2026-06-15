// Local notifications (v1) — opt-in, OFF by default, APP-ONLY.
//
// This is a SAFE no-op everywhere except the Capacitor iOS app:
//   - During SSR / `npm run build` there is no `window`, so every entry point
//     returns early before touching any browser or native API.
//   - In a normal browser (the website, mobile web) `window.Capacitor` is
//     absent / not native, so we never load the plugin and never schedule.
//   - The native `@capacitor/local-notifications` module is only ever pulled in
//     via a DYNAMIC `import()` *inside* an already-confirmed native runtime, so
//     it is never evaluated on the web and never throws there.
//
// The on/off preference is mirrored to localStorage so the More-page toggle can
// reflect state across launches without querying the OS.

const REMINDER_STORAGE_KEY = "pmf_reminder_monthly";

// A single stable id so enabling re-uses (replaces) the same scheduled
// notification instead of stacking duplicates, and disabling can cancel it.
const MONTHLY_REMINDER_ID = 1001;

const TITLE = "Plan My FIRE";
const BODY = "Time to check in on your FIRE plan.";

export type EnableReminderResult =
  // Scheduled successfully.
  | "enabled"
  // Permission was denied — the UI should hint to enable it in iOS Settings.
  | "denied"
  // Not running inside the native app (website / SSR) — nothing to do.
  | "unavailable";

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

// Reads the persisted preference. SSR-safe and never throws.
export function isReminderEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage?.getItem(REMINDER_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistReminderPref(enabled: boolean): void {
  try {
    if (enabled) {
      window.localStorage?.setItem(REMINDER_STORAGE_KEY, "1");
    } else {
      window.localStorage?.removeItem(REMINDER_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (private mode, etc.) — the schedule still stands.
  }
}

// Requests permission and, if granted, schedules a RECURRING monthly local
// notification (the 1st of each month at 9am). No-op on web/SSR.
export async function enableMonthlyReminder(): Promise<EnableReminderResult> {
  if (!isNativeApp()) return "unavailable";

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== "granted") {
      return "denied";
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: MONTHLY_REMINDER_ID,
          title: TITLE,
          body: BODY,
          // `on` with only day/hour/minute repeats monthly (cron-style).
          schedule: { on: { day: 1, hour: 9, minute: 0 }, allowWhileIdle: true }
        }
      ]
    });

    persistReminderPref(true);
    return "enabled";
  } catch {
    // Plugin missing or scheduling failed — leave the preference off.
    return "unavailable";
  }
}

// Cancels the scheduled monthly reminder and clears the preference. No-op on
// web/SSR. Always clears the stored preference so the toggle returns to off.
export async function disableReminder(): Promise<void> {
  persistReminderPref(false);

  if (!isNativeApp()) return;

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: MONTHLY_REMINDER_ID }] });
  } catch {
    // Nothing scheduled / plugin unavailable — preference is already cleared.
  }
}
