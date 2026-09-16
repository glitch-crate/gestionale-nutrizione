import { createClient } from "@/lib/supabase/server";
import { OpeningHoursForm } from "@/components/impostazioni/OpeningHoursForm";
import { AppointmentTypeRow } from "@/components/impostazioni/AppointmentTypeRow";

export default async function ImpostazioniPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("studio_settings")
    .select("business_name, opening_hours")
    .maybeSingle();

  const { data: appointmentTypes } = await supabase
    .from("appointment_types")
    .select("id, name, duration_minutes, active")
    .order("duration_minutes", { ascending: false });

  const openingHours =
    (settings?.opening_hours as Record<string, { start: string; end: string }[]>) ?? {};

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
        Impostazioni
      </h1>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-4 text-[15px] font-medium text-[var(--color-ink)]">
          Studio e orari di apertura
        </h2>
        <OpeningHoursForm
          businessName={settings?.business_name ?? "Studio"}
          openingHours={openingHours}
        />
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          Gli orari qui sopra determinano gli slot che i clienti vedono disponibili nel portale
          di prenotazione.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-4 text-[15px] font-medium text-[var(--color-ink)]">
          Tipi di appuntamento
        </h2>
        <div className="flex flex-col gap-3">
          {(appointmentTypes ?? []).map((type) => (
            <AppointmentTypeRow
              key={type.id}
              id={type.id}
              name={type.name}
              durationMinutes={type.duration_minutes}
            />
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          "Primo incontro" viene assegnato automaticamente al primo appuntamento di ogni
          cliente; "Controllo" a tutti quelli successivi. La durata determina quanto durano gli
          slot che il cliente vede nel portale.
        </p>
      </div>
    </div>
  );
}
