// Le due aree del gestionale hanno ciascuna il proprio cookie di sessione:
// così nello stesso browser si può essere collegati allo studio come
// professionista e al portale come cliente, senza che un accesso chiuda
// l'altro (prima il cookie era uno solo e l'ultimo login sostituiva il primo).
//
// Il middleware (src/proxy.ts) decide l'area dal percorso e la passa alle
// pagine e alle server action nell'intestazione AREA_HEADER.

export type Area = "studio" | "portale";

export const AREA_HEADER = "x-gestionale-area";

const COOKIE_NAMES: Record<Area, string> = {
  studio: "sb-studio-auth",
  portale: "sb-portale-auth",
};

export function authCookieName(area: Area): string {
  return COOKIE_NAMES[area];
}

export function isArea(value: string | null | undefined): value is Area {
  return value === "studio" || value === "portale";
}

/** Area di una richiesta. "/esci" disconnette dall'area indicata dal motivo. */
export function areaForRequest(pathname: string, searchParams?: URLSearchParams): Area {
  if (pathname === "/portale" || pathname.startsWith("/portale/")) return "portale";
  if (pathname === "/esci" && searchParams?.get("motivo") === "account_professionista") return "portale";
  return "studio";
}
