/**
 * Document checklist derivation — pure domain logic, no React.
 *
 * The `documentsNote` field in the dataset is generic boilerplate identical
 * for every vacancy, so the checklist is derived deterministically from the
 * structured requirements (education level, professional license, experience,
 * driving licence mention) plus the documents every contestant must bring.
 */

import type { Vacancy } from "./contracts";

export interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
}

const COMMON_ITEMS: ChecklistItem[] = [
  { id: "cedula", label: "Cédula de ciudadanía", hint: "Documento de identidad vigente." },
  { id: "simo", label: "Inscripción en SIMO", hint: "Radicación dentro de la ventana oficial." },
  { id: "titulo", label: "Acta de grado / título", hint: "Del nivel educativo exigido en los requisitos." },
];

/** Build the full document checklist for a vacancy. */
export function deriveDocuments(v: Vacancy): ChecklistItem[] {
  const items = [...COMMON_ITEMS];
  const education = (v.requisitos.estudio ?? "").toLowerCase();
  const experience = (v.requisitos.experiencia ?? "").toLowerCase();

  if (v.requisitos.tarjetaProfesional) {
    items.push({
      id: "tarjeta",
      label: "Tarjeta profesional",
      hint: "Requerida según los requisitos de la vacante.",
    });
  }

  if (/diploma|posgrado|especializaci[oó]n|maestr[íi]a|doctorado/.test(education)) {
    items.push({
      id: "diploma",
      label: "Diploma / título de posgrado",
      hint: "Si aplica equivalencias o se exige posgrado.",
    });
  }

  if (v.requisitos.experiencia) {
    items.push({
      id: "certificados",
      label: "Certificados laborales de experiencia",
      hint: "Con las especificaciones de la convocatoria (tiempo y funciones).",
    });
  }

  if (/conducci[oó]n|licencia de conducción|chofer/.test(`${education} ${experience}`)) {
    items.push({
      id: "licencia",
      label: "Licencia de conducción",
      hint: "Categoría exigida según el manual de funciones.",
    });
  }

  return items;
}