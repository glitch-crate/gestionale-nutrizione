import { OpeningHoursForm } from "@/components/studio/impostazioni/OpeningHoursForm";
import { AppointmentTypeRow } from "@/components/studio/impostazioni/AppointmentTypeRow";
import { getAllAppointmentTypes, getStudioSettings } from "@/lib/queries/studio/impostazioni";

export default async function ImpostazioniPage() {
  const [{ businessName, openingHours }, appointmentTypes] = await Promise.all([
    getStudioSettings(),
    getAllAppointmentTypes(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display text-2xl text-[var(--color-ink)]">
        Impostazioni
      </h1>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-4 text-[15px] font-medium text-[var(--color-ink)]">
          Studio e orari di apertura
        </h2>
        <OpeningHoursForm
          businessName={businessName}
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
          {appointmentTypes.map((type) => (
            <AppointmentTypeRow
              key={type.id}
              id={type.id}
              name={type.name}
              durationMinutes={type.duration_minutes}
            />
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          &quot;Primo incontro&quot; viene assegnato automaticamente al primo appuntamento di ogni
          cliente; &quot;Controllo&quot; a tutti quelli successivi. La durata determina quanto durano gli
          slot che il cliente vede nel portale.
        </p>
      </div>
    </div>
  );
}
