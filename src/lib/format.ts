// Formattazione di date e orari per l'interfaccia, sempre nel fuso
// orario dello studio (vedi TIMEZONE in timezone.ts) e in italiano.

import { TIMEZONE } from "@/lib/timezone";

const LOCALE = "it-IT";

/** "lunedì 3 novembre" → "Lunedì 3 novembre" */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** 09:30 */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 09:30 – 11:00 */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

/** 3/11/2026 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { timeZone: TIMEZONE });
}

/** lun 3 nov */
export function formatDayShort(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** lunedì 3 novembre */
export function formatDayLong(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** lun 3 nov, 09:30 */
export function formatDateTimeShort(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** lunedì 3 novembre alle ore 09:30 */
export function formatDateTimeLong(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Data di calendario "YYYY-MM-DD" (senza orario), con le opzioni date.
 * Si usa mezzogiorno UTC così il giorno non cambia con il fuso.
 */
export function formatDateKey(key: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString(LOCALE, { timeZone: TIMEZONE, ...options });
}

/** Giorni della settimana con chiave ISO (1 = lunedì … 7 = domenica). */
export const WEEK_DAYS = [
  { key: "1", label: "Lunedì" },
  { key: "2", label: "Martedì" },
  { key: "3", label: "Mercoledì" },
  { key: "4", label: "Giovedì" },
  { key: "5", label: "Venerdì" },
  { key: "6", label: "Sabato" },
  { key: "7", label: "Domenica" },
] as const;
