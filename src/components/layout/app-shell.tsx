"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FIRE_STRATEGIES } from "@/lib/data/fire-strategies";
import { PLANNING_TOOLS } from "@/lib/data/planning-tools";
import { AccountNav } from "@/components/layout/account-nav";

// Mirrors the aurora nav on the home hub (path-to-fire-panel): 14px/500
// warm-grey links, 8px radius, hover to near-black on a soft green-grey wash.
const navItemClass =
  "inline-flex items-center gap-[5px] rounded-lg px-[11px] py-2 text-sm font-medium text-gray-500 transition-colors duration-150";
const navItemHoverClass = "hover:bg-[rgba(16,40,24,0.05)] hover:text-gray-900";
const navItemActiveClass = "bg-[rgba(16,40,24,0.05)] text-gray-900";

const dropdownClass =
  "invisible absolute left-0 top-full z-30 min-w-[248px] -translate-y-1 rounded-xl border border-[var(--border)] bg-white p-1.5 opacity-0 shadow-[0_18px_40px_rgba(16,40,24,0.14)] transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100";
const dropdownItemClass =
  "block whitespace-nowrap rounded-lg px-[11px] py-[9px] text-[13.5px] font-semibold text-gray-700 transition-colors duration-150 hover:bg-[var(--soft)] hover:text-gray-900";
const mobileLinkClass =
  "block rounded-lg px-[11px] py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-[var(--soft)] hover:text-gray-900";

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
        <svg viewBox="0 0 64 64" className="h-[18px] w-[18px]" role="img" aria-label="Household FIRE Planner logo">
          <path
            d="M16 40 L32 18 L48 40"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex flex-col justify-center">
        <span className="text-[15px] font-bold tracking-[-0.01em] text-gray-900">
          Household <span className="text-[var(--primary)]">FIRE</span> Planner
        </span>
        <span className="text-[11px] font-medium text-gray-500">
          Your private workspace for early retirement
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
  const calculatorsActive = PLANNING_TOOLS.some((tool) => isActive(tool.href));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header
        className={cn(
          "sticky top-0 z-20 border-b border-[var(--border)] bg-white/85 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8",
          menuOpen && "bg-white"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 py-3.5">
          <Brand />

          {/* Desktop nav — same items and styling as the aurora home nav. */}
          <nav
            className="hidden items-center gap-1.5 min-[880px]:flex"
            aria-label="Primary navigation"
          >
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
                {PLANNING_TOOLS.map((tool) => (
                  <Link
                    key={tool.slug}
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

            <Link
              href="/app/portfolio-lab"
              className={cn(
                navItemClass,
                navItemHoverClass,
                isActive("/app/portfolio-lab") && navItemActiveClass
              )}
              aria-current={isActive("/app/portfolio-lab") ? "page" : undefined}
            >
              Portfolio
            </Link>
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
            <p className="px-[11px] pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Strategies
            </p>
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
            <p className="px-[11px] pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Calculators
            </p>
            {PLANNING_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
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
            <div className="mt-2 border-t border-[var(--border)] pt-2">
              <Link
                href="/app/portfolio-lab"
                className={cn(
                  mobileLinkClass,
                  isActive("/app/portfolio-lab") && navItemActiveClass
                )}
                aria-current={isActive("/app/portfolio-lab") ? "page" : undefined}
              >
                Portfolio
              </Link>
              <Link
                href="/about"
                className={cn(
                  mobileLinkClass,
                  isActive("/about") && navItemActiveClass
                )}
                aria-current={isActive("/about") ? "page" : undefined}
              >
                About
              </Link>
            </div>
            <div className="mt-2 border-t border-[var(--border)] pt-2">
              <AccountNav variant="mobile" />
            </div>
          </nav>
        ) : null}
      </header>
      <main>{children}</main>
    </div>
  );
}
