"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIRE_STRATEGIES } from "@/lib/data/fire-strategies";
import { PLANNING_TOOLS } from "@/lib/data/planning-tools";
import { AccountNav } from "@/components/layout/account-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { useIsAppMode } from "@/components/app-mode-provider";

// Standalone "Living expense calculator" — linked ONLY in the Calculators
// dropdown (not in PLANNING_TOOLS, so it stays out of the hub grid and the
// per-tool "More planning tools" footer). Defined here as a single source for
// the desktop and mobile Calculators menus.
const EXPENSES_TOOL = {
  href: "/app/fire-path/tools/expenses",
  title: "Living expense calculator"
};

// Standalone "Tax calculator" — same treatment as EXPENSES_TOOL: linked in the
// Calculators dropdown (desktop + mobile) and the pillar-page calculator lists,
// but not in PLANNING_TOOLS, the home hub, or the per-tool footer.
const TAX_TOOL = {
  href: "/app/fire-path/tools/tax",
  title: "Tax calculator"
};

// Canonical order for the full six-calculator Calculators menu (desktop +
// mobile). Healthcare and Social Security lead (pulled from PLANNING_TOOLS),
// then the standalone Tax + Living expense tools, then Investment and Mortgage.
// This explicit order interleaves the standalone tools with PLANNING_TOOLS, so
// it can't be expressed as "map PLANNING_TOOLS then append" — and it mirrors the
// /app/calculators tab so both surfaces stay in sync. PLANNING_TOOLS itself is
// left untouched (it still drives the hub grid and per-tool footer).
const planningTool = (slug: string) => PLANNING_TOOLS.find((tool) => tool.slug === slug)!;
const CALCULATOR_LINKS: Array<{ href: string; title: string }> = [
  planningTool("healthcare"),
  planningTool("social-security"),
  TAX_TOOL,
  EXPENSES_TOOL,
  planningTool("investment"),
  planningTool("mortgage")
];

// "Learn" dropdown items — beginner-facing content pages. Kept here as the single
// source so the desktop dropdown and the mobile menu stay in sync.
const LEARN_LINKS: Array<{ href: string; label: string; blurb: string }> = [
  { href: "/what-is-fire", label: "What is FIRE?", blurb: "Plain-English beginner's guide" },
  {
    href: "/early-retirement-guide",
    label: "Early Retirement Guide",
    blurb: "Step-by-step FIRE planning roadmap"
  },
  { href: "/fire-glossary", label: "Glossary", blurb: "FIRE & retirement terms defined" }
];

// Mirrors the aurora nav on the home hub (path-to-fire-panel): 14px/500
// warm-grey links, 8px radius, hover to near-black on a soft green-grey wash.
const navItemClass =
  "inline-flex items-center gap-[5px] rounded-lg px-[11px] py-2 text-sm font-medium text-gray-500 transition-colors duration-150";
const navItemHoverClass = "hover:bg-[rgba(16,40,24,0.05)] hover:text-gray-900";
const navItemActiveClass = "bg-[rgba(16,40,24,0.05)] text-gray-900";

// Flagship "Portfolio Tracker" link — a gold-accent pill (same gold tokens used
// for "featured" surfaces sitewide) so it reads as the lead, marquee feature,
// more prominent than the Calculators dropdown. Used on desktop and mobile.
const navPortfolioClass =
  "inline-flex items-center gap-[5px] rounded-lg border border-[var(--gold-border)] bg-[var(--gold-bg)] px-[11px] py-2 text-sm font-semibold text-[var(--gold-text)] transition-colors duration-150 hover:bg-[var(--gold-border)]";

const dropdownClass =
  "invisible absolute left-0 top-full z-30 min-w-[248px] -translate-y-1 rounded-xl border border-[var(--border)] bg-white p-1.5 opacity-0 shadow-[0_18px_40px_rgba(16,40,24,0.14)] transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100";
const dropdownItemClass =
  "block whitespace-nowrap rounded-lg px-[11px] py-[9px] text-[13.5px] font-semibold text-gray-700 transition-colors duration-150 hover:bg-[var(--soft)] hover:text-gray-900";
const mobileLinkClass =
  "block rounded-lg px-[11px] py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-[var(--soft)] hover:text-gray-900";
// Shared typography for the TOP-LEVEL mobile items (Portfolio, the group-header
// summaries Strategies/Calculators/Learn, and the standalone About link) so they
// all read as one tier — 14px / 600 / gray-700 — instead of the group headers
// rendering as smaller, muted (11px uppercase gray-500) sub-labels. Portfolio
// keeps its gold accent by overriding only the color.
const mobileTopLevelText = "text-sm font-semibold text-gray-700";
const mobileSummaryClass =
  "flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-[11px] py-2.5 text-sm font-semibold text-gray-700 outline-none transition-colors duration-150 hover:bg-[var(--soft)] hover:text-gray-900 [&::-webkit-details-marker]:hidden";

function Chevron() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="h-[11px] w-[11px] transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180"
    >
      <path
        d="M3 4.5 6 7.5 9 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Brand() {
  return (
    <Link href="/app/fire-path" className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] bg-[var(--primary)]"
      >
        <svg viewBox="0 0 64 64" className="h-[18px] w-[18px]" role="img" aria-label="Plan My FIRE logo">
          <path
            d="M16 40 L32 18 L48 40"
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 48 L44 48"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col justify-center">
        <span className="text-[15px] font-bold tracking-[-0.01em] text-gray-900">
          Plan My <span className="text-[var(--primary)]">FIRE</span>
        </span>
        <span className="text-[11px] font-medium text-gray-500">
          All-in-one planner for household early retirement
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Every page — including the full-bleed Aurora home hub — shares this single
  // top banner so navigation (and the mobile hamburger) is identical sitewide.
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const strategiesActive = FIRE_STRATEGIES.some((strategy) => isActive(strategy.href));
  const calculatorsActive =
    PLANNING_TOOLS.some((tool) => isActive(tool.href)) ||
    isActive(EXPENSES_TOOL.href) ||
    isActive(TAX_TOOL.href);
  const learnActive = LEARN_LINKS.some((link) => isActive(link.href));

  // The mobile redesign chrome (hidden website header, bottom tab bar + its
  // content clearance) applies ONLY inside the Capacitor iOS app. On the
  // website — desktop AND mobile web — the header stays and there is no tab bar.
  const isAppMode = useIsAppMode();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header
        className={cn(
          // `app-header-safe` pads the top by the iOS status-bar inset (0 on
          // desktop/web, so unchanged there).
          "app-header-safe sticky top-0 z-20 border-b border-[var(--border)] bg-white/85 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8",
          menuOpen && "bg-white",
          // In-app the bottom tab bar owns navigation and each screen carries
          // its own title, so this website header (logo + tagline + hamburger,
          // which just duplicates the tabs + More) is redundant chrome — hide
          // it. Gated on APP MODE only: every website visitor (desktop AND
          // mobile web) keeps the header exactly as before.
          isAppMode && "hidden"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 py-3.5">
          <Brand />

          {/* Desktop nav — same items and styling as the aurora home nav. */}
          <nav
            className="hidden items-center gap-1.5 min-[880px]:flex"
            aria-label="Primary navigation"
          >
            <Link
              href="/app/portfolio-lab"
              className={cn(
                navPortfolioClass,
                isActive("/app/portfolio-lab") && "border-[var(--gold)]"
              )}
              aria-current={isActive("/app/portfolio-lab") ? "page" : undefined}
            >
              Portfolio Tracker
            </Link>

            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={cn(
                  navItemClass,
                  "cursor-pointer group-hover:bg-[rgba(16,40,24,0.05)] group-hover:text-gray-900 group-focus-within:bg-[rgba(16,40,24,0.05)] group-focus-within:text-gray-900",
                  strategiesActive && navItemActiveClass
                )}
              >
                Strategies
                <Chevron />
              </button>
              <div className={dropdownClass} role="menu">
                {FIRE_STRATEGIES.map((strategy) => (
                  <Link
                    key={strategy.href}
                    href={strategy.href}
                    role="menuitem"
                    className={cn(dropdownItemClass, isActive(strategy.href) && "bg-[var(--soft)] text-gray-900")}
                    aria-current={isActive(strategy.href) ? "page" : undefined}
                  >
                    {strategy.navLabel}
                    <small className="mt-0.5 block max-w-[230px] whitespace-normal text-[11.5px] font-normal text-gray-500">
                      {strategy.eyebrow}
                    </small>
                  </Link>
                ))}
              </div>
            </div>

            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={cn(
                  navItemClass,
                  "cursor-pointer group-hover:bg-[rgba(16,40,24,0.05)] group-hover:text-gray-900 group-focus-within:bg-[rgba(16,40,24,0.05)] group-focus-within:text-gray-900",
                  calculatorsActive && navItemActiveClass
                )}
              >
                Calculators
                <Chevron />
              </button>
              <div className={dropdownClass} role="menu">
                {CALCULATOR_LINKS.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    role="menuitem"
                    className={cn(dropdownItemClass, isActive(tool.href) && "bg-[var(--soft)] text-gray-900")}
                    aria-current={isActive(tool.href) ? "page" : undefined}
                  >
                    {tool.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={cn(
                  navItemClass,
                  "cursor-pointer group-hover:bg-[rgba(16,40,24,0.05)] group-hover:text-gray-900 group-focus-within:bg-[rgba(16,40,24,0.05)] group-focus-within:text-gray-900",
                  learnActive && navItemActiveClass
                )}
              >
                Learn
                <Chevron />
              </button>
              <div className={dropdownClass} role="menu">
                {LEARN_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className={cn(dropdownItemClass, isActive(link.href) && "bg-[var(--soft)] text-gray-900")}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    {link.label}
                    <small className="mt-0.5 block max-w-[230px] whitespace-normal text-[11.5px] font-normal text-gray-500">
                      {link.blurb}
                    </small>
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/about"
              className={cn(navItemClass, navItemHoverClass, isActive("/about") && navItemActiveClass)}
              aria-current={isActive("/about") ? "page" : undefined}
            >
              About
            </Link>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-[var(--border)]" />
            <AccountNav variant="desktop" />
          </nav>

          {/* Mobile menu toggle. */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors duration-150 hover:bg-[rgba(16,40,24,0.05)] hover:text-gray-900 min-[880px]:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
              {menuOpen ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav panel. */}
        {menuOpen ? (
          <nav
            id="mobile-navigation"
            className="border-t border-[var(--border)] py-3 min-[880px]:hidden"
            aria-label="Primary navigation"
            // Close the menu when any link inside it is followed.
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
            }}
          >
            <Link
              href="/app/portfolio-lab"
              className={cn(
                "mb-2 block rounded-lg border border-[var(--gold-border)] bg-[var(--gold-bg)] px-[11px] py-2.5 text-sm font-semibold text-[var(--gold-text)]",
                isActive("/app/portfolio-lab") && "border-[var(--gold)]"
              )}
              aria-current={isActive("/app/portfolio-lab") ? "page" : undefined}
            >
              Portfolio Tracker
            </Link>
            {/* Collapsed-by-default accordion (native <details>, no `open`): the
                group label is the summary, tapping it expands the links. Mirrors
                the CollapsibleSection/FaqAccordion chevron-rotate pattern. */}
            <details className="group">
              <summary className={mobileSummaryClass}>
                Strategies
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              {FIRE_STRATEGIES.map((strategy) => (
                <Link
                  key={strategy.href}
                  href={strategy.href}
                  className={cn(
                    mobileLinkClass,
                    isActive(strategy.href) && navItemActiveClass
                  )}
                  aria-current={isActive(strategy.href) ? "page" : undefined}
                >
                  {strategy.navLabel}
                </Link>
              ))}
            </details>
            <details className="group">
              <summary className={mobileSummaryClass}>
                Calculators
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              {CALCULATOR_LINKS.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={cn(
                    mobileLinkClass,
                    isActive(tool.href) && navItemActiveClass
                  )}
                  aria-current={isActive(tool.href) ? "page" : undefined}
                >
                  {tool.title}
                </Link>
              ))}
            </details>
            <details className="group">
              <summary className={mobileSummaryClass}>
                Learn
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              {LEARN_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(mobileLinkClass, isActive(link.href) && navItemActiveClass)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </details>
            <Link
              href="/about"
              className={cn(
                "block rounded-lg px-[11px] py-2.5 transition-colors duration-150 hover:bg-[var(--soft)] hover:text-gray-900",
                mobileTopLevelText,
                isActive("/about") && navItemActiveClass
              )}
              aria-current={isActive("/about") ? "page" : undefined}
            >
              About
            </Link>
            <div className="mt-2 border-t border-[var(--border)] pt-2">
              <AccountNav variant="mobile" />
            </div>
          </nav>
        ) : null}
      </header>
      {/* App-mode only: `app-main-safe-top` carries the iOS status-bar inset
          onto the content (the website header that used to carry it is hidden);
          `app-main-safe-bottom` clears the fixed tab bar. Neither is applied on
          the website, so its layout is unchanged. */}
      <main className={cn(isAppMode && "app-main-safe-top app-main-safe-bottom")}>{children}</main>
      {/* Renders only in app mode (self-gated on useIsAppMode). The website —
          desktop AND mobile web — never shows the bottom tab bar. */}
      <MobileTabBar />
    </div>
  );
}
