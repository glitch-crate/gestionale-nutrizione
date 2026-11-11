import type { AppointmentStatus } from "@/types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  da_confermare: "Da confermare",
  confermato: "Confermato",
  completato: "Completato",
  annullato: "Annullato",
};

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  da_confermare: "bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending)]",
  confermato: "bg-[var(--color-status-confirmed-bg)] text-[var(--color-status-confirmed)]",
  completato: "bg-[var(--color-status-done-bg)] text-[var(--color-status-done)]",
  annullato: "bg-[var(--color-status-cancelled-bg)] text-[var(--color-status-cancelled)]",
};

/** Pallino colorato per lo stato (vista settimanale del calendario). */
export const STATUS_DOT: Record<AppointmentStatus, string> = {
  da_confermare: "bg-[var(--color-status-pending)]",
  confermato: "bg-[var(--color-status-confirmed)]",
  completato: "bg-[var(--color-status-done)]",
  annullato: "bg-[var(--color-status-cancelled)]",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${STATUS_STYLE[status]}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
