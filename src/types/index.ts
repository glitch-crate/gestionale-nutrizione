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

export interface AppointmentType {
  id: string;
  studioId: string;
  name: string;
  durationMinutes: number;
  active: boolean;
}

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

export interface StudioSettings {
  id: string;
  studioId: string;
  businessName: string;
  timezone: string;
  defaultSlotMinutes: number;
}

// Portale cliente
export interface AvailableSlot {
  slotStart: string; // ISO datetime
  slotEnd: string; // ISO datetime
  durationMinutes: number;
  appointmentTypeName: string;
}

export interface MyAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  appointmentTypeName?: string;
}
