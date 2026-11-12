import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { AREA_HEADER, authCookieName, isArea, type Area } from "@/lib/supabase/area";

// Usato nei Server Component, nelle server action e nelle Route Handler.
// Legge/scrive i cookie di sessione così che l'utente resti autenticato tra
// una richiesta e l'altra senza gestire token manualmente.
//
// Ogni area (studio, portale) ha il suo cookie: se `area` non è indicata si
// usa quella decisa dal middleware per la richiesta corrente.
export async function createClient(area?: Area) {
  const cookieStore = await cookies();
  const headerArea = (await headers()).get(AREA_HEADER);
  const resolvedArea: Area = area ?? (isArea(headerArea) ? headerArea : "studio");

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: authCookieName(resolvedArea) },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll può essere chiamato da un Server Component: in quel
            // caso i cookie non possono essere scritti direttamente.
            // Va bene ignorare l'errore se c'è il middleware a rinnovare
            // la sessione (vedi src/proxy.ts).
          }
        },
      },
    },
  );
}
