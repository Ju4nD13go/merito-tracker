import type { FormBlock } from './forms.ts'
import { sectionIndex } from './forms.ts'
import { isArtifactLine } from './utils.ts'
import { joinLines } from './utils.ts'

const FUNCIONES_LABEL_RE = /^Funciones\b/
const ITEM_RE = /^\s*(\d+)\.\s+(.+)$/

function isItemLine(line: string): boolean {
  const m = ITEM_RE.exec(line.trim())
  if (!m) return false
  return line.slice(0, 45).includes(m[1])
}

export function parseProposito(block: FormBlock): {
  proposito: string
  funciones: string[]
} {
  const s3 = sectionIndex(block, /PROP[ÓO]SITO/)
  const s4 = sectionIndex(block, /^\s*4\.\s*CONOCIMIENTOS/)
  if (s3 === null) return { proposito: '', funciones: [] }
  const end = s4 !== null && s4 > s3 ? s4 : block.lines.length

  const raw = block.lines.slice(s3 + 1, end)
  const funcsLabelIdx = raw.findIndex((l) => FUNCIONES_LABEL_RE.test(l.trim()) && !isArtifactLine(l))
  const firstItem = raw.findIndex((l) => isItemLine(l))

  const split =
    funcsLabelIdx >= 0 && (firstItem < 0 || funcsLabelIdx <= firstItem)
      ? funcsLabelIdx
      : firstItem
  const purposeEnd = split >= 0 ? split : raw.length
  const funcsBand =
    split >= 0 ? raw.slice(split + (split === funcsLabelIdx && funcsLabelIdx >= 0 ? 1 : 0)) : []
  const purposeBand = raw.slice(0, purposeEnd)

  const purposeLines: string[] = []
  for (const line of purposeBand) {
    if (isArtifactLine(line)) continue
    let t = line.trim()
    if (/^(Propósito|Funciones)\b/.test(t) && line.slice(0, 10).trim().length <= 10) {
      t = t.replace(/^(Propósito|Funciones)\b/, '').trim()
    }
    if (/^PROP[ÓO]SITO/.test(t) || /PROP[ÓO]SITO Y FUNCIONES DEL EMPLEO/.test(t.toUpperCase())) continue
    if (t) purposeLines.push(t)
  }
  const proposito = joinLines(purposeLines)

  const funciones: string[] = []
  let currentIdx = -1

  for (const line of funcsBand) {
    if (isArtifactLine(line)) continue
    const t = line.trim()
    if (FUNCIONES_LABEL_RE.test(t) && line.slice(0, 12).trim().length <= 3) continue
    const item = ITEM_RE.exec(t)
    if (item && isItemLine(line)) {
      currentIdx++
      funciones.push(item[2].trim())
      continue
    }
    if (currentIdx >= 0 && !/^Propósito\b/.test(t)) {
      funciones[currentIdx] = `${funciones[currentIdx]} ${t}`.trim()
    }
  }

  return { proposito, funciones: funciones.map((f) => f.replace(/\s+/g, ' ').trim()) }
}