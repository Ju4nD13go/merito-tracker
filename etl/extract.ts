import { resolve } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { extractLayoutText, statPdf, CACHE_FILE } from './lib/pdf.ts'
import { splitForms } from './lib/forms.ts'
import { parseBlock } from './lib/parse.ts'
import { buildReport, OFFICIAL } from './lib/validate.ts'
import type { Vacancy, VacancyDataset } from './types.ts'

const REPO = resolve(import.meta.dirname, '..')
const PDF = process.env.PDF || resolve(REPO, 'data', 'raw', 'convocatorias2026.pdf')
const OUT = process.env.OUT_DIR || resolve(REPO, 'data')
const FORCE = process.argv.includes('--force')

function main(): void {
  const pdf = statPdf(PDF)
  const fullText = extractLayoutText(PDF, { force: FORCE })
  const blocks = splitForms(fullText, 0)

  const vacancies: Vacancy[] = blocks.map(parseBlock)
  vacancies.sort((a, b) => a.convocatoriaNo - b.convocatoriaNo)

  const report = buildReport(vacancies)
  mkdirSync(OUT, { recursive: true })

  const dataset: VacancyDataset = {
    schema: 'merito-tracker/vacancies/v1',
    generatedAt: new Date().toISOString(),
    source: {
      pdf: pdf.file,
      pages: pdf.pages,
      sizeBytes: pdf.sizeBytes,
      textCache: CACHE_FILE,
    },
    metadata: {
      processName: 'Concurso Abierto de Méritos para Proveer Cargos de Carrera',
      competitionName: 'Mérito Construyendo Excelencia',
      resolutions: [76, 108, 133, 212],
      formatoCodigo: 'TH-F-211',
      formatoVersion: 3,
      fechaFijacion: '2026-03-24',
      fechaFijacionLabel: '24 de marzo de 2026',
      inscripcionWindow: {
        label: '07 al 18 de septiembre de 2026',
        start: '2026-09-07',
        end: '2026-09-18',
      },
      officialChecksums: OFFICIAL,
    },
    counts: {
      forms: report.formsParsed,
      totalEmpleos: report.empleosParsed,
      empleosWithNullCargos: report.empleosWithNullCargos,
      byNivel: Object.fromEntries(
        Object.entries(report.byNivel).map(([k, v]) => [k, v.empleos]),
      ),
      byDenominacion: report.byDenominacion,
      byCity: report.byCity,
      totalSites: report.totalSites,
      groupLabels: countGroups(vacancies),
    },
    vacancies,
  }

  const jsonPath = resolve(OUT, 'vacancies.v1.json')
  writeFileSync(jsonPath, JSON.stringify(dataset, null, 1) + '\n')
  const reportPath = resolve(OUT, 'validation-report-v1.md')
  writeFileSync(reportPath, renderReport(report, dataset))

  process.stdout.write(renderReport(report, dataset, { consoleOut: true }))
  process.stdout.write(`\nwrote ${jsonPath}\nwrote ${reportPath}\n`)
}

function countGroups(vacancies: Vacancy[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const v of vacancies) {
    for (const g of v.ubicaciones.groups) {
      if (!g.label) continue
      out[g.label] = (out[g.label] ?? 0) + 1
    }
  }
  return out
}

function renderReport(
  report: ReturnType<typeof buildReport>,
  dataset: VacancyDataset,
  opts: { consoleOut?: boolean } = {},
): string {
  const L: string[] = []
  const push = (s: string) => L.push(s)
  const limit = opts.consoleOut ? 15 : Infinity

  push(`# Validación ETL — vacancies.v1.json`)
  push(``)
  push(
    `- PDF: ${dataset.source.pdf} (${dataset.source.pages} páginas, ${formatSize(dataset.source.sizeBytes)})`,
  )
  push(
    `- Oficial (anexo original, Resolución 076): ${OFFICIAL.forms} formatos, ${OFFICIAL.empleos} empleos`,
  )
  push(
    `- Extraído del PDF consolidado (Resolución 212): **${report.formsParsed} formatos**, **${report.empleosParsed} empleos**`,
  )
  push(``)
  push(`## 1. Datos oficiales vs. extraídos`)
  push(``)
  push(`| Métrica | Oficial | Extraído | Diferencia |`)
  push(`|---|---|---|---|`)
  push(
    `| Formatos de convocatoria | ${OFFICIAL.forms} | ${report.formsParsed} | ${report.formsParsed - OFFICIAL.forms} |`,
  )
  push(
    `| Empleos (vacantes) | ${OFFICIAL.empleos} | ${report.empleosParsed} | ${report.empleosParsed - OFFICIAL.empleos} |`,
  )
  push(``)
  push(
    `Los formatos del PDF de trabajo se numeran 001–366 y son ${report.formsParsed} (faltan: ${report.missingNumbers.join(', ')}).`,
  )
  push(
    `El conteo oficial de 291 formatos corresponde al anexo original de la Resolución 076 de 24 de marzo de 2026;`,
  )
  push(`La Resolución 212 de 2026 consolidó el anexo con una numeración ampliada.`)
  push(``)
  push(`## 2. Conteo por nivel jerárquico`)
  push(``)
  push(`| Nivel | Oficial (R.076) | Extraído (PDF R.212) | Formatos |`)
  push(`|---|---|---|---|`)
  for (const nivel of [
    'Asesor',
    'Ejecutivo',
    'Profesional',
    'Técnico',
    'Administrativo',
    'Operativo',
    'Desconocido',
  ]) {
    const rec = report.byNivel[nivel]
    const extra = rec ? rec.empleos : 0
    const official = OFFICIAL.byNivel[nivel] ?? '—'
    push(`| ${nivel} | ${official} | ${extra} | ${rec ? rec.forms : '—'} |`)
  }
  push(``)
  push(`## 3. Por denominación (formatos)`)
  push(``)
  push(`| Denominación | Formatos |`)
  push(`|---|---|`)
  for (const [d, c] of Object.entries(report.byDenominacion).sort((a, b) => b[1] - a[1])) {
    push(`| ${d} | ${c} |`)
  }
  push(``)
  push(`## 4. Ciudades / ubicaciones con más empleos`)
  push(``)
  push(`| Ciudad | Empleos |`)
  push(`|---|---|`)
  for (const [c, cnt] of Object.entries(report.byCity).sort((a, b) => b[1] - a[1]).slice(0, limit)) {
    push(`| ${c} | ${cnt} |`)
  }
  if (Object.keys(report.byCity).length > limit) {
    push(`| … | ${Object.keys(report.byCity).length - limit} ciudades más |`)
  }
  push(``)
  push(`Total de empleos en ubicaciones listadas: ${report.totalSites} (contra ${report.empleosParsed} cargos declarados).`)
  push(``)
  push(`## 5. Planes`)
  push(``)
  for (const [p, c] of Object.entries(report.plans).sort((a, b) => b[1] - a[1])) {
    push(`- ${p}: ${c} formatos`)
  }
  push(``)
  push(`## 6. Control de calidad`)
  push(``)
  push(`- Formatos con cargos sin identificar: ${report.empleosWithNullCargos}`)
  push(`- Formatos con notas de extracción: ${report.carsWithNotes.length}`)
  push(`- Formatos donde suma de ubicaciones ≠ número de cargos: ${report.discrepantSiteSums.length}`)
  for (const d of report.discrepantSiteSums.slice(0, 25)) {
    push(`  - ${d.id}: cargos=${d.cargos}, ubicaciones=${d.siteSum}`)
  }
  push(``)
  push(`### Formatos con notas de extracción`)
  for (const id of report.carsWithNotes.slice(0, limit)) {
    const v = dataset.vacancies.find((x) => x.id === id)
    if (v) push(`- ${id}: ${v.rawNotes.join(' | ')}`)
  }
  push(``)
  push(`## 7. Salarios`)
  push(``)
  const conSalario = dataset.vacancies.filter((v) => v.empleo.asignacionBasica?.amount != null)
    .length
  push(`- Formatos con asignación básica numérica: ${conSalario} / ${dataset.vacancies.length}`)
  push(``)
  for (const v of dataset.vacancies.filter((x) => x.empleo.asignacionBasica?.amount != null)
    .slice(0, 5)) {
    push(
      `- ${v.id} ${v.empleo.denominacion} (${v.empleo.codigoGrado}): ${
        v.empleo.asignacionBasica?.amount ?? 0
      } COP`,
    )
  }
  push(``)
  return L.join('\n')
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

main()