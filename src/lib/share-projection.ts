// Share a projection table as an image — APP-ONLY.
//
// Same safety model as `notifications.ts` / `app-lock.ts`: this is a SAFE
// no-op everywhere except the Capacitor iOS app:
//   - During SSR / `npm run build` there is no `window`, so `shareElementAsImage`
//     returns early before touching any browser or native API.
//   - In a normal browser (the website, mobile web) `window.Capacitor` is
//     absent / not native, so we never load a plugin, never render, never share.
//   - The native plugins (`@capacitor/share`, `@capacitor/filesystem`) AND the
//     `html-to-image` DOM-capture library are only ever pulled in via DYNAMIC
//     `import()` *inside* an already-confirmed native runtime, so they are never
//     evaluated on the web and never get statically bundled — SSR + the
//     production build stay green and the website bundle is unchanged.

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

export type ShareImageResult =
  // The native share sheet was presented (the user may still cancel inside it).
  | "shared"
  // The user dismissed the share sheet without picking a target.
  | "cancelled"
  // Not running inside the native app (website / SSR) — nothing to do.
  | "unavailable";

// Renders `el` to a white-background PNG and hands it to the native iOS share
// sheet as a file. No-op on web/SSR (returns "unavailable"). Never throws — a
// user cancel resolves to "cancelled", any other failure to "unavailable".
export async function shareElementAsImage(
  el: HTMLElement,
  fileName: string,
  title = "Plan My FIRE"
): Promise<ShareImageResult> {
  if (!isNativeApp()) return "unavailable";

  try {
    // All three of these are dynamically imported so they never touch the web
    // bundle or SSR — they only load once we're confirmed native.
    const { toPng } = await import("html-to-image");
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    // Capture the table as a PNG data URL on a solid white background (the table
    // itself is white, but pixelRatio + bg guard against transparency).
    const dataUrl = await toPng(el, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      cacheBust: true
    });

    // Strip the "data:image/png;base64," prefix — Filesystem wants raw base64.
    const base64 = dataUrl.split(",")[1] ?? "";

    const safeName = fileName.endsWith(".png") ? fileName : `${fileName}.png`;

    // Write to the cache dir (transient, no permission needed) and get its URI.
    const written = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache
    });

    await Share.share({
      title,
      files: [written.uri],
      dialogTitle: title
    });

    return "shared";
  } catch (error) {
    // The Share plugin throws when the user dismisses the sheet — treat that as
    // a quiet cancel rather than an error. Everything else (capture failure,
    // plugin missing / not synced) falls through to "unavailable".
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("cancel")) return "cancelled";
    return "unavailable";
  }
}
