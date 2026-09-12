import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { AppointmentRow } from "@/components/dashboard/AppointmentRow";
import {
  mockClients,
  mockFreeSlotsToday,
  mockTodayAppointments,
  mockUpcomingAppointments,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const todayCount = mockTodayAppointments.filter(
    (a) => a.status !== "annullato",
  ).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-ink)]">
            Buongiorno
          </h1>
          <p className="mt-1 text-[15px] text-[var(--color-muted)]">
            Ecco la situazione di oggi, 12 settembre.
          </p>
        </div>
        <Link
          href="/appuntamenti"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          + Nuovo appuntamento
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Appuntamenti oggi" value={todayCount} />
        <StatCard label="Slot liberi oggi" value={mockFreeSlotsToday} />
        <StatCard label="Prossimi 7 giorni" value={mockUpcomingAppointments.length} />
        <StatCard label="Clienti totali" value={mockClients.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 lg:col-span-2">
          <h2 className="text-[15px] font-medium text-[var(--color-ink)]">
            Agenda di oggi
          </h2>
          <div className="mt-2">
            {mockTodayAppointments.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-[15px] font-medium text-[var(--color-ink)]">
            Prossimi appuntamenti
          </h2>
          <div className="mt-2">
            {mockUpcomingAppointments.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} showDate />
            ))}
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
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {mockClients.map((client) => (
            <div
              key={client.id}
              className="rounded-lg border border-[var(--color-line)] px-3.5 py-3"
            >
              <p className="text-[15px] font-medium text-[var(--color-ink)]">
                {client.firstName} {client.lastName}
              </p>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                {client.phone}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
