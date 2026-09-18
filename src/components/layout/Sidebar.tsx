"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendario", label: "Calendario" },
  { href: "/appuntamenti", label: "Appuntamenti" },
  { href: "/clienti", label: "Clienti" },
  { href: "/impostazioni", label: "Impostazioni" },
];

export function Sidebar({
  open = false,
  onNavigate,
}: {
  open?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Sfondo scuro dietro il menu, solo su mobile quando è aperto */}
      {open ? (
        <div
          onClick={onNavigate}
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-svh w-64 shrink-0 flex-col bg-[var(--color-pine)] px-4 py-6 transition-transform duration-200 sm:static sm:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-2 pb-8">
          <p className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-pine-text)]">
            Studio Nutrizione
          </p>
          <p className="mt-1 text-sm text-[var(--color-pine-text-muted)]">
            Gestionale appuntamenti
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
                  isActive
                    ? "bg-[var(--color-pine-light)] text-[var(--color-pine-text)] font-medium"
                    : "text-[var(--color-pine-text-muted)] hover:bg-[var(--color-pine-light)] hover:text-[var(--color-pine-text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-[var(--color-pine-light)] px-3 py-3 text-sm text-[var(--color-pine-text-muted)]">
          Dati fittizi — ambiente di sviluppo
        </div>
      </aside>
    </>
  );
}
