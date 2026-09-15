import { getAppointmentTypes, getClients } from "@/lib/queries";
import { NewAppointmentForm } from "@/components/appuntamenti/NewAppointmentForm";

export default async function NuovoAppuntamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const [clients, appointmentTypes] = await Promise.all([
    getClients(),
    getAppointmentTypes(),
  ]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
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
