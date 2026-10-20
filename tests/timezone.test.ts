import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseRomeLocalDateTime, parseInstant, toRomeInputValue, romeDateKey,
  romeDayStart, romeDayEnd, addDaysToKey, isoDow, computeFreeSlots,
} from "../src/lib/timezone.ts";

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });

test("creazione: 4 nov 2026 12:45 Roma -> 11:45Z (ora solare)", () => {
  assert.equal(parseRomeLocalDateTime("2026-11-04T12:45").toISOString(), "2026-11-04T11:45:00.000Z");
});
test("creazione: 4 lug 2026 12:45 Roma -> 10:45Z (ora legale)", () => {
  assert.equal(parseRomeLocalDateTime("2026-07-04T12:45").toISOString(), "2026-07-04T10:45:00.000Z");
});
test("lettura: 11:45Z mostrato come 12:45 e come valore input", () => {
  assert.equal(fmt("2026-11-04T11:45:00.000Z"), "12:45");
  assert.equal(toRomeInputValue("2026-11-04T11:45:00.000Z"), "2026-11-04T12:45");
});
test("modifica: round-trip input -> UTC -> input, tutto l'anno", () => {
  for (const d of ["2026-01-15T09:00","2026-03-28T23:30","2026-03-29T01:30","2026-03-29T03:30","2026-03-29T12:45",
                   "2026-06-10T18:40","2026-10-24T12:45","2026-10-25T01:30","2026-10-25T03:30","2026-10-25T12:45","2026-12-31T23:59"]) {
    const u = parseRomeLocalDateTime(d);
    assert.equal(toRomeInputValue(u.toISOString()), d, d);
  }
});
test("cambio ora: 29 mar 2026 (23h) e 25 ott 2026 (25h)", () => {
  assert.equal(parseRomeLocalDateTime("2026-03-29T12:00").toISOString(), "2026-03-29T10:00:00.000Z");
  assert.equal(parseRomeLocalDateTime("2026-03-29T01:30").toISOString(), "2026-03-29T00:30:00.000Z");
  assert.equal(parseRomeLocalDateTime("2026-10-25T01:30").toISOString(), "2026-10-24T23:30:00.000Z");
  assert.equal(parseRomeLocalDateTime("2026-10-25T12:00").toISOString(), "2026-10-25T11:00:00.000Z");
  const h = (k: string) => (romeDayEnd(k).getTime() + 1 - romeDayStart(k).getTime()) / 3600000;
  assert.equal(h("2026-03-29"), 23);
  assert.equal(h("2026-10-25"), 25);
  assert.equal(h("2026-11-04"), 24);
});
test("parseInstant: ISO con Z invariato, senza fuso = ora di Roma", () => {
  assert.equal(parseInstant("2026-11-04T11:45:00.000Z").toISOString(), "2026-11-04T11:45:00.000Z");
  assert.equal(parseInstant("2026-11-04T12:45").toISOString(), "2026-11-04T11:45:00.000Z");
});
test("giorno di Roma vicino a mezzanotte", () => {
  assert.equal(romeDateKey(new Date("2026-11-04T23:30:00Z")), "2026-11-05");
  assert.equal(romeDateKey(new Date("2026-07-04T22:30:00Z")), "2026-07-05");
  assert.equal(addDaysToKey("2026-10-25", 1), "2026-10-26");
  assert.equal(isoDow("2026-11-04"), 3);
});
test("disponibilità: visita da 45 min, griglia da 20, escluso l'occupato 09:45-10:30 (ora solare)", () => {
  const slots = computeFreeSlots({
    dateKey: "2026-11-03", windows: [{ start: "09:00", end: "12:00" }], durationMinutes: 45,
    busy: [{ starts_at: "2026-11-03T08:45:00Z", ends_at: "2026-11-03T09:30:00Z" }], nowMs: 0,
  });
  assert.deepEqual(slots.map(fmt), ["09:00", "10:40", "11:00"]);
  assert.equal(slots[0], "2026-11-03T08:00:00.000Z");
});
test("disponibilità: ora legale (luglio) e due fasce (09-12 e 14:30-19)", () => {
  const slots = computeFreeSlots({
    dateKey: "2026-07-07", windows: [{ start: "09:00", end: "10:00" }, { start: "14:30", end: "15:30" }],
    durationMinutes: 20, busy: [], nowMs: 0,
  });
  assert.deepEqual(slots.map(fmt), ["09:00", "09:20", "09:40", "14:30", "14:50", "15:10"]);
  assert.equal(slots[0], "2026-07-07T07:00:00.000Z");
});
test("disponibilità: giorni di cambio ora (29 mar, 25 ott)", () => {
  const a = computeFreeSlots({ dateKey: "2026-03-29", windows: [{ start: "09:00", end: "10:00" }], durationMinutes: 30, busy: [], nowMs: 0 });
  assert.deepEqual(a, ["2026-03-29T07:00:00.000Z", "2026-03-29T07:20:00.000Z"]);
  const b = computeFreeSlots({ dateKey: "2026-10-25", windows: [{ start: "09:00", end: "10:00" }], durationMinutes: 30, busy: [], nowMs: 0 });
  assert.deepEqual(b, ["2026-10-25T08:00:00.000Z", "2026-10-25T08:20:00.000Z"]);
});
test("disponibilità: gli orari passati e quelli occupati sono esclusi", () => {
  const now = Date.parse("2026-11-03T08:30:00Z"); // 09:30 Roma
  const slots = computeFreeSlots({
    dateKey: "2026-11-03", windows: [{ start: "09:00", end: "11:00" }], durationMinutes: 30,
    busy: [{ starts_at: "2026-11-03T09:30:00Z", ends_at: "2026-11-03T10:00:00Z" }], nowMs: now,
  });
  assert.deepEqual(slots.map(fmt), ["09:40", "10:00"]); // 09:00 e 09:20 passati, 10:20 e oltre toccano il blocco 10:30-11:00
});
test("disponibilità: trattamento da 60 min su griglia da 20, senza sovrapposizioni", () => {
  const free = computeFreeSlots({ dateKey: "2026-11-03", windows: [{ start: "09:00", end: "12:00" }], durationMinutes: 60, busy: [], nowMs: 0 });
  assert.deepEqual(free.map(fmt), ["09:00", "09:20", "09:40", "10:00", "10:20", "10:40", "11:00"]);
  // occupato 10:00-10:20 Roma (09:00-09:20Z): restano solo gli orari che finiscono prima o iniziano dopo
  const withBusy = computeFreeSlots({
    dateKey: "2026-11-03", windows: [{ start: "09:00", end: "12:00" }], durationMinutes: 60,
    busy: [{ starts_at: "2026-11-03T09:00:00Z", ends_at: "2026-11-03T09:20:00Z" }], nowMs: 0,
  });
  assert.deepEqual(withBusy.map(fmt), ["09:00", "10:20", "10:40", "11:00"]);
});
