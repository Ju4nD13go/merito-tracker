import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildKeyDates,
  daysUntil,
  buildKeyDatesSnapshot,
} from "./key-dates.ts";

const META = {
  fechaFijacion: "2026-03-24",
  inscripcionWindow: {
    label: "07 al 18 de septiembre de 2026",
    start: "2026-09-07",
    end: "2026-09-18",
  },
};

test("buildKeyDates marks unpublished stages as confirmed=false", () => {
  const dates = buildKeyDates({ ...META, actualDate: "2026-08-18" });
  assert.ok(dates.find((d) => d.id === "inscripcion")?.confirmed);
  assert.ok(dates.find((d) => d.id === "pruebas")?.confirmed === false);
  // never invent a date for unpublished stages
  assert.equal(dates.find((d) => d.id === "pruebas")?.start, null);
});

test("buildKeyDatesSnapshot detects registration open/closed", () => {
  const open = buildKeyDatesSnapshot({ ...META, actualDate: "2026-09-10" }, "2026-08-18T00:00:00Z");
  assert.equal(open.registrationOpen, true);
  assert.equal(open.nextDeadline?.daysLeft, 8); // window CLOSES 2026-09-18

  const before = buildKeyDatesSnapshot({ ...META, actualDate: "2026-08-18" }, null);
  assert.equal(before.registrationOpen, false);
  assert.equal(before.nextDeadline?.daysLeft, 20); // window OPENS 2026-09-07
});

test("daysUntil returns negative for past dates and null for missing", () => {
  assert.equal(daysUntil("2026-09-07", "2026-08-18"), 20);
  assert.equal(daysUntil("2026-03-24", "2026-08-18"), -147);
  assert.equal(daysUntil(null, "2026-08-18"), null);
});