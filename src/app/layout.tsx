import type { Metadata } from "next";
import "./globals.css";

// Pila di font di sistema invece di next/font/google: nessuna richiesta
// di rete in fase di build (più semplice, più veloce, niente dipendenza
// esterna) mantenendo comunque un carattere distintivo per i titoli
// (serif in corsivo, vedi --font-display in globals.css).

export const metadata: Metadata = {
  title: "Studio Nutrizione — Gestionale",
  description: "Gestionale privato per appuntamenti e clienti dello studio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
