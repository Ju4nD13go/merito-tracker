/**
 * Eliminatorio pass — replicates the official "Verificación de Requisitos
 * Mínimos". Deterministic, keyword/pattern-based, documented heuristics.
 *
 * Data reality (observed in vacancies.v1.json):
 * - `requisitos.estudio` is free text mixing education AND experience
 *   ("Título de formación universitaria en derecho. Experiencia: Un (1)
 *   año de experiencia..."), sometimes with alternatives A/B.
 * - `requisitos.experiencia` is null in the parsed dataset (experience
 *   lives inside `estudio`).
 * - `requisitos.tarjetaProfesional` is a boolean.
 */

import type { Vacancy } from './contracts.ts'
import type { UserProfile } from './user-profile.ts'

export interface Explanation {
  field: string
  ok: boolean
  detail: string
}

export interface RequirementCheck {
  passed: boolean
  reasons: Explanation[]
}

// ---------------------------------------------------------------------------
// Text extraction heuristics (documented, conservative)
// ---------------------------------------------------------------------------

/** Extract the experience text fragment after "Experiencia:" (or A/B items). */
export function extractExperienceText(text: string | null): string | null {
  if (!text) return null
  const m = text.match(/Experiencia:\s*([^.]+(?:\.|$))/i)
  return m ? m[1].trim() : null
}

/**
 * Parse Spanish experience mentions into years. Handles the forms seen in the
 * dataset: "Un (1) año", "Dos (2) años", "Dos años y medio (2.5) años",
 * "Un año y medio (1.5)", "no inferior a diez (10) años", "Tres (3) años",
 * "No requiere".
 */
export function parseExperienceYears(text: string | null): number | null {
  if (!text) return null
  const normalized = text.toLowerCase()
  const words: Record<string, number> = {
    un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
    seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  }
  if (/no requiere/.test(normalized)) return 0
  if (/no inferior a/.test(normalized)) {
    const m = normalized.match(/no inferior a\s+(?:d|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|[0-9]+)\s*\(?(\d+(?:\.\d+)?)\)?/)
    if (m) return Number(m[1])
    // fallback: "no inferior a cinco (5) Tarjeta..." → the parenthesized
    // number may be followed by "Tarjeta" instead of "años" (PDF truncation)
    const paren = normalized.match(/no inferior a\s+\d*\s*\((\d+(?:\.\d+)?)\)/)
    if (paren) return Number(paren[1])
    // fallback: bare number before "años"
    const n = normalized.match(/no inferior a\s+(\d+(?:\.\d+)?)\s*(?:a[ñn]o)/)
    if (n) return Number(n[1])
    // fallback: word-only form "no inferior a cinco Tarjeta..." (PDF split
    // the token; the Spanish numeral is the requirement)
    const w = normalized.match(/no inferior a\s+(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/)
    if (w && words[w[1]] !== undefined) return words[w[1]]
    return null
  }
  // Decimal explicit "(1.5)" wins (covers "Un año y medio (1.5) de...")
  const decimal = normalized.match(/\((\d+\.\d+)\)/)
  if (decimal) return Number(decimal[1])
  // Integer explicit "Un (1) año", "Tres (3) años", "diez (10) años" → 1/3/10
  const explicit = normalized.match(/\((\d+)\)\s*años?/)
  if (explicit) return Number(explicit[1])
  const wordMatch = normalized.match(/(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:a[ñn]o)/)
  if (wordMatch && words[wordMatch[1]] !== undefined) return words[wordMatch[1]]
  const bare = normalized.match(/(\d+(?:\.\d+)?)\s*(?:a[ñn]o)/)
  if (bare) return Number(bare[1])
  return null
}

/** Highest education level mentioned in the study text. */
export function detectEducationLevel(text: string | null): string | null {
  if (!text) return null
  const t = text.toLowerCase()
  if (/posgrado|especializaci[óo]n|maestr[íi]a|doctorado/.test(t)) return 'posgrado'
  if (/universitaria|universitario|abogado|t[íi]tulo de formaci[óo]n universitaria/.test(t)) return 'universitaria'
  if (/tecnol[óo]gica|tecn[óo]logo/.test(t)) return 'tecnológica'
  // bachillerato BEFORE técnica: "bachillerato técnico comercial" is a
  // bachillerato, not a técnico level
  if (/bachillerato|bachiller|b[áa]sica secundaria|educaci[óo]n b[áa]sica/.test(t)) return 'bachillerato'
  if (/t[ée]cnica|t[ée]cnico/.test(t)) return 'técnica'
  return null
}

/** Discipline keywords mentioned in study text (e.g. "derecho", "ingeniería"). */
export function detectDisciplines(text: string): string[] {
  if (!text) return []
  const t = text.toLowerCase()
  const disciplines = [
    'derecho', 'ingenier', 'sistemas', 'ciencias políticas', 'administración',
    'contaduría', 'comunicación social', 'periodismo', 'mercadeo', 'economía',
    'educación', 'bibliotecología', 'archivística', 'criminalística',
    'medicina', 'salud', 'psicología', 'trabajo social', 'finanzas',
    'código', 'informática', 'tecnología', 'matemáticas', 'estadística',
  ]
  const found = disciplines.filter((d) => t.includes(d))
  // "Título de abogado" → derecho (the profile's degree is "derecho")
  if (/\babogad/.test(t) && !found.includes('derecho')) found.push('derecho')
  // "ingeniero de sistemas" already matches via "ingenier"; "tecnólogo en
  // sistemas" matches via "sistemas"
  if (/\bcontador/.test(t) && !found.includes('contaduría')) found.push('contaduría')
  return found
}

// ---------------------------------------------------------------------------
// Eliminatorio
// ---------------------------------------------------------------------------

const LEVEL_ORDER = [
  'bachillerato',
  'técnica',
  'tecnológica',
  'universitaria',
  'posgrado',
] as const

export type EducationLevelName = (typeof LEVEL_ORDER)[number]

/** Index of an education level in LEVEL_ORDER, or -1 when unknown. */
function levelIndex(level: string | null): number {
  if (!level) return -1
  return LEVEL_ORDER.indexOf(level as EducationLevelName)
}

/**
 * How many levels the user sits ABOVE the requirement (0 = exact fit).
 * Returns null when either side is unknown or the requirement is not
 * expressible. Negative values (user below requirement) are returned as-is;
 * the eliminatorio already blocks those, scoring treats them as 0.
 */
export function educationLevelGap(required: string | null, user: string | null): number | null {
  const reqIdx = levelIndex(required)
  const userIdx = levelIndex(user)
  if (reqIdx === -1 || userIdx === -1) return null
  return userIdx - reqIdx
}

function levelMet(required: string | null, user: string | null): boolean {
  if (!required) return true // requirement not expressible → non-blocking
  if (!user) return false // user level unknown → cannot prove → block (fail-closed)
  const reqIdx = LEVEL_ORDER.indexOf(required as (typeof LEVEL_ORDER)[number])
  const userIdx = LEVEL_ORDER.indexOf(user as (typeof LEVEL_ORDER)[number])
  if (reqIdx === -1 || userIdx === -1) return false
  return userIdx >= reqIdx
}

/**
 * Required experience in years, from BOTH sources, taking the most demanding
 * one (fail-closed). The parsed dataset carries the actual requirements inside
 * `estudio` ("Experiencia: no inferior a diez (10) años") while
 * `requisitos.experiencia` may hold legal prose with no figures — so we must
 * not prefer one field over the other.
 */
function requiredExperienceYears(estudio: string, experiencia: string | null): number | null {
  const fromEstudio = parseExperienceYears(extractExperienceText(estudio) ?? '')
  const fromCampo = parseExperienceYears(experiencia ?? '')
  const candidates = [fromEstudio, fromCampo].filter((x): x is number => x !== null)
  if (candidates.length === 0) return null
  return Math.max(...candidates)
}

function checkVacancyRequirements(v: Vacancy, p: UserProfile): RequirementCheck {
  const reasons: Explanation[] = []
  const estudio = v.requisitos.estudio ?? ''

  const requiredLevel = detectEducationLevel(estudio)
  reasons.push({
    field: 'educación',
    ok: levelMet(requiredLevel, p.educationLevel),
    detail: requiredLevel
      ? `Requiere: ${requiredLevel}. Tu nivel: ${p.educationLevel ?? 'sin declarar'}`
      : 'Requisito de educación no identificable en el texto.',
  })

  const requiredYears = requiredExperienceYears(estudio, v.requisitos.experiencia)
  if (requiredYears === null) {
    reasons.push({
      field: 'experiencia',
      ok: true,
      detail: 'Requisito de experiencia no identificable en el texto.',
    })
  } else if (requiredYears === 0) {
    reasons.push({
      field: 'experiencia',
      ok: true,
      detail: 'No requiere experiencia.',
    })
  } else {
    reasons.push({
      field: 'experiencia',
      ok: p.experienceYears >= requiredYears,
      detail: `Requiere ${requiredYears} año(s). Tienes ${p.experienceYears}.`,
    })
  }

  reasons.push({
    field: 'tarjetaProfesional',
    ok: !v.requisitos.tarjetaProfesional || p.hasProfessionalLicense,
    detail: v.requisitos.tarjetaProfesional
      ? 'Requiere tarjeta profesional.'
      : 'No requiere tarjeta profesional.',
  })

  const passed = reasons.every((r) => r.ok)
  return { passed, reasons }
}

/** Public API: run the eliminatorio pass on a single vacancy. */
export function evaluateRequirements(v: Vacancy, p: UserProfile): RequirementCheck {
  return checkVacancyRequirements(v, p)
}

/** The eliminatorio criteria for a vacancy — used by scoring to reward closeness. */
export type RequirementProfile = {
  requiredLevel: string | null
  requiredYears: number | null
  disciplines: string[]
}

export function describeRequirements(v: Vacancy): RequirementProfile {
  const estudio = v.requisitos.estudio ?? ''
  const requiredYears = requiredExperienceYears(estudio, v.requisitos.experiencia)
  return {
    requiredLevel: detectEducationLevel(estudio),
    requiredYears,
    disciplines: detectDisciplines(estudio),
  }
}