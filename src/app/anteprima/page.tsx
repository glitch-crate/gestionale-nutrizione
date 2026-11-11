// PAGINA TEMPORANEA DI ANTEPRIMA — da eliminare dopo la revisione.
import { notFound } from "next/navigation";
import { StatCard } from "@/components/studio/dashboard/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AppointmentActions } from "@/components/studio/appuntamenti/AppointmentActions";
import { PortaleHeader } from "@/components/portale/layout/PortaleHeader";
import { PortaleFooter } from "@/components/portale/layout/StudioContacts";
import { BookingTicket } from "@/components/portale/prenota/BookingTicket";

const DEMO_START = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">{title}</h2>
      {children}
    </section>
  );
}

export default function AnteprimaPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 bg-[var(--color-canvas)] px-4 py-8">
      <Section title="Dashboard — card riepilogo (P1) e clienti recenti (P2)">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Appuntamenti oggi" value={4} />
          <StatCard label="Slot liberi oggi" value={6} />
          <StatCard label="Prossimi 7 giorni" value={12} />
          <StatCard label="Clienti totali" value={87} />
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-[15px] font-medium text-[var(--color-ink)]">Clienti recenti</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["Giulia Neri", "Paolo Gallo", "Sara Conti", "Luca Verdi"].map((n) => (
              <div key={n} className="rounded-lg border border-[var(--color-line)] px-3.5 py-3">
                <p className="text-[15px] font-medium text-[var(--color-ink)]">{n}</p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">333 123 4567</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Appuntamento — pulsante Annulla con conferma (P3)">
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-medium text-[var(--color-ink)]">Mario Rossi</p>
            <p className="text-sm text-[var(--color-muted)]">Controllo</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status="confermato" />
            <AppointmentActions appointmentId="demo" status="confermato" startsAt={DEMO_START} />
          </div>
        </div>
      </Section>

      <Section title="Portale — biglietto di conferma dopo la prenotazione">
        <BookingTicket slot={{ slotStart: DEMO_START, slotEnd: DEMO_START, durationMinutes: 45, appointmentTypeName: "Primo incontro" }} />
      </Section>

      <Section title="Portale clienti — intestazione e piè di pagina con i contatti (P5)">
        <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
          <PortaleHeader />
          <div className="bg-[var(--color-canvas)] px-6 py-10 text-[15px] text-[var(--color-muted)]">
            (contenuto della pagina)
          </div>
          <PortaleFooter />
        </div>
      </Section>
    </main>
  );
}
