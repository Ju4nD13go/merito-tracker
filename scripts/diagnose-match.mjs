// Diagnostic: does the match engine actually use the user profile?
// Run: node scripts/diagnose-match.mjs  (Node 26 native type stripping)
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const data = JSON.parse(readFileSync(resolve(ROOT, 'data/vacancies.v1.json'), 'utf8'))

const { rankVacancies } = await import(resolve(ROOT, 'src/domain/match.ts'))
const { describeRequirements } = await import(resolve(ROOT, 'src/domain/requirements.ts'))

// A realistic profile: abogado, universitaria, 5 años, Bogotá, con tarjeta
const profile = {
  educationLevel: 'universitaria',
  degrees: ['Derecho'],
  experienceYears: 5,
  preferredCities: ['Bogotá D.C.'],
  hasProfessionalLicense: true,
  interests: [],
}

const result = rankVacancies(data.vacancies, profile)
console.log(`=== PERFIL ===\n${JSON.stringify(profile, null, 2)}\n`)
console.log(`total: ${result.total} | passed: ${result.passedCount}\n`)

console.log('--- TOP 10 (por score) ---')
for (const m of result.matches.slice(0, 10)) {
  const v = data.vacancies.find((x) => x.id === m.vacancyId)
  const req = describeRequirements(v)
  console.log(
    `${m.vacancyId} ${m.passed ? 'PASS' : 'FAIL'} score=${m.score ? m.score.total : '-'} | ${v.empleo.denominacion} (${v.empleo.codigoGrado})`
  )
  console.log(`   estudio: ${v.requisitos.estudio.slice(0, 120)}`)
  console.log(`   nivelRequerido: ${req.requiredLevel} | años: ${req.requiredYears} | disciplinas: [${req.disciplines.join(', ')}]`)
  if (m.score) {
    console.log(`   parts: ${m.score.parts.map((p) => `${p.label}=${p.points.toFixed(1)}`).join(' | ')}`)
  }
}

console.log('\n--- Distribución de scores (passed) ---')
const passed = result.matches.filter((m) => m.passed)
const hist = {}
for (const m of passed) {
  const bucket = Math.floor((m.score?.total ?? 0) / 10) * 10
  hist[bucket] = (hist[bucket] || 0) + 1
}
console.log(hist)
console.log('total passed con score:', passed.length)

console.log('\n--- ¿vacantes de Derecho aparecen primero? ---')
const derechoFirst = data.vacancies
  .map((v, i) => ({ v, i }))
  .filter(({ v }) => /derecho/i.test(v.requisitos.estudio))
  .slice(0, 3)
  .map(({ v, i }) => `${v.id} (dataset idx ${i})`)
console.log('primeras en dataset:', derechoFirst.join(', '))