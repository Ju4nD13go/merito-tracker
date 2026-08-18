/**
 * Validation script — normalize every site in the real dataset and report:
 * - distinct raw cities -> canonical mapping
 * - phantoms removed
 * - confirm the 6 known discrepant forms are unaffected
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { aggregateNormalizedCities, normalizeCity, isPhantom } from './cities.ts'

const REPO = resolve(import.meta.dirname, '..', '..')
const DATASET = resolve(REPO, 'data', 'vacancies.v1.json')

const dataset = JSON.parse(readFileSync(DATASET, 'utf8'))
const vacancies = dataset.vacancies

const result = aggregateNormalizedCities(vacancies)

console.log('=== Normalización de ciudades (dataset real) ===')
console.log(`Ciudades distintas ANTES (por raw): ${countRawDistinct(vacancies)}`)
console.log(`Ciudades canónicas DESPUÉS: ${result.distinctCount}`)
console.log(`Fantasmas eliminados: ${result.removedPhantoms.length}`)
if (result.removedPhantoms.length) console.log('  ->', result.removedPhantoms.join(', '))
console.log('\nTop 25 canónicas:')
for (const e of result.entries.slice(0, 25)) {
  console.log(`  ${String(e.count).padStart(6)}  ${e.canonical}`)
}

const rawSet = new Set<string>()
for (const v of vacancies) for (const s of v.ubicaciones.sites) rawSet.add(s.city)
const merged = [...rawSet].filter((r) => normalizeCity(r) !== r && !isPhantom(r))
console.log(`\nVariantes fusionadas (raw -> canónico):`)
for (const r of merged) console.log(`  "${r}" -> "${normalizeCity(r)}"`)

const DISCREPANT = ['cov-015', 'cov-066', 'cov-085', 'cov-147', 'cov-148', 'cov-234']
console.log('\nFormatos discrepantes conocidos (deben seguir existiendo):')
for (const id of DISCREPANT) {
  const found = vacancies.some((v: { id: string }) => v.id === id)
  console.log(`  ${id}: ${found ? 'presente ✓' : 'FALTA ✗'}`)
}

function countRawDistinct(vs: { ubicaciones: { sites: { city: string }[] } }[]): number {
  const set = new Set<string>()
  for (const v of vs) for (const s of v.ubicaciones.sites) set.add(s.city)
  return set.size
}