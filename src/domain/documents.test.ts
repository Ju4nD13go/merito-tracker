import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveDocuments } from "./documents.ts";

function fakeVacancy(overrides: Record<string, unknown> = {}) {
  return {
    id: "cov-000",
    requisitos: {
      estudio: "Título de formación universitaria",
      experiencia: null,
      tarjetaProfesional: false,
      equivalencias: null,
      documentsNote: null,
    },
    ...overrides,
  } as never;
}

test("common items always present", () => {
  const items = deriveDocuments(fakeVacancy());
  const ids = items.map((i) => i.id);
  assert.ok(ids.includes("cedula"));
  assert.ok(ids.includes("simo"));
  assert.ok(ids.includes("titulo"));
  assert.ok(!ids.includes("tarjeta"));
  assert.ok(!ids.includes("licencia"));
});

test("professional license adds tarjeta item", () => {
  const items = deriveDocuments(
    fakeVacancy({ requisitos: { estudio: "Título", experiencia: null, tarjetaProfesional: true, equivalencias: null, documentsNote: null } })
  );
  assert.ok(items.some((i) => i.id === "tarjeta"));
});

test("experience field adds certificados item", () => {
  const items = deriveDocuments(
    fakeVacancy({ requisitos: { estudio: "Título", experiencia: "Dos (2) años", tarjetaProfesional: false, equivalencias: null, documentsNote: null } })
  );
  assert.ok(items.some((i) => i.id === "certificados"));
});

test("driving licence mention adds licencia item", () => {
  const items = deriveDocuments(
    fakeVacancy({ requisitos: { estudio: "Licencia de conducción categoría C2", experiencia: null, tarjetaProfesional: false, equivalencias: null, documentsNote: null } })
  );
  assert.ok(items.some((i) => i.id === "licencia"));
});