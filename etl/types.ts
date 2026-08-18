export type Level =
  | 'Asesor'
  | 'Ejecutivo'
  | 'Profesional'
  | 'Técnico'
  | 'Administrativo'
  | 'Operativo'

export interface AsignacionBasica {
  amount: number | null
  raw: string | null
  vigencia: number | null
}

export interface Empleo {
  denominacion: string
  codigoGrado: string
  codigo: string | null
  grado: number | null
  nivelJerarquico: Level | null
  asignacionBasica: AsignacionBasica | null
}

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

export interface TestWeight {
  name: string
  pct: number | null
}

export interface Vacancy {
  id: string
  convocatoriaNo: number
  convocatoriaLabel: string
  resolucion: number
  versionNo: number
  fechaFijacion: string | null
  terminoInscripciones: string | null
  empleo: Empleo
  ubicaciones: Ubicaciones
  requisitos: Requisitos
  proposito: string
  funciones: string[]
  conocimientosEspecificos: string[]
  conocimientosComunes: string[]
  pruebas: TestWeight[]
  notasGenerales: string | null
  rawNotes: string[]
}

export interface OfficialChecksums {
  forms: number
  empleos: number
  byNivel: Record<string, number>
}

export interface VacancyDataset {
  schema: string
  generatedAt: string
  source: {
    pdf: string
    pages: number
    sizeBytes: number
    textCache: string
  }
  metadata: {
    processName: string
    competitionName: string
    resolutions: number[]
    formatoCodigo: string
    formatoVersion: number
    fechaFijacion: string
    fechaFijacionLabel: string
    inscripcionWindow: { label: string; start: string; end: string }
    officialChecksums: OfficialChecksums
  }
  counts: {
    forms: number
    totalEmpleos: number
    empleosWithNullCargos: number
    byNivel: Record<string, number>
    byDenominacion: Record<string, number>
    byCity: Record<string, number>
    totalSites: number
    groupLabels: Record<string, number>
  }
  vacancies: Vacancy[]
}