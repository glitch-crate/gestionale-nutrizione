import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Usato nei Server Component e nelle Route Handler. Legge/scrive i
// cookie di sessione così che l'utente resti autenticato tra una
// richiesta e l'altra senza gestire token manualmente.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // la sessione (vedi src/middleware.ts).
          }
        },
      },
    },
  );
}
