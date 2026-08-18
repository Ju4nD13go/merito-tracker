import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCity, isPhantom, aggregateNormalizedCities } from './cities.ts'

test('normalizeCity maps accent/case variants to canonical', () => {
  assert.equal(normalizeCity('Bogotá'), 'Bogotá D.C.')
  assert.equal(normalizeCity('Bogota'), 'Bogotá D.C.')
  assert.equal(normalizeCity('Choco'), 'Chocó')
  assert.equal(normalizeCity('Chocó'), 'Chocó')
  assert.equal(normalizeCity('César'), 'Cesar')
  assert.equal(normalizeCity('Cesar'), 'Cesar')
  assert.equal(normalizeCity('Valle del Aburra'), 'Valle de Aburra')
  assert.equal(normalizeCity('Valle Del Aburra'), 'Valle de Aburra')
  assert.equal(normalizeCity('Valle de aburra'), 'Valle de Aburra')
  assert.equal(normalizeCity('San Juan Del Cesar'), 'San Juan del Cesar')
  assert.equal(normalizeCity('Apartado'), 'Apartadó')
  assert.equal(normalizeCity('Rio Negro'), 'Rionegro')
  assert.equal(normalizeCity('Guataque'), 'Guateque')
  assert.equal(normalizeCity('Garzon'), 'Garzón')
  assert.equal(normalizeCity('Santafé de Antioquia'), 'Santa Fe de Antioquia')
  assert.equal(normalizeCity('Carmen de Bolivar'), 'Carmen de Bolívar')
  assert.equal(normalizeCity('San Rosa de Viterbo'), 'Santa Rosa de Viterbo')
  assert.equal(normalizeCity('Puerto Berrio'), 'Puerto Berrío')
  assert.equal(normalizeCity('Amaga'), 'Amagá')
  assert.equal(normalizeCity('Santander Quilichao'), 'Santander de Quilichao')
})

test('normalizeCity passes unknown names through unchanged', () => {
  assert.equal(normalizeCity('Yopal'), 'Yopal')
  assert.equal(normalizeCity('Medellín'), 'Medellín')
})

test('isPhantom detects parser artifacts', () => {
  assert.equal(isPhantom('Leticia'), true)
  assert.equal(isPhantom('Turbo'), true)
  assert.equal(isPhantom('popular'), true)
  assert.equal(isPhantom('Infancia, La Adolescencia, La Familia Y'), true)
  assert.equal(isPhantom('Bogotá'), false)
  assert.equal(isPhantom('Cali'), false)
})

test('aggregateNormalizedCities merges variants and drops phantoms', () => {
  const vacancies = [
    { ubicaciones: { sites: [
      { city: 'Bogotá', count: 2 },
      { city: 'Bogota', count: 1 },
      { city: 'Leticia', count: 0 },
      { city: 'Choco', count: 3 },
      { city: 'Chocó', count: 1 },
      { city: 'Cali', count: 5 },
    ] } },
  ]
  const result = aggregateNormalizedCities(vacancies as never)
  assert.deepEqual(result.removedPhantoms, ['Leticia'])
  const bogota = result.entries.find((e) => e.canonical === 'Bogotá D.C.')
  assert.equal(bogota?.count, 3)
  const choco = result.entries.find((e) => e.canonical === 'Chocó')
  assert.equal(choco?.count, 4)
  assert.equal(result.entries.length, 3) // Bogotá D.C., Chocó, Cali
})