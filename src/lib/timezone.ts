const ROME_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

/** Scarto di Roma rispetto a UTC (in minuti) in un dato istante: +60 (CET) o +120 (CEST). */
export function romeOffsetMinutes(instant: Date): number {
  const p = Object.fromEntries(ROME_PARTS.formatToParts(instant).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

/**
 * Converte "YYYY-MM-DDTHH:mm" (ora di Roma) nell'istante UTC corretto.
 * Lo scarto è calcolato sull'istante effettivo, quindi è corretto anche nei
 * giorni del cambio d'ora (ultima domenica di marzo e di ottobre).
 */
export function parseRomeLocalDateTime(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const naive = new Date(`${datePart}T${timePart.slice(0, 5)}:00.000Z`).getTime();
  let utc = naive - romeOffsetMinutes(new Date(naive)) * 60000;
  const off2 = romeOffsetMinutes(new Date(utc));
  utc = naive - off2 * 60000;
  return new Date(utc);
}

/** Data (YYYY-MM-DD) nel fuso Europe/Rome per un dato istante. */
export function romeDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Somma giorni a una chiave YYYY-MM-DD (aritmetica di calendario, senza fusi). */
export function addDaysToKey(key: string, days: number): string {
  const d = new Date(`${key}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Giorno della settimana ISO (1=lun ... 7=dom) di una chiave YYYY-MM-DD. */
export function isoDow(key: string): number {
  const dow = new Date(`${key}T12:00:00.000Z`).getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** Inizio (00:00) del giorno Rome come istante UTC. */
export function romeDayStart(key: string): Date {
  return parseRomeLocalDateTime(`${key}T00:00`);
}

/** Fine (23:59:59.999) del giorno Rome come istante UTC. */
export function romeDayEnd(key: string): Date {
  return new Date(romeDayStart(addDaysToKey(key, 1)).getTime() - 1);
}

/** Accetta un ISO con fuso (Z/+02:00) oppure un datetime-local "YYYY-MM-DDTHH:mm" (ora di Roma). */
export function parseInstant(value: string): Date {
  return /(Z|[+-]\d{2}:\d{2})$/.test(value) ? new Date(value) : parseRomeLocalDateTime(value);
}

/** Istante -> "YYYY-MM-DDTHH:mm" in ora di Roma, per i campi datetime-local. */
export function toRomeInputValue(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

export type BusyRange = { starts_at: string; ends_at: string };

/**
 * Calcola gli orari liberi (ISO UTC) di una data di Roma.
 * windows: fasce di apertura in ora di Roma, es. [{start:"09:00", end:"12:00"}].
 */
export function computeFreeSlots(opts: {
  dateKey: string;
  windows: { start: string; end: string }[];
  durationMinutes: number;
  busy: BusyRange[];
  nowMs: number;
}): string[] {
  const step = opts.durationMinutes * 60000;
  const busy = opts.busy.map((b) => ({ s: new Date(b.starts_at).getTime(), e: new Date(b.ends_at).getTime() }));
  const slots: string[] = [];
  for (const w of opts.windows) {
    let cursor = parseRomeLocalDateTime(`${opts.dateKey}T${w.start}`).getTime();
    const end = parseRomeLocalDateTime(`${opts.dateKey}T${w.end}`).getTime();
    while (cursor + step <= end) {
      const slotEnd = cursor + step;
      if (cursor > opts.nowMs && !busy.some((b) => b.s < slotEnd && b.e > cursor)) {
        slots.push(new Date(cursor).toISOString());
      }
      cursor = slotEnd;
    }
  }
  return slots;
}
