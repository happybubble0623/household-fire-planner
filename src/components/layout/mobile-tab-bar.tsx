"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Mobile-first bottom tab bar for the in-app experience (Capacitor app + mobile
// web). Gated two ways so the DESKTOP WEB is unchanged:
//   1. Route — only renders on `/app/*` routes (the AppShell is also used by
//      marketing pages like /about, so we can't rely on the shell alone).
//   2. Width — `min-[880px]:hidden` hides it at and above the existing desktop
//      breakpoint, where the top header nav remains the only navigation.
// Active state is by route, with the brand green for the active tab.

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

export function MobileTabBar() {
  const pathname = usePathname();

  // Route gate: in-app surfaces only. The AppShell wraps marketing pages too,
  // so without this the bar would leak onto /about etc.
  if (!pathname || !pathname.startsWith("/app")) return null;

  return (
    <nav
      aria-label="App sections"
      className="mobile-tab-bar-safe fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--border)] bg-white/95 backdrop-blur min-[880px]:hidden"
    >
      {TABS.map((tab) => {
        const active = tab.isActive(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
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
