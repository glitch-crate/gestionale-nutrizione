// Tipi di dominio del gestionale.
// Rispecchiano lo schema del database definito in supabase/schema.sql.
// Nell'MVP esiste un solo studio e un solo professionista: i campi
// studioId/professionalId sono comunque presenti fin da ora per non
// dover riscrivere i tipi quando si supporteranno più studi.

export type AppointmentStatus =
  | "da_confermare"
  | "confermato"
  | "completato"
  | "annullato";

export interface Client {
  id: string;
  studioId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string | null;
  createdAt: string;
  isExistingClient: boolean;
  hasPortalAccount?: boolean;
}

export interface Appointment {
  id: string;
  studioId: string;
  clientId: string;
  appointmentTypeId: string;
  professionalId: string;
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  // Campi denormalizzati comodi per la UI (join lato query, non colonne reali)
  clientName?: string;
  appointmentTypeName?: string;
}

// Portale cliente
export interface AvailableSlot {
  slotStart: string; // ISO datetime
  slotEnd: string; // ISO datetime
  durationMinutes: number;
  appointmentTypeName: string;
}

// Calendario studio: fascia oraria in cui non si ricevono appuntamenti
export interface TimeBlock {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

// Impostazioni studio: fasce di apertura per giorno ISO ("1" = lunedì … "7" = domenica)
export interface TimeWindow {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}
export type OpeningHours = Record<string, TimeWindow[]>;

// Richieste di spostamento fatte dai clienti
export type RescheduleRequestStatus = "in_attesa" | "approvata" | "rifiutata" | "annullata" | "scaduta";

// Esito di una server action: in caso di errore, un messaggio da mostrare all'utente
export type ActionResult = { success: true } | { success: false; error: string };
