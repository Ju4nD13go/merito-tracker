import type { Requisitos } from '../types.ts'
import { cleanLines, sectionIndex } from './forms.ts'
import type { FormBlock } from './forms.ts'
import { collapseSpaces, joinLines } from './utils.ts'

const EXPERIENCIA_LABEL_RE = /Experiencia:/
const EQUIVALENCIAS_LABEL_RE = /Equivalencias entre estudios y/
const DOCS_NOTE_RE = /^Los documentos para el cumplimiento/

export function parseRequisitos(block: FormBlock): Requisitos {
  const s2 = sectionIndex(block, /REQUISITOS MÍNIMOS/)
  const s3 = sectionIndex(block, /PROP[ÓO]SITO/)
  if (s2 === null || s3 === null || s3 <= s2) {
    return emptyRequisitos()
  }
  const lines = cleanLines(block.lines.slice(s2 + 1, s3))

  const expLineIdx = lines.findIndex((l) => EXPERIENCIA_LABEL_RE.test(l))
  const hasExp = expLineIdx >= 0
  const expCol = hasExp ? lines[expLineIdx].indexOf('Experiencia:') : Infinity

  const studyParts: string[] = []
  const expParts: string[] = []
  const eqParts: string[] = []
  const docsParts: string[] = []
  let inEquiv = false
  let inDocs = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const text = line.trim()

    if (DOCS_NOTE_RE.test(text)) {
      inDocs = true
      inEquiv = false
      docsParts.push(text)
      continue
    }
    if (inDocs) {
      docsParts.push(text)
      continue
    }

    if (EQUIVALENCIAS_LABEL_RE.test(text)) {
      inEquiv = true
      continue
    }
    if (inEquiv && /^experiencia\s*:?/i.test(text)) {
      continue
    }
    if (inEquiv) {
      const col = line.indexOf(text)
      if (col < 45) {
        eqParts.push(text)
        continue
      }
    }

    const col = line.indexOf(text)
    if (hasExp && col >= expCol) {
      if (EXPERIENCIA_LABEL_RE.test(text)) {
        expParts.push(text.replace(EXPERIENCIA_LABEL_RE, '').trim())
      } else {
        expParts.push(text)
      }
      continue
    }
    if (/^Estudio\s*:/i.test(text)) {
      studyParts.push(text.replace(/^Estudio\s*:\s*/i, ''))
      continue
    }
    studyParts.push(text)
  }

  const estudio = joinLines(studyParts)
  const experiencia = expParts.length ? joinLines(expParts) : null
  const equivalencias = eqParts.length ? joinLines(eqParts) : null
  const documentsNote = docsParts.length ? joinLines(docsParts) : null

  return {
    estudio: collapseSpaces(estudio),
    experiencia,
    tarjetaProfesional: /tarjeta profesional/i.test(estudio),
    equivalencias,
    documentsNote,
  }
}

function emptyRequisitos(): Requisitos {
  return {
    estudio: '',
    experiencia: null,
    tarjetaProfesional: false,
    equivalencias: null,
    documentsNote: null,
  }
}