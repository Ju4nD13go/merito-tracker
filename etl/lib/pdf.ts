import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ETL_DIR = resolve(__dirname, '..')
export const CACHE_DIR = resolve(ETL_DIR, 'tmp')
export const CACHE_FILE = resolve(CACHE_DIR, 'full-layout.txt')

export interface PdfSource {
  file: string
  pages: number
  sizeBytes: number
}

export function extractLayoutText(pdfPath: string, opts: { force?: boolean } = {}): string {
  if (!opts.force && existsSync(CACHE_FILE)) {
    return readFileSync(CACHE_FILE, 'utf8')
  }
  mkdirSync(CACHE_DIR, { recursive: true })
  const out = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  writeFileSync(CACHE_FILE, out)
  return out
}

export function statPdf(pdfPath: string): PdfSource {
  const info = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' })
  const pages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1] ?? NaN)
  const { size } = { size: 0 }
  const sizeBytes = readFileSync(pdfPath).byteLength
  return { file: pdfPath, pages, sizeBytes }
}