import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendTomorrowReminders } from "@/lib/email/reminders";

// Chiamata ogni mattina da Vercel Cron (vedi vercel.json): invia il
// promemoria email a chi ha un appuntamento confermato domani.

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  // Fail-closed: senza un segreto robusto configurato l'endpoint resta chiuso.
  if (!expected || expected.length < 16) return false;

  // Solo header (come fa Vercel Cron): niente segreto in query string,
  // che finirebbe nei log e nella cronologia.
  const authHeader = request.headers.get("authorization") ?? "";
  const a = Buffer.from(authHeader);
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    return NextResponse.json(await sendTomorrowReminders());
  } catch (err) {
    console.error("[cron]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
