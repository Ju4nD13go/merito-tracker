import { isArtifactLine } from './utils.ts'

export interface FormBlock {
  no: number
  lines: string[]
}

const TITLE_RE = /CONVOCATORIA No\.? ?(\d+)/

export function splitForms(fullText: string, totalExpected: number): FormBlock[] {
  const lines = fullText.split(/\r?\n/)
  const marks: { lineIndex: number; no: number }[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = TITLE_RE.exec(lines[i])
    if (m) {
      marks.push({ lineIndex: i, no: Number(m[1]) })
    }
  }
  const blocks: FormBlock[] = []
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].lineIndex
    const end = i + 1 < marks.length ? marks[i + 1].lineIndex : lines.length
    blocks.push({ no: marks[i].no, lines: lines.slice(start, end) })
  }
  void totalExpected
  return blocks
}

export function sectionIndex(block: FormBlock, re: RegExp): number | null {
  for (let i = 0; i < block.lines.length; i++) {
    if (re.test(block.lines[i])) return i
  }
  return null
}

export function cleanLines(lines: string[], { dropArtifacts = true } = {}): string[] {
  return lines.filter((l) => !dropArtifacts || !isArtifactLine(l))
}

export function firstMeta(block: FormBlock, re: RegExp, limit = 40): string | null {
  for (let i = 0; i < Math.min(block.lines.length, limit); i++) {
    const m = re.exec(block.lines[i])
    if (m) return m[1] ?? m[0]
  }
  return null
}