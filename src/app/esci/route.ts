import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

// Disconnette chi è entrato nell'area sbagliata (un cliente nello studio o
// il professionista nel portale) e lo rimanda al login giusto con l'avviso.
// I layout non possono cancellare i cookie di sessione, una Route Handler sì:
// senza questo passaggio il token resterebbe valido fino alla scadenza.
const DESTINATIONS = {
  account_cliente: { to: "/login?errore=account_cliente", professional: false },
  account_professionista: { to: "/portale/login?errore=account_professionista", professional: true },
} as const;

export async function GET(request: NextRequest) {
  const motivo = request.nextUrl.searchParams.get("motivo");
  const destination = DESTINATIONS[motivo as keyof typeof DESTINATIONS];
  if (!destination) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si esce solo se l'utente è davvero nell'area sbagliata: un link esterno
  // a questa pagina non può disconnettere qualcuno che sta usando la sua area.
  const { supabase, user, professional } = await getCurrentUser();
  if (user && Boolean(professional) === destination.professional) {
    await supabase.auth.signOut({ scope: "local" });
  }

  return NextResponse.redirect(new URL(destination.to, request.url));
}
