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
import { describeRequirements, educationLevelGap } from './requirements.ts'

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
  /** Fit of user's education level to the required level (exact fit scores
   *  full; over-qualification scores less — a professional ranking high for
   *  driver/cleaner posts is noise, not a match). */
  educationLevel: 0.25,
  /** User's experience covers the required minimum (never a bonus for
   *  unrelated posts: experience only scores when the discipline fits). */
  additionalExperience: 0.2,
  /** User's degrees/interests overlap with the vacancy disciplines. This is
   *  THE relevance signal: it gates the experience bonus. */
  disciplineMatch: 0.15,
  /** License requirement satisfied (or not required). */
  license: 0.1,
} as const

/** Over-qualification penalty: fits scores full, each extra level above the
 *  requirement gets a lower multiplier. Unknown requirement → neutral full. */
const LEVEL_FIT = [1.0, 0.75, 0.5, 0.3, 0.2] as const

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

  // --- education level: FIT, not "at least". Over-qualification is a
  //     negative signal for relevance: a lawyer is not a good fit for a
  //     driver post even though legally admissible. ---
  const gap = educationLevelGap(req.requiredLevel, p.educationLevel)
  const levelFit = gap === null ? 1 : gap < 0 ? 0 : LEVEL_FIT[Math.min(gap, LEVEL_FIT.length - 1)] ?? 0.2
  parts.push({
    label: 'nivel_educación',
    weight: SCORE_WEIGHTS.educationLevel,
    points: levelFit * 100 * SCORE_WEIGHTS.educationLevel,
    detail: req.requiredLevel
      ? gap === null
        ? `Requisito: ${req.requiredLevel}. Tu nivel: ${p.educationLevel ?? 'sin declarar'}.`
        : gap === 0
          ? `Ajuste exacto: ${req.requiredLevel}.`
          : `Sobrecualificado: requisito ${req.requiredLevel}, tu nivel ${p.educationLevel} (${gap} nivel(es) arriba).`
      : 'Sin requisito de nivel identificable.',
  })

  // --- discipline match: how much this vacancy is ABOUT the user's profile ---
  // `describeRequirements` detects the disciplines the post REQUIRES (from its
  // estudio text). A broad-spectrum post ("administración, economía, derecho,
  // ingeniería…") mentions the user's degree but is not a legal post; a
  // narrow post ("Título de abogado") is exactly the user's target. Breadth
  // of required disciplines therefore discounts affinity — a lawyer should
  // not tie with a generic coordinator for a judge-adjacent role.
  const reqDisciplines = req.disciplines
  const interests = p.degrees.concat(p.interests).filter(Boolean)
  const overlap = reqDisciplines.filter((d) =>
    interests.some((i) => i.toLowerCase().includes(d) || d.includes(i.toLowerCase())),
  )
  const breadth = reqDisciplines.length
  const disciplineFraction = overlap.length === 0
    ? (interests.length === 0 ? 0.6 : 0.3)     // no profile → unknown (60%); profile w/o overlap → 30% (not your post)
    : breadth <= 2
      ? 1                                       // narrow post, your discipline is the target
      : breadth <= 4
        ? 0.75
        : 0.5                                   // broad spectrum → partial affinity
  const disciplineHit = overlap.length > 0
  parts.push({
    label: 'afinidad_disciplina',
    weight: SCORE_WEIGHTS.disciplineMatch,
    points: disciplineFraction * 100 * SCORE_WEIGHTS.disciplineMatch,
    detail: disciplineHit
      ? (breadth <= 2
        ? `El cargo exige ${breadth} disciplina(s): ${reqDisciplines.join(', ')}. Es tu perfil.`
        : `El cargo exige ${breadth} disciplinas (${reqDisciplines.slice(0, 6).join(', ')}…); la tuya es una más del espectro.`)
      : (interests.length === 0
        ? 'Sin perfil disciplinar declarado.'
        : 'El cargo no exige tus disciplinas. Post no afín a tu perfil.'),
  })

  // --- additional experience: ONLY pays when the discipline fits. A driver
  //     requiring 1 year should not beat a legal post requiring 5 just
  //     because the user has more years total. ---
  let expPoints = 0
  if (!disciplineHit) {
    expPoints = 0 // relevance gate: irrelevant post, experience earns nothing
  } else if (req.requiredYears !== null && req.requiredYears > 0 && p.experienceYears >= req.requiredYears) {
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
    detail: disciplineHit
      ? (req.requiredYears !== null
        ? `Requiere ${req.requiredYears} año(s); tienes ${p.experienceYears}.`
        : 'Sin requisito de experiencia explícito.')
      : 'Exigencia de experiencia no aplica: el cargo no es afín a tu perfil.',
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