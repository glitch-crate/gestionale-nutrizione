// I campi <input type="datetime-local"> mandano una stringa senza fuso
// orario (es. "2026-10-04T07:00"), pensata come ora locale di chi la
// scrive (Roma). Il server gira però in UTC: interpretarla con un
// semplice `new Date(...)` la tratterebbe come se fosse già UTC,
// introducendo uno sfasamento di 1-2 ore (a seconda dell'ora legale).
// Questa funzione la converte correttamente, gestendo automaticamente
// il passaggio tra ora solare e ora legale.
export function parseRomeLocalDateTime(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const noonUtc = new Date(`${datePart}T12:00:00.000Z`);
  const romeHourAtNoonUtc = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hour12: false,
    }).format(noonUtc),
    10,
  );
  const offsetHours = romeHourAtNoonUtc - 12; // +1 (CET) oppure +2 (CEST)

  const asUtc = new Date(`${datePart}T${timePart}:00.000Z`);
  asUtc.setUTCHours(asUtc.getUTCHours() - offsetHours);
  return asUtc;
}
