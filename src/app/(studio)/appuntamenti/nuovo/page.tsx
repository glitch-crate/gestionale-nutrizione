import { getActiveAppointmentTypes } from "@/lib/queries/studio/appuntamenti";
import { getClients } from "@/lib/queries/studio/clienti";
import { NewAppointmentForm } from "@/components/studio/appuntamenti/NewAppointmentForm";

export default async function NuovoAppuntamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const [clients, appointmentTypes] = await Promise.all([
    getClients(),
    getActiveAppointmentTypes(),
  ]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="font-display text-2xl text-[var(--color-ink)]">
        Nuovo appuntamento
      </h1>
      <NewAppointmentForm
        clients={clients}
        appointmentTypes={appointmentTypes}
        defaultClientId={clientId}
      />
    </div>
  );
}
