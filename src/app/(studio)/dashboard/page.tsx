import Link from "next/link";
import { StatCard } from "@/components/studio/dashboard/StatCard";
import { AppointmentRow } from "@/components/studio/dashboard/AppointmentRow";
import { formatDayLong } from "@/lib/format";
import {
  countUpcomingAppointments,
  getTodayAppointments,
  getUpcomingAppointments,
} from "@/lib/queries/studio/appuntamenti";
import { getClientCount, getRecentClients } from "@/lib/queries/studio/clienti";
import { getFreeSlotsCountToday } from "@/lib/queries/studio/dashboard";
import { countPendingRescheduleRequests } from "@/lib/queries/studio/richieste";

export default async function DashboardPage() {
  const [
    todayAppointments,
    upcomingAppointments,
    nextWeekCount,
    clientCount,
    freeSlotsToday,
    recentClients,
    pendingRequests,
  ] = await Promise.all([
    getTodayAppointments(),
    getUpcomingAppointments(5),
    countUpcomingAppointments(7),
    getClientCount(),
    getFreeSlotsCountToday(),
    getRecentClients(4),
    countPendingRescheduleRequests(),
  ]);

  const todayCount = todayAppointments.filter((a) => a.status !== "annullato").length;
  const todayLabel = formatDayLong(new Date().toISOString());

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-ink)]">
            Buongiorno
          </h1>
          <p className="mt-1 text-[15px] text-[var(--color-muted)]">
            Ecco la situazione di oggi, {todayLabel}.
          </p>
        </div>
        <Link
          href="/appuntamenti/nuovo"
          className="w-fit shrink-0 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          + Nuovo appuntamento
        </Link>
      </div>

      {pendingRequests > 0 ? (
        <Link
          href="/richieste"
          className="flex flex-col gap-1 rounded-xl border border-[var(--color-status-pending)]/30 sm:flex-row sm:items-center sm:justify-between sm:gap-3 bg-[var(--color-status-pending-bg)] px-5 py-4 transition-colors hover:border-[var(--color-status-pending)]"
        >
          <p className="text-[15px] font-medium text-[var(--color-ink)]">
            {pendingRequests === 1
              ? "C'è 1 richiesta di spostamento da gestire"
              : `Ci sono ${pendingRequests} richieste di spostamento da gestire`}
          </p>
          <span className="text-sm font-medium text-[var(--color-accent)]">Vai alle richieste</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard label="Appuntamenti oggi" value={todayCount} />
        <StatCard label="Slot liberi oggi" value={freeSlotsToday} />
        <StatCard label="Prossimi 7 giorni" value={nextWeekCount} />
        <StatCard label="Clienti totali" value={clientCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 xl:col-span-2">
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
          <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {recentClients.map((client) => (
              <Link
                key={client.id}
                href={`/clienti/${client.id}`}
                className="min-w-0 rounded-lg border border-[var(--color-line)] px-3.5 py-3 hover:border-[var(--color-accent)]"
              >
                <p className="truncate text-[15px] font-medium text-[var(--color-ink)]">
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
