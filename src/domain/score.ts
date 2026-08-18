/**
 * Clasificatorio pass — transparent score for vacancies that passed the
 * eliminatorio. Every part carries a label, weight, points and a
 * human-readable detail. ZERO black boxes.
 *
 * Score is 0..100. Weights are documented constants so the product team
 * (and users) can understand and tune them.
 */

import type { Vacancy } from './contracts.ts'
import type { UserProfile } from './user-profile.ts'
import { normalizeCity } from './cities.ts'
import { describeRequirements } from './requirements.ts'

export interface ScorePart {
  label: string
  weight: number // relative weight of this part (sums to 1)
  points: number // weighted points contributed
  detail: string
}

export interface ScoreBreakdown {
  total: number // 0..100
  parts: ScorePart[]
}

export const SCORE_WEIGHTS = {
  /** Vacancy has a site in a user-preferred city. */
  city: 0.3,
  /** User's education level is at or above the required level. */
  educationLevel: 0.25,
  /** User's experience exceeds the required minimum. */
  additionalExperience: 0.2,
  /** User's degrees/interests overlap with the vacancy disciplines. */
  disciplineMatch: 0.15,
  /** License requirement satisfied (or not required). */
  license: 0.1,
} as const

export function scoreVacancy(v: Vacancy, p: UserProfile): ScoreBreakdown {
  const parts: ScorePart[] = []
  const req = describeRequirements(v)

  // --- city: full points if any site city matches a preferred city ---
  const siteCities = v.ubicaciones.sites.map((s) => normalizeCity(s.city))
  const preferred = new Set(p.preferredCities.map(normalizeCity))
  const cityHit = siteCities.some((c) => preferred.has(c)) || v.ubicaciones.whereverAssigned
  parts.push({
    label: 'ciudad',
    weight: SCORE_WEIGHTS.city,
    points: cityHit ? 100 * SCORE_WEIGHTS.city : 0,
    detail: cityHit
      ? v.ubicaciones.whereverAssigned
        ? 'Vacante con asignación flexible (donde se ubique el cargo).'
        : `Coincide con ciudades preferidas (${[...preferred].join(', ') || '—'}).`
      : 'No coincide con tus ciudades preferidas.',
  })

  // --- education level: full if met (higher never boosts — it's about fit) ---
  const levelOk = req.requiredLevel ? p.educationLevel !== null : true
  parts.push({
    label: 'nivel_educación',
    weight: SCORE_WEIGHTS.educationLevel,
    points: levelOk ? 100 * SCORE_WEIGHTS.educationLevel : 0,
    detail: req.requiredLevel
      ? `Requisito: ${req.requiredLevel}. Tu nivel: ${p.educationLevel ?? 'sin declarar'}.`
      : 'Sin requisito de nivel identificable.',
  })

  // --- additional experience: proportional up to 2x the requirement ---
  let expPoints = 0
  if (req.requiredYears !== null && req.requiredYears > 0 && p.experienceYears >= req.requiredYears) {
    const excess = p.experienceYears - req.requiredYears
    const ratio = Math.min(excess / req.requiredYears, 2) // cap at 2x
    expPoints = 50 * ratio + 50 // 50% base + up to 50% extra
  } else if (req.requiredYears === null || req.requiredYears === 0) {
    expPoints = 100 // no experience requirement → neutral full
  }
  expPoints = req.requiredYears !== null && p.experienceYears < req.requiredYears ? 0 : expPoints
  parts.push({
    label: 'experiencia_adicional',
    weight: SCORE_WEIGHTS.additionalExperience,
    points: expPoints * SCORE_WEIGHTS.additionalExperience,
    detail: req.requiredYears !== null
      ? `Requiere ${req.requiredYears} año(s); tienes ${p.experienceYears}.`
      : 'Sin requisito de experiencia explícito.',
  })

  // --- discipline match: any overlap between user inputs and vacancy ---
  const haystack = [v.requisitos.estudio ?? '', v.proposito, ...v.funciones, ...v.conocimientosEspecificos].join(' ').toLowerCase()
  const interests = p.degrees.concat(p.interests).filter(Boolean)
  const hits = interests.filter((i) => haystack.includes(i.toLowerCase()))
  parts.push({
    label: 'afinidad_disciplina',
    weight: SCORE_WEIGHTS.disciplineMatch,
    points: hits.length > 0
      ? 100 * SCORE_WEIGHTS.disciplineMatch
      : 50 * SCORE_WEIGHTS.disciplineMatch, // neutral 50% when unknown
    detail: hits.length > 0
      ? `Coincide: ${hits.slice(0, 5).join(', ')}.`
      : 'Sin coincidencias de disciplina detectadas.',
  })

  // --- license ---
  const licenseOk = !v.requisitos.tarjetaProfesional || p.hasProfessionalLicense
  parts.push({
    label: 'tarjeta_profesional',
    weight: SCORE_WEIGHTS.license,
    points: licenseOk ? 100 * SCORE_WEIGHTS.license : 0,
    detail: v.requisitos.tarjetaProfesional
      ? (p.hasProfessionalLicense ? 'Tarjeta profesional cumplida.' : 'Requiere tarjeta profesional.')
      : 'No requiere tarjeta profesional.',
  })

  // If the vacancy requires a license and the user lacks it, the eliminatorio
  // already blocks it — here it only affects the score.
  const total = Math.round(parts.reduce((a, part) => a + part.points, 0))
  return { total: Math.min(total, 100), parts }
}