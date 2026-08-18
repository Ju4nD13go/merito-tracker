const FOOTER_OR_HEADER = [
  /^\s*www\.[\w.]+\.(co|com).*$/i,
  /^\s*carrera 5 # 15-80.*$/i,
  /^\s*\(601\) 5878750.*$/i,
  /^\s*p[aá]gina\s+\d{1,3}\s+de\s+\d{1,3}\s*$/i,
  /^\s*\d{1,2}\s+de\s+(5|6|7|8|9|11|12|13)\s*$/,
  /^\s*versi[oó]n\s+3\s*$/i,
  /^\s*versi[oó]n\s*$/i,
  /^\s*formato:\s*convocatoria\s*$/i,
  /^\s*proceso:\s*talento humano\s*$/i,
  /^\s*c[oó]digo\s+th-f-211\s*$/i,
  /^\s*fecha\s+\d{2}\/\d{2}\/\d{4}\s*$/i,
]

export function isArtifactLine(line: string): boolean {
  const t = line.trim()
  if (!t) return true
  return FOOTER_OR_HEADER.some((re) => re.test(line))
}

export function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

export function joinLines(parts: string[]): string {
  const joined = parts
    .filter((p) => p.trim().length > 0)
    .map((p) => collapseSpaces(p))
    .join(' ')
  return collapseSpaces(joined)
}

export function parseCop(raw: string | null): number | null {
  if (!raw) return null
  const m = /\$\s*([\d.]+)/.exec(raw)
  if (!m) return null
  return Number(m[1].replace(/\./g, ''))
}

export interface PlanInfo {
  plan: string | null
  dependency: string | null
  proceso: string | null
  whereverAssigned: boolean
  groups: { label: string; sites: { city: string; count: number }[] }[]
  sites: { city: string; count: number }[]
}

export function findLabelCol(line: string, labelRe: RegExp): number | null {
  const m = labelRe.exec(line)
  return m ? m.index : null
}