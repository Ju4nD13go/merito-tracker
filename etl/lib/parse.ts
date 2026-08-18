import { parseEmpleo } from './ident.ts'
import { parseLocations } from './locations.ts'
import { parseProposito } from './proposito.ts'
import { parseRequisitos } from './requisitos.ts'
import { parseSection4, parseSection5, parsePruebas, parseNotas } from './extras.ts'
import { firstMeta } from './forms.ts'
import type { FormBlock } from './forms.ts'
import type { Vacancy } from '../types.ts'

const VERSION_RE = /Versi[oó]n\s+No\.?\s*(\d+)/
const RESOLUCION_RE = /Resoluci[oó]n\s+No?\.?\s*(\d+)\s+de\s+2026/i
const FECHA_FIJACION_RE = /Fecha de fijaci[oó]n:\s*(.+)$/

export function parseBlock(block: FormBlock): Vacancy {
  const notas: string[] = []
  const no = block.no
  const versionNo = Number(firstMeta(block, VERSION_RE) ?? 0)
  const resolucion = Number(firstMeta(block, RESOLUCION_RE) ?? 0)
  const terminoLines: string[] = []
  for (let i = 0; i < Math.min(block.lines.length, 30); i++) {
    const t = block.lines[i].trim()
    if (/T[ée]rmino para las inscripciones:/i.test(t)) {
      terminoLines.push(t.replace(/T[ée]rmino para las inscripciones:\s*/i, ''))
      continue
    }
    if (terminoLines.length > 0) {
      if (/Medio de divulgaci[oó]n:/i.test(t)) break
      if (t && !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(t)) terminoLines.push(t)
    }
  }
  const terminoInscripciones = terminoLines.map((l) => l.trim()).join(' ') || null
  const fechaFijacion = firstMeta(block, FECHA_FIJACION_RE)

  const empleo = parseEmpleo(block, notas)
  const ubicaciones = parseLocations(block, notas)
  const requisitos = parseRequisitos(block)
  const proposito = parseProposito(block)

  if (ubicaciones.numeroCargos === null) {
    notas.push('número de cargos no identificado')
  }
  if (!empleo.asignacionBasica) {
    notas.push('asignación básica ausente o no extraída')
  }
  if (proposito.proposito.length === 0) {
    notas.push('propósito vacío')
  }
  if (proposito.funciones.length === 0) {
    notas.push('funciones vacías')
  }

  return {
    id: `cov-${String(no).padStart(3, '0')}`,
    convocatoriaNo: no,
    convocatoriaLabel: `CONVOCATORIA No. ${no} – 2026`,
    resolucion,
    versionNo,
    fechaFijacion,
    terminoInscripciones,
    empleo,
    ubicaciones,
    requisitos,
    proposito: proposito.proposito,
    funciones: proposito.funciones,
    conocimientosEspecificos: parseSection4(block),
    conocimientosComunes: parseSection5(block),
    pruebas: parsePruebas(block),
    notasGenerales: parseNotas(block),
    rawNotes: notas,
  }
}