import { dataset, vacancies } from "./data";
import type { Vacancy } from "@/domain/contracts";

export { vacancies, dataset };

/** Lookup a single vacancy by stable id (e.g. "cov-001"). */
export function findVacancy(id: string): Vacancy | undefined {
  return vacancies.find((v) => v.id === id);
}

/** Human-readable COP salary, e.g. "$ 5.200.000". */
export function formatSalary(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "Sueldo no publicado";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Distinct cities across the dataset, sorted alphabetically (es locale). */
export function allCities(): string[] {
  return [
    ...new Set(
      vacancies.flatMap((v) => v.ubicaciones.sites.map((s) => s.city))
    ),
  ].sort((a, b) => a.localeCompare(b, "es"));
}