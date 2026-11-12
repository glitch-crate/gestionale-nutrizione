import Link from "next/link";
import { getClients } from "@/lib/queries/studio/clienti";
import { ClientSearchBar } from "@/components/studio/clienti/ClientSearchBar";
import { NewClientForm } from "@/components/studio/clienti/NewClientForm";

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await getClients(q);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-ink)]">
            Clienti
          </h1>
          <p className="mt-1 text-[15px] text-[var(--color-muted)]">
            {clients.length} {clients.length === 1 ? "cliente" : "clienti"}
          </p>
        </div>
        <NewClientForm />
      </div>

      <ClientSearchBar initialValue={q ?? ""} />

      {clients.length === 0 ? (
        <p className="text-[15px] text-[var(--color-muted)]">
          {q ? "Nessun cliente trovato." : "Non hai ancora nessun cliente."}
        </p>
      ) : (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clienti/${client.id}`}
              className="grid grid-cols-1 gap-0.5 border-b border-[var(--color-line)] px-4 py-3.5 last:border-none hover:bg-[var(--color-canvas)] sm:px-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.4fr)] md:items-center md:gap-4"
            >
              <p className="truncate text-[15px] font-medium text-[var(--color-ink)]">
                {client.firstName} {client.lastName}
              </p>
              <p className="whitespace-nowrap text-sm text-[var(--color-muted)]">{client.phone}</p>
              <p className="truncate text-sm text-[var(--color-muted)] md:text-right">{client.email}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
