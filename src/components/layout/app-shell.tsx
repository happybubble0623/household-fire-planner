"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/app/fire-path", label: "Path to FIRE" },
  { href: "/app/portfolio-lab", label: "Understand Portfolio" },
  { href: "/contact", label: "Contact" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The home hub renders the full-bleed Aurora landing with its own top nav,
  // so the global app header is hidden there to avoid a duplicate top bar.
  const isHome = pathname === "/app/fire-path";

  if (isHome) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/85 px-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/app/fire-path" className="inline-flex min-h-11 items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-[var(--primary)]"
            >
              <svg viewBox="0 0 64 64" className="h-5 w-5" role="img" aria-label="Household FIRE Planner logo">
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
              <span className="text-[15px] font-bold tracking-tight text-gray-900">
                Household <span className="text-[var(--primary)]">FIRE</span> Planner
              </span>
              <span className="text-[11px] font-medium text-gray-500">
                Your household&rsquo;s path to financial independence
              </span>
            </span>
          </Link>
          <nav className="flex flex-wrap gap-1.5" aria-label="Primary navigation">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-lg px-3.5 py-3 text-sm font-medium text-gray-500 transition-all duration-200",
                    active && "bg-[var(--green-50)] font-semibold text-[var(--primary-hover)]",
                    !active && "hover:bg-gray-100 hover:text-gray-900"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
