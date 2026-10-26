"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  // Quante richieste di spostamento aspettano una risposta (si aggiorna da solo).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("reschedule_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "in_attesa")
          .gt("expires_at", new Date().toISOString());
        if (!cancelled) setPendingRequests(count ?? 0);
      } catch {
        // se non riesce, semplicemente non mostra il contatore
      }
    }
    load();
    const timer = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);

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
          {professionalName ?? "Studio Nutrizione"}
        </div>
      </aside>
    </>
  );
}
