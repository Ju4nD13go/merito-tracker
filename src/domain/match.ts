/**
 * Orchestrator — two-pass match: eliminatorio then clasificatorio.
 */

import type { Vacancy, VacancyDataset } from './contracts.ts'
import type { UserProfile } from './user-profile.ts'
import { evaluateRequirements, type RequirementCheck } from './requirements.ts'
import { scoreVacancy, type ScoreBreakdown } from './score.ts'

export interface VacancyMatch {
  vacancyId: string
  passed: boolean
  requirements: RequirementCheck
  score: ScoreBreakdown | null
}

export interface RankedResult {
  matches: VacancyMatch[]
  total: number
  passedCount: number
}

/** Extract vacancies from a full dataset (flexible about dataset shape). */
export function datasetVacancies(dataset: VacancyDataset): Vacancy[] {
  return dataset.vacancies ?? []
}

export function matchVacancy(v: Vacancy, p: UserProfile): VacancyMatch {
  const requirements = evaluateRequirements(v, p)
  if (!requirements.passed) {
    return { vacancyId: v.id, passed: false, requirements, score: null }
  }
  return {
    vacancyId: v.id,
    passed: true,
    requirements,
    score: scoreVacancy(v, p),
  }
}

export function rankVacancies(vacancies: Vacancy[], p: UserProfile): RankedResult {
  const matches = vacancies.map((v) => matchVacancy(v, p))
  matches.sort((a, b) => {
    // passed first, then higher score
    if (a.passed !== b.passed) return a.passed ? -1 : 1
    return (b.score?.total ?? 0) - (a.score?.total ?? 0)
  })
  return {
    matches,
    total: matches.length,
    passedCount: matches.filter((m) => m.passed).length,
  }
}