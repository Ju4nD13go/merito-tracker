import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractExperienceText, parseExperienceYears, detectEducationLevel, detectDisciplines, evaluateRequirements, describeRequirements } from './requirements.ts'
import { scoreVacancy } from './score.ts'
import { matchVacancy, rankVacancies } from './match.ts'
import type { Vacancy } from './contracts.ts'
import type { UserProfile } from './user-profile.ts'

function baseVacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: 'cov-000',
    convocatoriaNo: 0,
    convocatoriaLabel: '',
    resolucion: 76,
    versionNo: 3,
    fechaFijacion: null,
    terminoInscripciones: null,
    empleo: {
      denominacion: 'Asesor',
      codigoGrado: '1AS-19',
      codigo: '1AS',
      grado: 19,
      nivelJerarquico: 'Asesor',
      asignacionBasica: { amount: 10000000, raw: '$10.000.000', vigencia: 2025 },
    },
    ubicaciones: {
      plan: 'PLANTA GLOBAL',
      dependency: null,
      proceso: null,
      whereverAssigned: false,
      numeroCargos: 1,
      groups: [{ label: 'g', sites: [{ city: 'Bogotá', count: 1 }] }],
      sites: [{ city: 'Bogotá', count: 1 }],
    },
    requisitos: {
      estudio: 'Título de formación universitaria en derecho. Experiencia: Un (1) año de experiencia profesional.',
      experiencia: null,
      tarjetaProfesional: false,
      equivalencias: null,
      documentsNote: null,
    },
    proposito: 'Asesorar en asuntos de su competencia.',
    funciones: ['Asesorar en formulación de políticas.'],
    conocimientosEspecificos: ['derecho disciplinario'],
    conocimientosComunes: [],
    pruebas: [],
    notasGenerales: null,
    rawNotes: [],
    ...overrides,
  }
}

const fullProfile: UserProfile = {
  educationLevel: 'universitaria',
  degrees: ['derecho'],
  experienceYears: 3,
  preferredCities: ['Bogotá'],
  hasProfessionalLicense: true,
  interests: ['derecho'],
}

// --- requirements.ts ---

test('extractExperienceText pulls the fragment after "Experiencia:"', () => {
  assert.equal(extractExperienceText('Título universitario. Experiencia: Tres (3) años.'), 'Tres (3) años.')
  assert.equal(extractExperienceText('Sin experiencia.'), null)
})

test('parseExperienceYears handles dataset forms', () => {
  assert.equal(parseExperienceYears('Un (1) año de experiencia'), 1)
  assert.equal(parseExperienceYears('Tres (3) años de experiencia'), 3)
  assert.equal(parseExperienceYears('Dos años y medio (2.5) años de experiencia'), 2.5)
  assert.equal(parseExperienceYears('Un año y medio (1.5) de experiencia'), 1.5)
  assert.equal(parseExperienceYears('experiencia profesional por lapso no inferior a diez (10) años'), 10)
  assert.equal(parseExperienceYears('No requiere'), 0)
  assert.equal(parseExperienceYears(null), null)
})

test('detectEducationLevel ranks texts', () => {
  assert.equal(detectEducationLevel('Título de formación universitaria en derecho'), 'universitaria')
  assert.equal(detectEducationLevel('Diploma de bachillerato técnico comercial'), 'bachillerato')
  assert.equal(detectEducationLevel('Aprobación de dos (2) años de educación básica secundaria'), 'bachillerato')
  assert.equal(detectEducationLevel('Título de posgrado en áreas relacionadas'), 'posgrado')
  assert.equal(detectEducationLevel(null), null)
})

test('detectDisciplines finds keywords in estudio text', () => {
  const d = detectDisciplines('Título de formación universitaria en derecho e ingeniería.')
  assert.ok(d.includes('derecho'))
  assert.ok(d.includes('ingenier'))
})

test('evaluateRequirements passes a properly matched profile', () => {
  const v = baseVacancy({ requisitos: {
    estudio: 'Título de formación universitaria en derecho. Experiencia: Un (1) año de experiencia profesional.',
    experiencia: null,
    tarjetaProfesional: true,
    equivalencias: null,
    documentsNote: null,
  } })
  const check = evaluateRequirements(v, fullProfile)
  assert.equal(check.passed, true)
  assert.ok(check.reasons.every((r) => r.ok))
})

test('evaluateRequirements fails on missing license', () => {
  const v = baseVacancy({ requisitos: {
    estudio: 'Título de formación universitaria en derecho. Experiencia: Un (1) año.',
    experiencia: null,
    tarjetaProfesional: true,
    equivalencias: null,
    documentsNote: null,
  } })
  const check = evaluateRequirements(v, { ...fullProfile, hasProfessionalLicense: false })
  assert.equal(check.passed, false)
})

test('evaluateRequirements fails on insufficient experience', () => {
  const v = baseVacancy({ requisitos: {
    estudio: 'Título de formación universitaria. Experiencia: Tres (3) años de experiencia.',
    experiencia: null,
    tarjetaProfesional: false,
    equivalencias: null,
    documentsNote: null,
  } })
  const check = evaluateRequirements(v, { ...fullProfile, experienceYears: 1 })
  assert.equal(check.passed, false)
})

test('evaluateRequirements fails on wrong education level', () => {
  const v = baseVacancy({ requisitos: {
    estudio: 'Título de posgrado en derecho. Experiencia: Un (1) año.',
    experiencia: null,
    tarjetaProfesional: false,
    equivalencias: null,
    documentsNote: null,
  } })
  const check = evaluateRequirements(v, { ...fullProfile, educationLevel: 'técnica' })
  assert.equal(check.passed, false)
})

test('no experience requirement does not block', () => {
  const v = baseVacancy({ requisitos: {
    estudio: 'Aprobación de dos (2) años de educación básica secundaria. Experiencia: No requiere.',
    experiencia: null,
    tarjetaProfesional: false,
    equivalencias: null,
    documentsNote: null,
  } })
  const check = evaluateRequirements(v, { ...fullProfile, educationLevel: null })
  // education level required (bachillerato) but unknown → fail-closed on level; experiencia ok alone is covered below
  assert.equal(check.passed, false) // level unknown blocks
  const expCheck = evaluateRequirements(v, { ...fullProfile, educationLevel: 'bachillerato' })
  assert.equal(expCheck.passed, true)
})

// --- score.ts ---

test('scoreVacancy rewards preferred city + good level + extra experience', () => {
  const v = baseVacancy()
  const s = scoreVacancy(v, fullProfile)
  assert.equal(s.total, 100)
  assert.ok(s.parts.length >= 5)
  const cityPart = s.parts.find((p) => p.label === 'ciudad')
  assert.equal(cityPart?.points, 30)
})

test('scoreVacancy is deterministic', () => {
  const v = baseVacancy()
  assert.equal(scoreVacancy(v, fullProfile).total, scoreVacancy(v, fullProfile).total)
})

test('scoreVacancy lower when city does not match', () => {
  const v = baseVacancy({ ubicaciones: {
    ...baseVacancy().ubicaciones,
    whereverAssigned: false,
    sites: [{ city: 'Medellín', count: 1 }],
    groups: [{ label: 'g', sites: [{ city: 'Medellín', count: 1 }] }],
  } })
  const s = scoreVacancy(v, fullProfile)
  const cityPart = s.parts.find((p) => p.label === 'ciudad')
  assert.equal(cityPart?.points, 0)
  assert.ok(s.total < 100)
})

test('scoreVacancy treats whereverAssigned as city neutral (full city points)', () => {
  const v = baseVacancy({ ubicaciones: { ...baseVacancy().ubicaciones, whereverAssigned: true, sites: [] } })
  const s = scoreVacancy(v, fullProfile)
  const cityPart = s.parts.find((p) => p.label === 'ciudad')
  assert.equal(cityPart?.points, 30)
})

// --- match.ts ---

test('matchVacancy returns score only when passed', () => {
  const passed = matchVacancy(baseVacancy(), fullProfile)
  assert.equal(passed.passed, true)
  assert.ok(passed.score !== null)

  const blocked = matchVacancy(baseVacancy({ requisitos: {
    estudio: 'Título de formación universitaria. Experiencia: Un (1) año. Posgrado requerido.',
    experiencia: null,
    tarjetaProfesional: false,
    equivalencias: null,
    documentsNote: null,
  } }), { ...fullProfile, educationLevel: 'técnica' })
  assert.equal(blocked.passed, false)
  assert.equal(blocked.score, null)
})

test('rankVacancies puts tailored vacancy above unrelated one', () => {
  const tailored = baseVacancy({ id: 'cov-001' })
  const unrelated = baseVacancy({
    id: 'cov-002',
    requisitos: {
      estudio: 'Título de posgrado en astronomía. Experiencia: Diez (10) años.',
      experiencia: null,
      tarjetaProfesional: true,
      equivalencias: null,
      documentsNote: null,
    },
    ubicaciones: { ...baseVacancy().ubicaciones, sites: [{ city: 'Leticia', count: 1 }], groups: [] },
  })
  const result = rankVacancies([unrelated, tailored], fullProfile)
  assert.equal(result.passedCount, 1)
  assert.equal(result.matches[0].vacancyId, 'cov-001')
})