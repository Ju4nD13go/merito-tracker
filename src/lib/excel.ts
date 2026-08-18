"use client";

import writeXlsxFile, { type Schema } from "write-excel-file";
import type { Vacancy } from "@/domain/contracts";

/**
 * Export favorite vacancies to a real .xlsx workbook (not CSV).
 * Uses write-excel-file with the schema API: objects + value getters,
 * so types stay exact and cells get correct String/Number types.
 */

const SCHEMA: Schema<Vacancy> = [
  {
    column: "Denominación",
    type: String,
    width: 28,
    value: (v) => v.empleo.denominacion,
  },
  {
    column: "Nivel",
    type: String,
    width: 14,
    value: (v) => v.empleo.nivelJerarquico ?? "",
  },
  {
    column: "Código y grado",
    type: String,
    width: 14,
    value: (v) => v.empleo.codigoGrado,
  },
  {
    column: "N.º cargos",
    type: Number,
    width: 10,
    value: (v) => v.ubicaciones.numeroCargos ?? null,
  },
  {
    column: "Asignación básica",
    type: Number,
    width: 16,
    value: (v) => v.empleo.asignacionBasica?.amount ?? null,
  },
  {
    column: "Ubicaciones",
    type: String,
    width: 40,
    value: (v) =>
      v.ubicaciones.sites.map((s) => `${s.city} (${s.count})`).join(", "),
  },
  {
    column: "Requisitos mínimos",
    type: String,
    width: 70,
    value: (v) => v.requisitos.estudio,
  },
  {
    column: "Propósito",
    type: String,
    width: 60,
    value: (v) => v.proposito,
  },
  {
    column: "Detalle",
    type: String,
    width: 40,
    value: (v) => `https://merito-tracker.app/vacantes/${v.id}`,
  },
];

export async function exportFavoritesToExcel(
  vacancies: Vacancy[],
  filename = "merito-tracker-favoritas.xlsx"
): Promise<void> {
  await writeXlsxFile(vacancies, {
    fileName: filename,
    schema: SCHEMA,
    stickyRowsCount: 1,
    getHeaderStyle: () => ({
      backgroundColor: "#1e5e3f",
      color: "#ffffff",
      fontWeight: "bold",
      align: "center",
    }),
  });
}