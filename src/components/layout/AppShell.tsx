"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function AppShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-svh">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header userEmail={userEmail} onMenuClick={() => setMenuOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-[var(--color-canvas)] p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
