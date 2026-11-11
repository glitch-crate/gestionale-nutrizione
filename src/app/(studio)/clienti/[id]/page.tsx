import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientAppointments } from "@/lib/queries/studio/appuntamenti";
import { getClientById } from "@/lib/queries/studio/clienti";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ExistingClientToggle } from "@/components/studio/clienti/ExistingClientToggle";
import { DeleteClientButton } from "@/components/studio/clienti/DeleteClientButton";
import { formatDate, formatDateTimeShort } from "@/lib/format";

export default async function ClienteDettaglioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, appointments] = await Promise.all([getClientById(id), getClientAppointments(id)]);

  if (!client) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/clienti" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]">
            ← Tutti i clienti
          </Link>
          <h1 className="mt-2 font-display text-2xl text-[var(--color-ink)]">
            {client.firstName} {client.lastName}
          </h1>
        </div>
        <DeleteClientButton clientId={client.id} clientName={`${client.firstName} ${client.lastName}`} />
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <dl className="grid grid-cols-2 gap-4 text-[15px]">
          <div>
            <dt className="text-sm text-[var(--color-muted)]">Telefono</dt>
            <dd className="text-[var(--color-ink)]">{client.phone}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-muted)]">Email</dt>
            <dd className="text-[var(--color-ink)]">{client.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-muted)]">Cliente dal</dt>
            <dd className="text-[var(--color-ink)]">
              {formatDate(client.createdAt)}
            </dd>
          </div>
          {client.notes ? (
            <div className="col-span-2">
              <dt className="text-sm text-[var(--color-muted)]">Note operative</dt>
              <dd className="text-[var(--color-ink)]">{client.notes}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <ExistingClientToggle clientId={client.id} initialValue={client.isExistingClient} />

      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-[var(--color-ink)]">Storico appuntamenti</h2>
        <Link
          href={`/appuntamenti/nuovo?clientId=${client.id}`}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          + Nuovo appuntamento
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-[15px] text-[var(--color-muted)]">Nessun appuntamento ancora registrato.</p>
      ) : (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between gap-4 border-b border-[var(--color-line)] px-5 py-3.5 last:border-none"
            >
              <div>
                <p className="text-[15px] font-medium text-[var(--color-ink)]">
                  {formatDateTimeShort(appointment.startsAt)}
                </p>
                <p className="text-sm text-[var(--color-muted)]">{appointment.appointmentTypeName}</p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
