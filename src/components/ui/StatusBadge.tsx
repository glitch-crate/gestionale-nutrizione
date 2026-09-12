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

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
