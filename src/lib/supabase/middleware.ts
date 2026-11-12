import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AREA_HEADER, areaForRequest, authCookieName } from "@/lib/supabase/area";

const PUBLIC_PATHS = [
  "/login",
  "/portale/login",
  "/portale/registrati",
  "/portale/password-dimenticata",
  "/portale/reimposta-password",
  "/privacy",
  "/api/cron", // si protegge da sola con CRON_SECRET, non con il login
];

export async function updateSession(request: NextRequest) {
  // Area della richiesta (studio o portale): decide quale cookie di sessione
  // usare, qui e nelle pagine/server action (tramite l'intestazione).
  const area = areaForRequest(request.nextUrl.pathname, request.nextUrl.searchParams);
  // Le intestazioni si ricostruiscono a ogni chiamata: dopo un rinnovo della
  // sessione contengono anche i cookie aggiornati.
  const next = () => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(AREA_HEADER, area);
    return NextResponse.next({ request: { headers: requestHeaders } });
  };

  let response = next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Senza configurazione Supabase: in sviluppo lasciamo passare (per vedere
  // l'interfaccia), in produzione chiudiamo tutto invece di aprire tutto.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Servizio non configurato", { status: 503 });
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: { name: authCookieName(area) },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = next();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims() rinnova la sessione se è scaduta e verifica il token in
  // locale (firma con la chiave pubblica del progetto e scadenza), senza
  // chiamare Supabase a ogni richiesta come faceva getUser().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? data.claims : null;

  // Corrispondenza esatta o sotto-percorso: "/privacy" non deve rendere
  // pubblico anche "/privacy-qualcosa".
  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    // I clienti tornano al login del portale, non a quello dello studio.
    loginUrl.pathname =
      pathname === "/portale" || pathname.startsWith("/portale/") ? "/portale/login" : "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
