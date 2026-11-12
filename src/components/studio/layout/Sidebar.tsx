"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STUDIO } from "@/config/studio";
import { fetchPendingRequestsCount } from "@/lib/browser/studio";
import { REQUESTS_CHANGED_EVENT } from "@/components/studio/richieste/RequestActions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendario", label: "Calendario" },
  { href: "/appuntamenti", label: "Appuntamenti" },
  { href: "/richieste", label: "Richieste" },
  { href: "/clienti", label: "Clienti" },
  { href: "/impostazioni", label: "Impostazioni" },
];

export function Sidebar({
  open = false,
  onNavigate,
  professionalName,
}: {
  open?: boolean;
  onNavigate?: () => void;
  professionalName?: string | null;
}) {
  const pathname = usePathname();
  const [pendingRequests, setPendingRequests] = useState(0);

  // Quante richieste di spostamento aspettano una risposta (si aggiorna da solo ogni minuto e dopo ogni risposta a una richiesta).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const count = await fetchPendingRequestsCount();
        if (!cancelled) setPendingRequests(count);
      } catch {
        // se non riesce, semplicemente non mostra il contatore
      }
    }
    load();
    const timer = setInterval(load, 60000);
    // Subito dopo un "Approva"/"Rifiuta" nella pagina Richieste.
    window.addEventListener(REQUESTS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(REQUESTS_CHANGED_EVENT, load);
    };
  }, [pathname]);

  return (
    <>
      {/* Sfondo scuro dietro il menu, solo su mobile quando è aperto */}
      {open ? (
        <div
          onClick={onNavigate}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-hidden="true"
        />
      ) : null}

      <aside
        id="menu-studio"
        className={`fixed inset-y-0 left-0 z-40 flex h-svh w-64 shrink-0 flex-col bg-[var(--color-pine)] px-4 py-6 transition-[transform,visibility] duration-200 lg:visible lg:static lg:translate-x-0 ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="px-2 pb-8">
          <p className="font-display text-lg text-[var(--color-pine-text)]">
            {STUDIO.name}
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
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
                  isActive
                    ? "bg-[var(--color-pine-light)] text-[var(--color-pine-text)] font-medium"
                    : "text-[var(--color-pine-text-muted)] hover:bg-[var(--color-pine-light)] hover:text-[var(--color-pine-text)]"
                }`}
              >
                <span>{item.label}</span>
                {item.href === "/richieste" && pendingRequests > 0 ? (
                  <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-semibold text-white">
                    {pendingRequests}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-[var(--color-pine-light)] px-3 py-3 text-sm text-[var(--color-pine-text)]">
          {professionalName ?? STUDIO.name}
        </div>
      </aside>
    </>
  );
}
