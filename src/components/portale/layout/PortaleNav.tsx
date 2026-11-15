"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/shared/LogoutButton";

// `short`: etichetta per gli schermi più stretti (sotto i 400px), così il
// menu sta tutto su una riga anche su telefoni piccoli come l'iPhone SE.
const NAV_ITEMS = [
  { href: "/portale/prenota", label: "Prenota", short: "Prenota" },
  { href: "/portale/i-miei-appuntamenti", label: "I miei appuntamenti", short: "Appuntamenti" },
  { href: "/portale/profilo", label: "Il mio profilo", short: "Profilo" },
];

/**
 * Menu del portale. Su telefono resta su una riga sola e, se non ci sta
 * (schermi molto stretti), scorre di lato invece di andare a capo.
 * La pagina in cui ci si trova è evidenziata.
 */
export function PortaleNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu del portale"
      className="-mx-[22px] flex items-center gap-x-4 overflow-x-auto whitespace-nowrap px-[22px] [scrollbar-width:none] sm:mx-0 sm:px-0"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className={`border-b-2 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-[var(--color-accent)] text-[var(--color-ink)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <span className="min-[400px]:hidden">{item.short}</span>
            <span className="hidden min-[400px]:inline">{item.label}</span>
          </Link>
        );
      })}
      <LogoutButton redirectTo="/portale/login" />
    </nav>
  );
}
