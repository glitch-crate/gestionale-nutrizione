import Link from "next/link";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { STUDIO } from "@/config/studio";

const NAV_ITEMS = [
  { href: "/portale/prenota", label: "Prenota" },
  { href: "/portale/i-miei-appuntamenti", label: "I miei appuntamenti" },
  { href: "/portale/profilo", label: "Il mio profilo" },
];

export function PortaleHeader() {
  return (
    <header className="flex flex-col gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6 sm:py-0">
      <p className="font-display text-lg text-[var(--color-ink)]">
        {STUDIO.name}
      </p>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            {item.label}
          </Link>
        ))}
        <LogoutButton redirectTo="/portale/login" />
      </nav>
    </header>
  );
}
