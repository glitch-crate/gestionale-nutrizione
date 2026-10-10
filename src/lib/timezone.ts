/** Converte "YYYY-MM-DDTHH:mm" (ora di Roma) nell'istante UTC corretto, anche con ora legale. */
export function parseRomeLocalDateTime(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const noonUtc = new Date(`${datePart}T12:00:00.000Z`);
  const romeHourAtNoonUtc = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", hour: "2-digit", hour12: false }).format(noonUtc),
    10,
  );
  const offsetHours = romeHourAtNoonUtc - 12;
  const asUtc = new Date(`${datePart}T${timePart}:00.000Z`);
  asUtc.setUTCHours(asUtc.getUTCHours() - offsetHours);
  return asUtc;
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
