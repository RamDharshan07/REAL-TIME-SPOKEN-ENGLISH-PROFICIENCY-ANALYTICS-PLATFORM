"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  // { href: "/prompts", label: "Prompts" },
  { href: "/drills", label: "Drills" },
  { href: "/picture-talk", label: "Picture talk" },
  { href: "/analysis", label: "Analysis" },
  { href: "/analysis/graph", label: "Trend" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href;
}

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-1 bg-black pb-2 sm:px-5 lg:px-8">
      <nav
        className="relative mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-emerald-800/35 bg-zinc-950/85 px-4 py-2.5 shadow-2xl shadow-black/50 ring-1 ring-emerald-500/15 backdrop-blur-md sm:gap-4 sm:px-6 sm:py-3 lg:px-8"
        aria-label="Main"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-900/25 blur-2xl"
          aria-hidden
        />

        <Link
          href="/"
          className="relative flex min-w-0 items-center gap-3 rounded-xl pr-2 transition hover:opacity-95 sm:border-r sm:border-emerald-800/30 sm:pr-6"
        >
          <span
            className="hidden h-10 w-1 shrink-0 rounded-full bg-linear-to-b from-emerald-400 to-emerald-700 shadow-[0_0_12px_rgba(52,211,153,0.45)] sm:block"
            aria-hidden
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
              <span className="hidden lg:inline">
                Real-Time Spoken English Proficiency Analytics
              </span>
              <span className="hidden sm:inline lg:hidden">
                Spoken English Proficiency Analytics
              </span>
              <span className="sm:hidden">Proficiency Analytics</span>
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-wider text-emerald-100/55 sm:block">
              Session · Metrics · Progress
            </span>
          </span>
        </Link>

        <ul className="relative flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
          {LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`inline-flex min-h-9 items-center justify-center rounded-full px-3.5 text-sm font-medium transition sm:min-h-10 sm:px-4 ${
                    active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/45 ring-1 ring-emerald-400/35 hover:bg-emerald-500"
                      : "border border-emerald-500/35 bg-emerald-950/45 text-white/90 hover:border-emerald-400/55 hover:bg-emerald-900/55 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
