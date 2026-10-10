import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { AppointmentRow } from "@/components/dashboard/AppointmentRow";
import {
  getClientCount,
  getClients,
  getFreeSlotsCountToday,
  getTodayAppointments,
  getUpcomingAppointments,
} from "@/lib/queries";

export default async function DashboardPage() {
  const [todayAppointments, upcomingAppointments, clientCount, freeSlotsToday, recentClients] =
    await Promise.all([
      getTodayAppointments(),
      getUpcomingAppointments(5),
      getClientCount(),
      getFreeSlotsCountToday(),
      getClients(),
    ]);

  const todayCount = todayAppointments.filter((a) => a.status !== "annullato").length;
  const todayLabel = new Date().toLocaleDateString("it-IT", { timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
            Buongiorno
          </h1>
          <p className="mt-1 text-[15px] text-[var(--color-muted)]">
            Ecco la situazione di oggi, {todayLabel}.
          </p>
        </div>
        <Link
          href="/appuntamenti/nuovo"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          + Nuovo appuntamento
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Appuntamenti oggi" value={todayCount} />
        <StatCard label="Slot liberi oggi" value={freeSlotsToday} />
        <StatCard label="Prossimi 7 giorni" value={upcomingAppointments.length} />
        <StatCard label="Clienti totali" value={clientCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 lg:col-span-2">
          <h2 className="text-[15px] font-medium text-[var(--color-ink)]">
            Agenda di oggi
          </h2>
          <div className="mt-2">
            {todayAppointments.length === 0 ? (
              <p className="py-3 text-[15px] text-[var(--color-muted)]">
                Nessun appuntamento oggi.
              </p>
            ) : (
              todayAppointments.map((appointment) => (
                <AppointmentRow key={appointment.id} appointment={appointment} />
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-[15px] font-medium text-[var(--color-ink)]">
            Prossimi appuntamenti
          </h2>
          <div className="mt-2">
            {upcomingAppointments.length === 0 ? (
              <p className="py-3 text-[15px] text-[var(--color-muted)]">
                Nessun appuntamento in programma.
              </p>
            ) : (
              upcomingAppointments.map((appointment) => (
                <AppointmentRow key={appointment.id} appointment={appointment} showDate />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-[var(--color-ink)]">
            Clienti recenti
          </h2>
          <Link
            href="/clienti"
            className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
          >
            Vedi tutti
          </Link>
        </div>
        {recentClients.length === 0 ? (
          <p className="mt-3 text-[15px] text-[var(--color-muted)]">Nessun cliente ancora.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recentClients.slice(0, 4).map((client) => (
              <Link
                key={client.id}
                href={`/clienti/${client.id}`}
                className="rounded-lg border border-[var(--color-line)] px-3.5 py-3 hover:border-[var(--color-accent)]"
              >
                <p className="text-[15px] font-medium text-[var(--color-ink)]">
                  {client.firstName} {client.lastName}
                </p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">{client.phone}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
