/**
 * User profile — the input of the match engine.
 * Designed to map 1:1 onto the Requisitos fields of a Vacancy so the
 * eliminatorio pass can compare apples to apples.
 */

import type { EducationLevel } from './contracts.ts'

export interface UserProfile {
  /** Highest education level attained by the user. */
  educationLevel: EducationLevel | null
  /** Free-text degrees/careers, matched against discipline mentions. */
  degrees: string[]
  /** Total professional experience in years. */
  experienceYears: number
  /** Cities the user prefers or can work in. */
  preferredCities: string[]
  /** Whether the user holds the required professional license (tarjeta profesional). */
  hasProfessionalLicense: boolean
  /** Interest areas, matched against funciones/conocimientos keywords. */
  interests: string[]
}

export const emptyProfile = (): UserProfile => ({
  educationLevel: null,
  degrees: [],
  experienceYears: 0,
  preferredCities: [],
  hasProfessionalLicense: false,
  interests: [],
})