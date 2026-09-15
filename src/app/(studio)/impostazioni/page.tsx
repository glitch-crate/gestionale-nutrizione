import { createClient } from "@/lib/supabase/server";

const DAY_LABELS: Record<string, string> = {
  "1": "Lunedì",
  "2": "Martedì",
  "3": "Mercoledì",
  "4": "Giovedì",
  "5": "Venerdì",
  "6": "Sabato",
  "7": "Domenica",
};

export default async function ImpostazioniPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("studio_settings")
    .select("business_name, opening_hours")
    .maybeSingle();

  const { data: appointmentTypes } = await supabase
    .from("appointment_types")
    .select("name, duration_minutes, active")
    .order("duration_minutes", { ascending: false });

  const openingHours = (settings?.opening_hours as Record<string, { start: string; end: string }[]>) ?? {};

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
        Impostazioni
      </h1>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-[15px] font-medium text-[var(--color-ink)]">Studio</h2>
        <p className="mt-2 text-[15px] text-[var(--color-ink)]">
          {settings?.business_name ?? "—"}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-[15px] font-medium text-[var(--color-ink)]">Orari di apertura</h2>
        <div className="mt-3 flex flex-col gap-1.5">
          {["1", "2", "3", "4", "5", "6", "7"].map((day) => {
            const windows = openingHours[day] ?? [];
            return (
              <div key={day} className="flex items-center justify-between text-[15px]">
                <span className="text-[var(--color-ink)]">{DAY_LABELS[day]}</span>
                <span className="text-[var(--color-muted)]">
                  {windows.length === 0
                    ? "Chiuso"
                    : windows.map((w) => `${w.start}–${w.end}`).join(", ")}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          La modifica degli orari da questa pagina arriverà in una prossima milestone. Per ora,
          contattami per aggiornarli.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-[15px] font-medium text-[var(--color-ink)]">Tipi di appuntamento</h2>
        <div className="mt-3 flex flex-col gap-1.5">
          {(appointmentTypes ?? []).map((type) => (
            <div key={type.name} className="flex items-center justify-between text-[15px]">
              <span className="text-[var(--color-ink)]">{type.name}</span>
              <span className="text-[var(--color-muted)]">{type.duration_minutes} min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
