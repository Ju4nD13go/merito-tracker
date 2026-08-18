import type { Empleo, Level, AsignacionBasica } from '../types.ts'
import { cleanLines, firstMeta } from './forms.ts'
import { collapseSpaces, findLabelCol, isArtifactLine, parseCop } from './utils.ts'
import type { FormBlock } from './forms.ts'

const CODIGO_LABEL_RE = /C[oó]digo\s+y\s+[Gg]rado/
const NIVEL_LABEL_RE = /Nivel\s+jer[aá]rquico/
const ASAL_LABEL_RE = /Asignaci[oó]n\s+b[aá]sica/
const CODIGO_VALUE_RE = /([1-6][A-Z]{1,3})\s*[-–—]?\s*([0-9]{1,2}|[A-Z]{1,2})/
const SALARY_RE = /\$\s*([\d.]+)/
const VIGENCIA_RE = /Vigencia\s+(\d{4})/i

export const LEVEL_BY_PREFIX: Record<string, Level> = {
  '1': 'Asesor',
  '2': 'Ejecutivo',
  '3': 'Profesional',
  '4': 'Técnico',
  '5': 'Administrativo',
  '6': 'Operativo',
}

export function deriveLevelCode(codigoGrado: string): string | null {
  const m = /^([1-6])/.exec(codigoGrado.trim())
  return m ? m[1] : null
}

interface RawHeader {
  labelRow: string
  valueBlock: string[]
  codLabelCol: number | null
  nivelLabelCol: number | null
  asalLabelCol: number | null
}

function select(line: string, start: number, end?: number): string {
  if (start < 0) return line
  return end !== undefined ? line.slice(start, end) : line.slice(start)
}

function headerRows(lines: string[]): RawHeader | null {
  const labelIdx = lines.findIndex((l) => l.includes('Denominación del empleo'))
  if (labelIdx < 0) return null
  const labelRow = lines[labelIdx]
  const valueBlock: string[] = []
  for (let i = labelIdx + 1; i < lines.length && i < labelIdx + 8; i++) {
    const l = lines[i]
    if (l.includes('Ubicación(es)')) break
    if (l.trim() === '' || isArtifactLine(l)) continue
    valueBlock.push(l)
  }
  return {
    labelRow,
    valueBlock,
    codLabelCol: findLabelCol(labelRow, CODIGO_LABEL_RE),
    nivelLabelCol: findLabelCol(labelRow, NIVEL_LABEL_RE),
    asalLabelCol: findLabelCol(labelRow, ASAL_LABEL_RE),
  }
}

export function parseEmpleo(block: FormBlock, notas: string[]): Empleo {
  const raw = headerRows(cleanLines(block.lines))
  const hdr = raw ?? {
    labelRow: '',
    valueBlock: [],
    codLabelCol: null,
    nivelLabelCol: null,
    asalLabelCol: null,
  }
  const codIdx = hdr.codLabelCol ?? 0
  const nivelIdx = hdr.nivelLabelCol
  const asalIdx = hdr.asalLabelCol

  let denominacion = ''
  let codigoGrado = ''
  if (raw) {
    const codeEnd = nivelIdx ?? asalIdx ?? hdr.labelRow.length
    const codeLine =
      hdr.valueBlock.find((l) => CODIGO_VALUE_RE.test(select(l, codIdx, codeEnd))) ??
      hdr.valueBlock[0] ??
      ''
    denominacion = codIdx > 0 ? collapseSpaces(codeLine.slice(0, codIdx)) : ''
    codigoGrado = collapseSpaces(select(codeLine, codIdx, codeEnd))
  }

  let codigo: string | null = null
  let grado: number | null = null
  const cg = CODIGO_VALUE_RE.exec(codigoGrado)
  if (cg) {
    codigo = cg[1]
    const g = cg[2]
    if (/^\d+$/.test(g)) grado = Number(g)
  } else if (denominacion) {
    const m = CODIGO_VALUE_RE.exec(denominacion)
    if (m) {
      codigo = m[1]
      const g = m[2]
      if (/^\d+$/.test(g)) grado = Number(g)
    }
  }

  let nivelLabel: string | null = null
  if (nivelIdx !== null) {
    const sliceEnd = asalIdx ?? hdr.labelRow.length
    const lvlLine = hdr.valueBlock.find((l) => select(l, nivelIdx, sliceEnd).trim()) ?? ''
    nivelLabel = collapseSpaces(select(lvlLine, nivelIdx, sliceEnd)) || null
  }

  const prefix = codigo ? codigo[0] : codigoGrado.trim()[0] ?? null
  const derived: Level | null = prefix ? LEVEL_BY_PREFIX[prefix] ?? null : null
  let nivel: Level | null = null
  if (nivelLabel) {
    const match = (Object.keys(LEVEL_BY_PREFIX) as (keyof typeof LEVEL_BY_PREFIX)[]).map(
      (k) => LEVEL_BY_PREFIX[k],
    )
    const norm = (s: string) => s.toLowerCase().replace(/[.,;:\s]+$/, '')
    const hit = match.find((l) => norm(l) === norm(nivelLabel!))
    nivel = hit ?? null
  }
  if (!nivel && (nivelLabel ?? '').trim() === '') nivel = derived
  if (nivelLabel && !nivel) {
    notas.push(`nivelJerarquico label "${nivelLabel}" no se normalizó`)
    nivel = derived
  }

  const asignacionBasica = parseAsal(block, hdr)

  return {
    denominacion: denominacion || codigoGrado.split(/\s+/, 1)[0] || '',
    codigoGrado,
    codigo,
    grado,
    nivelJerarquico: nivel,
    asignacionBasica,
  }
}

function parseAsal(block: FormBlock, hdr: RawHeader): AsignacionBasica | null {
  const s1Start = block.lines.findIndex(
    (l) => l.includes('IDENTIFICACIÓN') || l.includes('Denominación del empleo'),
  )
  const s1End =
    block.lines.findIndex((l) => l.includes('REQUISITOS MÍNIMOS')) >= 0
      ? block.lines.findIndex((l) => l.includes('REQUISITOS MÍNIMOS'))
      : block.lines.length
  const section1 = block.lines.slice(s1Start, s1End)
  const cleanSection1 = cleanLines(section1)

  const meta = firstMeta(block, /Fecha de fijaci[oó]n:\s*([^\n]+)/)
  void meta

  let amount: number | null = null
  let raw: string | null = null
  let vigencia: number | null = null

  if (hdr.asalLabelCol !== null) {
    const asalRows = hdr.valueBlock
      .filter((l) => select(l, hdr.asalLabelCol!).trim())
      .map((l) => select(l, hdr.asalLabelCol!))
    const continuation = cleanSection1
      .filter((l) => l.trim().length > 0 && /^\s{60,}/.test(l))
      .map((l) => l.trim())
    const joined = collapseSpaces([...asalRows, ...continuation].join(' '))
    const m = SALARY_RE.exec(joined)
    if (m) {
      raw = `$${m[1]}`
      amount = parseCop(raw)
    }
    const v = VIGENCIA_RE.exec(joined)
    if (v) vigencia = Number(v[1])
  }

  if (amount === null) {
    for (const l of cleanSection1) {
      const m = SALARY_RE.exec(l)
      if (m) {
        raw = `$${m[1]}`
        amount = parseCop(raw)
        break
      }
    }
    if (vigencia === null) {
      for (const l of cleanSection1) {
        const v = VIGENCIA_RE.exec(l)
        if (v) {
          vigencia = Number(v[1])
          break
        }
      }
    }
  }

  if (amount === null && raw === null) {
    return null
  }
  return { amount, raw, vigencia }
}