/**
 * Domain contracts — re-export of the ETL schema so the domain layer
 * stays decoupled from the ETL folder (ETL self-contained).
 */

export type Level =
  | 'Asesor'
  | 'Ejecutivo'
  | 'Profesional'
  | 'Técnico'
  | 'Administrativo'
  | 'Operativo'

export interface Site {
  city: string
  count: number
}

export interface LocationGroup {
  label: string
  sites: Site[]
}

export interface Ubicaciones {
  plan: string | null
  dependency: string | null
  proceso: string | null
  whereverAssigned: boolean
  numeroCargos: number | null
  groups: LocationGroup[]
  sites: Site[]
}

export interface Requisitos {
  estudio: string
  experiencia: string | null
  tarjetaProfesional: boolean
  equivalencias: string | null
  documentsNote: string | null
}

export interface Vacancy {
  id: string
  convocatoriaNo: number
  convocatoriaLabel: string
  resolucion: number
  versionNo: number
  fechaFijacion: string | null
  terminoInscripciones: string | null
  empleo: {
    denominacion: string
    codigoGrado: string
    codigo: string | null
    grado: number | null
    nivelJerarquico: Level | null
    asignacionBasica: { amount: number | null; raw: string | null; vigencia: number | null } | null
  }
  ubicaciones: Ubicaciones
  requisitos: Requisitos
  proposito: string
  funciones: string[]
  conocimientosEspecificos: string[]
  conocimientosComunes: string[]
  pruebas: { name: string; pct: number | null }[]
  notasGenerales: string | null
  rawNotes: string[]
}

export interface VacancyDataset {
  schema: string
  generatedAt: string
  source: { pdf: string; pages: number; sizeBytes: number; textCache: string }
  metadata: {
    processName: string
    competitionName: string
    resolutions: number[]
    formatoCodigo: string
    formatoVersion: number
    fechaFijacion: string | null
    fechaFijacionLabel: string | null
    inscripcionWindow: { label: string; start: string; end: string } | null
    officialChecksums?: {
      forms: number
      empleos: number
      byNivel?: Record<string, number>
    }
  }
  counts: Record<string, unknown>
  vacancies: Vacancy[]
}

/** Education levels recognised in the free-text `estudio` field, lowest → highest. */
export const EDUCATION_LEVELS = [
  'bachillerato',
  'técnica',
  'tecnológica',
  'universitaria',
  'posgrado',
] as const

export type EducationLevel = (typeof EDUCATION_LEVELS)[number]