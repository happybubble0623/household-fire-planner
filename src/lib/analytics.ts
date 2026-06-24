// Sends a GA4 "tool_use" event with a tool_name, so you can count real uses.
// Safe anywhere: does nothing on the server or if GA isn't loaded.
type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

export function trackToolUse(toolName: string): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "tool_use", { tool_name: toolName });
}
