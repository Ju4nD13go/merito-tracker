import type { TestWeight } from '../types.ts'
import type { FormBlock } from './forms.ts'
import { sectionIndex } from './forms.ts'
import { isArtifactLine, joinLines } from './utils.ts'

const S4_RE = /^\s*4\.\s*CONOCIMIENTO(?:S)?\b/i
const S5_RE = /^\s*5\.\s*(?:CONOCIMIENTOS\b.*)?CO\s*MU(?:N|NUN)ES/i
const S6_RE = /^\s*6\.\s*COMPETENCIAS/i
const S8_RE = /^\s*8\.\s*PRUEBAS/i
const S9_NOTAS_RE = /^\s*9\s*[.:]\s*NOTAS/i
const S9_RE = /^\s*9\.\s*/

export function parseSection4(block: FormBlock): string[] {
  const s4 = sectionIndex(block, S4_RE)
  const s5 = sectionIndex(block, S5_RE)
  if (s4 === null || s5 === null || s5 <= s4) return []
  const out: string[] = []
  for (const line of block.lines.slice(s4 + 1, s5)) {
    if (isArtifactLine(line)) continue
    const t = line.trim()
    if (!t) continue
    out.push(t.replace(/^[•·\-]\s*/, '').replace(/\s+/g, ' ').trim())
  }
  return out
}

export function parseSection5(block: FormBlock): string[] {
  const s5 = sectionIndex(block, S5_RE)
  const s6 = sectionIndex(block, S6_RE)
  if (s5 === null || s6 === null || s6 <= s5) return []
  const out: string[] = []
  for (const line of block.lines.slice(s5 + 1, s6)) {
    if (isArtifactLine(line)) continue
    const t = line.trim()
    if (!t) continue
    out.push(t.replace(/^[•·\-]\s*/, '').replace(/\s+/g, ' ').trim())
  }
  return out
}

export function parsePruebas(block: FormBlock): TestWeight[] {
  const s8 = sectionIndex(block, S8_RE)
  const s9 = sectionIndex(block, S9_NOTAS_RE)
  if (s8 === null) return []
  const end = s9 !== null && s9 > s8 ? s9 : block.lines.length
  const rows: { line: string; idx: number }[] = []
  for (let i = s8; i < end; i++) {
    if (isArtifactLine(block.lines[i])) continue
    if (/(Conocimientos|Competencias Comportamentales|An[áa]lisis de Antecedentes)/i.test(
      block.lines[i],
    )) {
      rows.push({ line: block.lines[i], idx: i })
    }
  }
  const out: TestWeight[] = []
  for (const row of rows) {
    if (/^\s*(Conocimientos|Competencias Comportamentales|An[áa]lisis de Antecedentes)\s*(?:Prueba|Escrita|Oral)?\.?\s*[•·\-]?\s*$/i.test(
      row.line.trim(),
    )) continue
    const nameRaw = /(Conocimientos|Competencias Comportamentales|An[áa]lisis de Antecedentes)/i.exec(
      row.line,
    )![1]
    const name = nameRaw.replace(/^./, (c) => c.toUpperCase()).replace(/An[áa]lisis/, 'Análisis')
    let pct: number | null = null
    const own = /(\d{1,3})\s*%/.exec(row.line)
    if (own) pct = Number(own[1])
    if (pct !== null) out.push({ name, pct })
  }
  return out
}

export function parseNotas(block: FormBlock): string | null {
  const s9 = sectionIndex(block, S9_NOTAS_RE)
  if (s9 === null) return null
  const parts: string[] = []
  for (const line of block.lines.slice(s9 + 1)) {
    if (isArtifactLine(line)) continue
    const t = line.trim()
    if (!t) continue
    if (/^\s*\d+\s*$/.test(t)) continue
    parts.push(t)
  }
  const joined = joinLines(parts)
  return joined || null
}