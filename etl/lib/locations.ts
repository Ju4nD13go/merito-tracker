import type { Site, Ubicaciones } from '../types.ts'
import { cleanLines, sectionIndex } from './forms.ts'
import type { FormBlock } from './forms.ts'
import { collapseSpaces, isArtifactLine } from './utils.ts'

const CITY_RE = /^(.{1,60}?)\s*\((\d{1,3})\)\s*$/
const PLAN_RE = /^(PLANTA\b.*)$/i
const WHEREVER_RE = /(?:O|Donde)\s+donde se ubique el cargo/i
const PROCESO_RE = /Proces[oa]s?\s*:?\s*(.*)/i
const CARGOS_LABEL_RE = /cargos\s*:/i

export function findCargosCount(lines: string[]): number | null {
  const start = lines.findIndex((l) => CARGOS_LABEL_RE.test(l))
  if (start < 0) return null
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]
    const stripped = line.replace(/\([^)]*\)/g, ' ')
    if (isArtifactLine(line)) continue
    if (/P[aá]gina/.test(line)) continue
    const re = /\b(\d{1,4})\b/g
    let m: RegExpExecArray | null
    while ((m = re.exec(stripped)) !== null) {
      const n = Number(m[1])
      if (n === 0) continue
      const pos = m.index + stripped.slice(m.index).search(/\S/)
      if (pos < 4) continue
      const beforeSlice = stripped.slice(0, m.index)
      const gap = beforeSlice.length - beforeSlice.trimEnd().length
      if (beforeSlice.length > 0 && gap < 2) continue
      const after = stripped.slice(m.index + m[1].length)
      const afterNonSpace = after.replace(/^\s+/, '')
      if (afterNonSpace && !/[A-Za-zÁÉÍÓÚÑáéíóúñ"']/.test(afterNonSpace[0] ?? '')) continue
      return n
    }
  }
  return null
}

interface Segment {
  plan: string | null
  planRaw: string | null
  dependencyParts: string[]
  procesoParts: string[]
  wherever: boolean
  groups: { label: string; sites: Site[] }[]
  groupLabel: string
  groupSites: Site[]
  sites: Site[]
  localityCount: number | null
}

function planNorm(left: string): { plan: string; raw: string; count: number | null } {
  const m = /^(.+?)\s*\((\d{1,3})\)\s*$/.exec(left)
  if (m) return { plan: m[1], raw: left, count: Number(m[2]) }
  return { plan: left, raw: left, count: null }
}

const NON_CITY_HEADING_RE =
  /^(nota|parágrafo|cargo|número|proces[oa]s?|total|subtotal|donde|o |y |de |en |el |la |las |los |del |con |por |se |su |vc|aa|aa[a-z])\b/i

const DEPENDENCY_NAME_RE =
  /procuradu|delegad|juzgam|distrital|provincial|regional|preventiv|gesti[oó]n|vigilancia|asuntos|gobernanza|func|oficina|divisi[oó]n|direcci[oó]n|unidad|sala|despacho|control|centro|conciliaci|secretar|general|comercial|registradur|notar[aí]|magistr|tribunal|asistencia|asesor|instrucci|jurídic|disciplinar/i

const hasLower = (s: string): boolean => /[a-záéíóúñ]/.test(s)

function parseSite(line: string): { name: string; count: number; rest: string; bare: boolean } | null {
  const band = line.slice(0, 62).trimEnd()
  const parenM = /^([^\s(][^()0-9]{0,50}?)\s*\((\d{1,3})\)/.exec(band)
  if (parenM) {
    const count = Number(parenM[2])
    const name = parenM[1].trim().replace(/[-–—]\s*$/, '').trim()
    if (count === 0) return null
    if (DEPENDENCY_NAME_RE.test(name)) return null
    return {
      name,
      count,
      rest: band.slice(parenM[0].length).trim(),
      bare: false,
    }
  }
  const bareM = /^([^\s(][^0-9]{1,40}?)\s{2,}(\d{1,4})(?!\d)/.exec(band)
  if (bareM) {
    const n = Number(bareM[2])
    const name = bareM[1].trim().replace(/[-–—]\s*$/, '').trim()
    if (n === 0) return null
    if (bareM[2].length >= 4 && n >= 1900) return null
    if (/versión|fecha|página|vigenci|convocatoria/i.test(name)) return null
    if (DEPENDENCY_NAME_RE.test(name)) return null
    return {
      name,
      count: n,
      rest: band.slice(bareM[0].length).trim(),
      bare: true,
    }
  }
  const cityM = /^([^\s(][^0-9]{2,40})$/.exec(band.trim())
  if (
    cityM &&
    hasLower(cityM[1]) &&
    !NON_CITY_HEADING_RE.test(cityM[1]) &&
    !DEPENDENCY_NAME_RE.test(cityM[1])
  ) {
    return { name: cityM[1].trim(), count: 0, rest: '', bare: false }
  }
  return null
}

export function parseLocations(block: FormBlock, notas: string[]): Ubicaciones {
  const s1Start = block.lines.findIndex(
    (l) => l.includes('IDENTIFICACIÓN') || l.includes('Denominación del empleo'),
  )
  const s2Idx = sectionIndex(block, /REQUISITOS MÍNIMOS/)
  const s1End = s2Idx !== null && s2Idx > s1Start ? s2Idx : block.lines.length
  const sourceLines = cleanLines(block.lines.slice(s1Start, s1End))

  const numeroCargos = findCargosCount(sourceLines)

  const segments: Segment[] = []
  let current: Segment | null = null

  const newSegment = (plan: string | null, planRaw: string | null, locality: number | null): Segment => {
    const seg: Segment = {
      plan,
      planRaw,
      dependencyParts: [],
      procesoParts: [],
      wherever: false,
      groups: [],
      groupLabel: '',
      groupSites: [],
      sites: [],
      localityCount: locality,
    }
    segments.push(seg)
    return seg
  }

  const ubIdx = sourceLines.findIndex((l) => /Ubicación/.test(l))
  const body = ubIdx >= 0 ? sourceLines.slice(ubIdx + 1) : sourceLines

  let pendingLabel = ''
  let pendingWherever = false

  const skipHeaderRemnant = (s: string): boolean => {
    const t = s.trim().replace(/[.:]/g, '').trim()
    return (
      /^(c|ca|car|carg|cargo|cargos|d|de|n[úu]mero|n[úu]meros|total|subtotal|\d{1,4})$/i.test(t) ||
      /^Dependencia/i.test(s)
    )
  }

  for (const line of body) {
    const leftRaw = line.slice(0, 45)
    const leftT = leftRaw.trim()
    const rightT = line.slice(45).trim()

    if (!leftT) {
      consolidateRight(current, rightT)
      continue
    }

    if (skipHeaderRemnant(leftRaw)) {
      consolidateRight(current, rightT)
      continue
    }

    const planLabel = leftT.split(/\s{2,}/)[0].trim()
    const planM = planLabel ? PLAN_RE.exec(planLabel) : null
    if (planM) {
      const norm = planNorm(planLabel)
      current = newSegment(norm.plan, norm.raw, norm.count)
      pendingLabel = ''
      pendingWherever = false
      consolidateRight(current, rightT)
      continue
    }

    const isWhere = WHEREVER_RE.test(leftT)
    const siteM = isWhere ? null : parseSite(line)
    if (siteM) {
      if (!current) {
        current = newSegment(null, null, null)
        current.groupLabel = pendingLabel
        current.wherever = pendingWherever
      }
      const site = { city: siteM.name, count: siteM.count }
      current.sites.push(site)
      current.groupSites.push(site)
      if (siteM.rest) {
        const dep = siteM.rest.replace(/^\s*\d{1,4}\s+/, '').replace(CARGOS_LABEL_RE, ' ').trim()
        if (dep && !/^(O|Donde)\s+donde se ubique el cargo/i.test(dep)) {
          current.dependencyParts.push(dep)
        }
      }
      consolidateRight(current, rightT)
      continue
    }

    if (current) {
      if (isWhere) {
        current.wherever = true
      } else if (current.groupSites.length > 0) {
        current.groups.push({
          label: collapseSpaces(current.groupLabel),
          sites: current.groupSites,
        })
        current.groupLabel = leftT
        current.groupSites = []
      } else {
        current.groupLabel = current.groupLabel ? `${current.groupLabel} ${leftT}` : leftT
      }
    } else if (isWhere) {
      pendingWherever = true
    } else {
      pendingLabel = pendingLabel ? `${pendingLabel} ${leftT}` : leftT
    }

    if (rightT) consolidateRight(current, rightT)
  }

  for (const seg of segments) {
    if (seg.groupSites.length > 0) {
      seg.groups.push({ label: collapseSpaces(seg.groupLabel), sites: seg.groupSites })
      seg.groupSites = []
    }
  }

  const multiPlan = segments.length > 1
  const first = segments[0] ?? null

  if (segments.length > 1 && segments.some((s) => s.plan !== first?.plan)) {
    notas.push(
      `múltiples planes distintos: ${segments.map((s) => s.plan ?? '(s/n)').join(', ')}`,
    )
  }

  for (const seg of segments) {
    const sum = seg.sites.reduce((a, s) => a + s.count, 0)
    if (seg.localityCount !== null && seg.localityCount !== sum) {
      notas.push(
        `plan ${seg.planRaw}: indica ${seg.localityCount} ubicaciones pero la suma es ${sum}`,
      )
    }
  }

  const groups = segments.flatMap((s) =>
    s.groups.map((g) => ({
      label: multiPlan ? `${s.plan ?? 's/n'}: ${g.label}` : g.label,
      sites: g.sites,
    })),
  )
  const sites = segments.flatMap((s) => s.sites)

  return {
    plan: first?.plan ?? null,
    dependency: first ? collapseSpaces(first.dependencyParts.join(' ')) || null : null,
    proceso: first ? collapseSpaces(first.procesoParts.join(' ')) || null : null,
    whereverAssigned: segments.some((s) => s.wherever),
    numeroCargos,
    groups,
    sites,
  }
}

function consolidateRight(current: Segment | null, right: string): void {
  if (!current || !right) return
  if (/^\d{1,4}$/.test(right)) return
  const proc = PROCESO_RE.exec(right)
  if (proc) {
    current.procesoParts.push(proc[1])
    return
  }
  let text = right
    .replace(CARGOS_LABEL_RE, (_m) => ' ')
    .replace(/^\s*\d{1,4}\s+/, '')
    .trim()
  if (!text) return
  if (/^(O|Donde)\s+donde se ubique el cargo/i.test(text)) return
  current.dependencyParts.push(text)
}