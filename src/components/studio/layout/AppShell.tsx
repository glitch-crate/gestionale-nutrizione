"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/studio/layout/Sidebar";
import { Header } from "@/components/studio/layout/Header";

export function AppShell({
  userEmail,
  professionalName,
  children,
}: {
  userEmail: string | null;
  professionalName?: string | null;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Il menu a scomparsa (telefono e tablet) si chiude anche con il tasto Esc.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="flex h-svh">
      <Sidebar
        open={menuOpen}
        onNavigate={() => setMenuOpen(false)}
        professionalName={professionalName}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header userEmail={userEmail} onMenuClick={() => setMenuOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-[var(--color-canvas)] p-4 sm:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
