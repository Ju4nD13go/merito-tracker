/**
 * City normalization.
 *
 * The raw PDF cities come with accent/case/misspelling variants
 * ("Bogotá" vs "Bogota", "Chocó" vs "Choco", "Valle del Aburra" vs
 * "Valle Del Aburra"...). This module maps raw names to canonical
 * Colombian spellings deterministically. Raw values stay untouched in
 * the dataset for audit; normalization is applied at load time.
 */

export type CityEntry = {
  raw: string
  canonical: string
  count: number
}

/** Explicit overrides first (highest confidence). */
const OVERRIDES: Record<string, string> = {
  Bogotá: 'Bogotá D.C.',
  Bogota: 'Bogotá D.C.',
  Choco: 'Chocó',
  Chrysler: 'Chocó', // defensive: never seen, but grouped with accent fixes
  Cesar: 'Cesar',
  César: 'Cesar',
  'Valle del Aburra': 'Valle de Aburra',
  'Valle de Aburra': 'Valle de Aburra',
  'Valle Del Aburra': 'Valle de Aburra',
  'Valle de aburra': 'Valle de Aburra',
  'Valle del aburra': 'Valle de Aburra',
  'San Juan Del Cesar': 'San Juan del Cesar',
  'San Juan del Cesar': 'San Juan del Cesar',
  Apartado: 'Apartadó',
  Apartadó: 'Apartadó',
  'Rio Negro': 'Rionegro',
  Rionegro: 'Rionegro',
  Guateque: 'Guateque',
  Guataque: 'Guateque',
  Garzon: 'Garzón',
  Garzón: 'Garzón',
  'Santafé de Antioquia': 'Santa Fe de Antioquia',
  'Santa fe de Antioquia': 'Santa Fe de Antioquia',
  'Carmen de Bolivar': 'Carmen de Bolívar',
  'Carmen de Bolívar': 'Carmen de Bolívar',
  'San Rosa de Viterbo': 'Santa Rosa de Viterbo',
  'Santa Rosa de Viterbo': 'Santa Rosa de Viterbo',
  'Puerto Berrio': 'Puerto Berrío',
  'Puerto Berrío': 'Puerto Berrío',
  Amaga: 'Amagá',
  Amagá: 'Amagá',
  'Santander Quilichao': 'Santander de Quilichao',
  'Santander de Quilichao': 'Santander de Quilichao',
}

/**
 * Entries that are clearly parser artifacts — fragments of a list header
 * or a relation name, never a location. They carry count 0 in the dataset.
 */
const PHANTOM_NAMES = new Set([
  'Infancia, La Adolescencia, La Familia Y',
  'popular',
  'Leticia',
  'Melgar',
  'Mocoa',
  'Turbo',
])

/** Normalise a single raw city name. Unknown names pass through as-is. */
export function normalizeCity(raw: string): string {
  const key = raw.trim()
  if (OVERRIDES[key]) return OVERRIDES[key]
  return key
}

export function isPhantom(raw: string): boolean {
  return PHANTOM_NAMES.has(raw.trim())
}

export interface NormalizationResult {
  entries: CityEntry[]
  removedPhantoms: string[]
  distinctCount: number
}

/**
 * Normalize every site in a list of vacancies and aggregate counts.
 * Phantom entries are dropped from the aggregate (they are parser noise),
 * but each raw name → canonical mapping is reported for audit.
 */
export function aggregateNormalizedCities(vacancies: { ubicaciones: { sites: { city: string; count: number }[] } }[]): NormalizationResult {
  const byCanonical = new Map<string, CityEntry>()
  const removedPhantoms: string[] = []

  for (const v of vacancies) {
    for (const site of v.ubicaciones.sites) {
      const raw = site.city.trim()
      if (isPhantom(raw)) {
        removedPhantoms.push(raw)
        continue
      }
      const canonical = normalizeCity(raw)
      const entry = byCanonical.get(canonical) ?? { raw, canonical, count: 0 }
      entry.count += site.count
      byCanonical.set(canonical, entry)
    }
  }

  const entries = [...byCanonical.values()].sort((a, b) => b.count - a.count)
  return {
    entries,
    removedPhantoms: [...new Set(removedPhantoms)],
    distinctCount: entries.length,
  }
}