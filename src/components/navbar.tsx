"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ExternalLink } from "lucide-react";

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/", label: "API" },
  { href: "/status", label: "Status" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-ink hover:text-white"
        >
          KXRestApi
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-surface-overlay text-ink"
                    : "text-ink-muted hover:bg-surface-overlay hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 flex items-center gap-1 rounded px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-overlay hover:text-ink"
          >
            GitHub
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </nav>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded text-ink-muted hover:bg-surface-overlay hover:text-ink sm:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-border bg-surface sm:hidden">
          <nav className="flex flex-col px-2 py-2" aria-label="Mobile">
            {links.map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded px-3 py-2.5 text-sm ${
                    active
                      ? "bg-surface-overlay text-ink"
                      : "text-ink-muted hover:bg-surface-overlay hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded px-3 py-2.5 text-sm text-ink-muted hover:bg-surface-overlay hover:text-ink"
            >
              GitHub
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
