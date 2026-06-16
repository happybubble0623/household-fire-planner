"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsAppMode } from "@/components/app-mode-provider";
import { APP_MODE_QUERY_PARAM } from "@/lib/app-mode";

// Mobile-first bottom tab bar for the in-app experience. Gated on APP MODE
// only, so it renders ONLY inside the Capacitor iOS app — never on the website
// (desktop OR mobile web), where the top header nav remains the only
// navigation. Active state is by route, with the brand green for the active tab.

const ACTIVE_COLOR = "#15803d"; // brand green (--primary)

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  isActive: (pathname: string) => boolean;
};

// Shared stroke icon shell — keeps the four icons visually consistent with the
// rest of the app's inline SVGs (1.8 stroke, round caps/joins, currentColor).
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[22px] w-[22px]"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

// "Calculators" owns both the new list page and the existing tools routes.
const isCalculatorsRoute = (p: string) =>
  p.startsWith("/app/calculators") || p.startsWith("/app/fire-path/tools");

const TABS: Tab[] = [
  {
    href: "/app/fire-path/withdrawal-rate",
    label: "Plan",
    // Trending-up line — "your path / plan".
    icon: () => (
      <Icon>
        <path d="M4 17l5-5 3 3 7-7" />
        <path d="M15 8h5v5" />
      </Icon>
    ),
    // Any fire-path strategy/hub route EXCEPT the tools (those are Calculators).
    isActive: (p) => p.startsWith("/app/fire-path") && !isCalculatorsRoute(p)
  },
  {
    href: "/app/calculators",
    label: "Calculators",
    // Calculator grid.
    icon: () => (
      <Icon>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
      </Icon>
    ),
    isActive: isCalculatorsRoute
  },
  {
    href: "/app/portfolio-lab",
    label: "Portfolio",
    // Pie / allocation.
    icon: () => (
      <Icon>
        <path d="M12 3a9 9 0 109 9h-9z" />
        <path d="M12 3v9h9" />
      </Icon>
    ),
    isActive: (p) => p.startsWith("/app/portfolio-lab")
  },
  {
    href: "/app/more",
    label: "More",
    // Horizontal ellipsis.
    icon: () => (
      <Icon>
        <circle cx="5" cy="12" r="1.4" />
        <circle cx="12" cy="12" r="1.4" />
        <circle cx="19" cy="12" r="1.4" />
      </Icon>
    ),
    isActive: (p) => p.startsWith("/app/more")
  }
];

// Re-tapping the tab whose route is ALREADY active scrolls the page back to the
// top (a familiar mobile-app gesture) instead of re-navigating. The page scrolls
// on the window in this app, but we also reset <main> in case it ever owns its
// own scroll, so the gesture is robust to layout changes.
function scrollActivePageToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
  const main = document.querySelector("main");
  if (main && main.scrollTop > 0) {
    main.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function MobileTabBar() {
  const pathname = usePathname();
  const isAppMode = useIsAppMode();

  // App mode only — never render on the website (desktop or mobile web).
  if (!isAppMode || !pathname) return null;

  return (
    <nav
      aria-label="App sections"
      className="mobile-tab-bar-safe fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--border)] bg-white/95 backdrop-blur"
    >
      {TABS.map((tab) => {
        const active = tab.isActive(pathname);
        // Carry the app-mode flag on every tab destination. In a normal browser
        // a tab tap is a client-side <Link> navigation and app mode persists via
        // React context, so the flag is a harmless no-op. Inside the Capacitor
        // iOS WebView, however, a tab tap can resolve to a FULL document load
        // (the offline service worker mediates navigations), and on a full load
        // the persisted `pmf_app` cookie set via document.cookie is not reliably
        // attached to the request — so the server would render WEBSITE mode and
        // the website header would flash/stick ("redirected to the webpage").
        // The query flag is the highest-trust signal in detectAppModeClient(),
        // read before the cookie/localStorage, so the destination stays in app
        // mode regardless of cookie propagation. App-mode only — this tab bar
        // never renders on the website, so website URLs are unaffected.
        const href = `${tab.href}?${APP_MODE_QUERY_PARAM}=1`;
        return (
          <Link
            key={tab.href}
            href={href}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              // Already on this tab's route → scroll to top instead of a
              // no-op re-navigation. Different tab → let the Link navigate.
              if (active) {
                event.preventDefault();
                scrollActivePageToTop();
              }
            }}
            className="flex h-16 flex-1 flex-col items-center justify-center gap-1 text-gray-500 transition-colors duration-150"
            style={active ? { color: ACTIVE_COLOR } : undefined}
          >
            {tab.icon(active)}
            <span className={cn("text-[11px] leading-none", active ? "font-semibold" : "font-medium")}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
