import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

function getRomeDayRange(offsetDays: number) {
  const now = new Date();
  const target = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  const romeDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(target);

  const noonUtc = new Date(`${romeDateStr}T12:00:00.000Z`);
  const romeHourAtNoonUtc = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hour12: false,
    }).format(noonUtc),
    10,
  );
  const offsetHours = romeHourAtNoonUtc - 12;

  const start = new Date(`${romeDateStr}T00:00:00.000Z`);
  start.setUTCHours(start.getUTCHours() - offsetHours);
  const end = new Date(`${romeDateStr}T23:59:59.999Z`);
  end.setUTCHours(end.getUTCHours() - offsetHours);

  return { start, end };
}

async function sendReminderEmail(to: string, params: {
  clientFirstName: string;
  time: string;
  dateLabel: string;
  typeName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY mancante");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Studio Nutrizione <onboarding@resend.dev>",
      to,
      subject: `Promemoria: appuntamento domani alle ${params.time}`,
      text: `Ciao ${params.clientFirstName},\n\nTi ricordiamo il tuo appuntamento di domani, ${params.dateLabel}, alle ${params.time} (${params.typeName}).\n\nA presto,\nStudio Nutrizione`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend ha risposto ${response.status}: ${body}`);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secretParam = request.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  const authorized =
    authHeader === `Bearer ${expected}` || (secretParam && secretParam === expected);

  if (!authorized) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { start, end } = getRomeDayRange(1); // domani

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, clients(first_name, email), appointment_types(name)",
    )
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .eq("status", "confermato")
    .is("reminder_sent_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const failures: string[] = [];

  for (const appointment of appointments ?? []) {
    const client = appointment.clients as unknown as { first_name: string; email: string } | null;
    const type = appointment.appointment_types as unknown as { name: string } | null;

    if (!client?.email) continue;

    const startsAt = new Date(appointment.starts_at);
    const time = startsAt.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Rome",
    });
    const dateLabel = startsAt.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Rome",
    });

    try {
      await sendReminderEmail(client.email, {
        clientFirstName: client.first_name,
        time,
        dateLabel,
        typeName: type?.name ?? "appuntamento",
      });

      await supabase
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appointment.id);

      sent += 1;
    } catch (err) {
      failures.push(`${appointment.id}: ${err instanceof Error ? err.message : "errore sconosciuto"}`);
    }
  }

  return NextResponse.json({
    checked: appointments?.length ?? 0,
    sent,
    failures,
  });
}
