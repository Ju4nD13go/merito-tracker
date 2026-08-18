import type { OfficialChecksums, Vacancy } from '../types.ts'

export const OFFICIAL: OfficialChecksums = {
  forms: 291,
  empleos: 2826,
  byNivel: {
    Asesor: 685,
    Ejecutivo: 3,
    Profesional: 1199,
    Técnico: 471,
    Administrativo: 280,
    Operativo: 188,
  },
}

export interface Report {
  official: OfficialChecksums
  formsParsed: number
  missingNumbers: number[]
  empleosParsed: number
  empleosWithNullCargos: number
  byNivel: Record<string, { forms: number; empleos: number }>
  byDenominacion: Record<string, number>
  byCity: Record<string, number>
  totalSites: number
  plans: Record<string, number>
  cars: number
  notasCount: number
  carsWithNotes: string[]
  discrepantSiteSums: { id: string; cargos: number | null; siteSum: number }[]
}

export function buildReport(vacancies: Vacancy[]): Report {
  const byNivel: Record<string, { forms: number; empleos: number }> = {}
  const byDenominacion: Record<string, number> = {}
  const byCity: Record<string, number> = {}
  const plans: Record<string, number> = {}
  const missingNumbers: number[] = []
  const present = new Set(vacancies.map((v) => v.convocatoriaNo))
  for (let n = 1; n <= Math.max(...vacancies.map((v) => v.convocatoriaNo)); n++) {
    if (!present.has(n)) {
      missingNumbers.push(n)
      if (missingNumbers.length >= 20) break
    }
  }

  let empleosParsed = 0
  let empleosWithNullCargos = 0
  let totalSites = 0
  const discrepantSiteSums: Report['discrepantSiteSums'] = []
  const carsWithNotes: string[] = []

  for (const v of vacancies) {
    const nivel = v.empleo.nivelJerarquico ?? 'Desconocido'
    const nivelRec = (byNivel[nivel] ??= { forms: 0, empleos: 0 })
    nivelRec.forms++
    const c = v.ubicaciones.numeroCargos
    if (c === null) {
      empleosWithNullCargos++
    } else {
      empleosParsed += c
      nivelRec.empleos += c
    }
    byDenominacion[v.empleo.denominacion] = (byDenominacion[v.empleo.denominacion] ?? 0) + 1
    for (const s of v.ubicaciones.sites) {
      byCity[s.city] = (byCity[s.city] ?? 0) + s.count
      totalSites += s.count
    }
    plans[v.ubicaciones.plan ?? '(sin plan)'] = (plans[v.ubicaciones.plan ?? '(sin plan)'] ?? 0) + 1
    const siteSum = v.ubicaciones.sites.reduce((a, s) => a + s.count, 0)
    if (c !== null && siteSum !== c) {
      discrepantSiteSums.push({ id: v.id, cargos: c, siteSum })
    }
    if (v.rawNotes.length > 0) carsWithNotes.push(v.id)
  }

  return {
    official: OFFICIAL,
    formsParsed: vacancies.length,
    missingNumbers,
    empleosParsed,
    empleosWithNullCargos,
    byNivel,
    byDenominacion,
    byCity,
    totalSites,
    plans,
    cars: vacancies.length,
    notasCount: vacancies.reduce((a, v) => a + v.rawNotes.length, 0),
    carsWithNotes,
    discrepantSiteSums,
  }
}

export function formatCOP(n: number | null): string {
  if (n === null) return 'n/a'
  return '$' + n.toLocaleString('es-CO').replace(/,/g, '.')
}