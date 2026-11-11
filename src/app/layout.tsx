import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Fraunces } from "next/font/google";
import { STUDIO } from "@/config/studio";
import "./globals.css";

// Font del sistema di design (DESIGN.md). next/font li scarica durante la
// build e li serve dal sito stesso: il browser del cliente non contatta
// mai Google.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--font-atkinson",
  display: "swap",
  // next/font non ha le misure di questo font per regolare il sostitutivo.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: `${STUDIO.name} — Gestionale`,
  description: "Gestionale privato per appuntamenti e clienti dello studio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`h-full antialiased ${fraunces.variable} ${atkinson.variable}`}>
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
