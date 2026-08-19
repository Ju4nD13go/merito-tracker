/**
 * Key dates of the public contest — pure domain logic, no React.
 *
 * Drives the key-dates calendar and the countdown alerts. Dates come from
 * dataset.metadata (official) plus the documented process pipeline. Anything
 * not yet published by the CNSC is marked `confirmed: false` — we never
 * invent official dates.
 */

export type KeyDateKind = "single" | "window"

export interface KeyDate {
  id: string
  label: string
  /** ISO date for single events, or window start for `window` kind. */
  start: string | null
  /** Window end (nullable for single events). */
  end: string | null
  kind: KeyDateKind
  /** True when the CNSC has published the date; false = "por confirmar". */
  confirmed: boolean
  note?: string
}

export interface KeyDatesSnapshot {
  dates: KeyDate[]
  /** Days until the nearest deadline that is still open, or null. */
  nextDeadline: { date: string; daysLeft: number; label: string } | null
  /** True when the registration window is currently open. */
  registrationOpen: boolean
  lastUpdated: string | null
}

/** Build the full pipeline of key dates from official metadata. */
export function buildKeyDates(meta: {
  fechaFijacion: string | null
  inscripcionWindow?: { label: string; start: string; end: string } | null
  actualDate?: string | null
}): KeyDate[] {
  const today = meta.actualDate ?? new Date().toISOString().slice(0, 10)
  const dates: KeyDate[] = []

  const window = meta.inscripcionWindow
  if (window && window.start && window.end) {
    dates.push({
      id: "inscripcion",
      label: "Inscripción en SIMO",
      start: window.start,
      end: window.end,
      kind: "window",
      confirmed: true,
      note: "Ventana oficial para radicar la inscripción en el SIMO.",
    })
  }

  if (meta.fechaFijacion) {
    const fixed = meta.fechaFijacion <= today
    dates.push({
      id: "fijacion",
      label: "Fijación de la convocatoria",
      start: meta.fechaFijacion,
      end: null,
      kind: "single",
      confirmed: true,
      note: fixed
        ? "Convocatoria oficialmente fijada por la CNSC."
        : "Fecha programada para la fijación oficial.",
    })
  }

  // Pipeline stages the CNSC publishes AFTER registration closes. We mark
  // them as "por confirmar" — no invented dates.
  dates.push(
    {
      id: "verificacion",
      label: "Verificación de requisitos mínimos",
      start: null,
      end: null,
      kind: "single",
      confirmed: false,
      note: "La CNSC publica el listado de admitidos y no admitidos.",
    },
    {
      id: "pruebas",
      label: "Pruebas escritas (aptitudes y conocimientos)",
      start: null,
      end: null,
      kind: "single",
      confirmed: false,
      note: "Fechas por confirmar por la CNSC.",
    },
    {
      id: "entrevistas",
      label: "Entrevista y prueba de valoración",
      start: null,
      end: null,
      kind: "single",
      confirmed: false,
    },
    {
      id: "listas",
      label: "Lista de elegibles",
      start: null,
      end: null,
      kind: "single",
      confirmed: false,
      note: "Publicación oficial del registro de elegibles.",
    },
  )

  return dates
}

/** Days from today until an ISO date (negative = past). */
export function daysUntil(iso: string | null, todayISO: string): number | null {
  if (!iso) return null
  const target = new Date(iso + "T00:00:00")
  const today = new Date(todayISO + "T00:00:00")
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Build the snapshot used by the calendar and the alert banner. */
export function buildKeyDatesSnapshot(
  meta: Parameters<typeof buildKeyDates>[0],
  lastUpdated: string | null
): KeyDatesSnapshot {
  const today = meta.actualDate ?? new Date().toISOString().slice(0, 10)
  const dates = buildKeyDates(meta)

  // registration open: today inside [start, end]
  const insc = dates.find((d) => d.id === "inscripcion")
  const registrationOpen = Boolean(
    insc?.start && insc.end && today >= insc.start && today <= insc.end,
  )

  // nearest upcoming deadline among confirmed, non-past events. For a
  // closed-but-soon window the relevant date is the START (registration
  // opens); once open, it is the END (closes).
  let nextDeadline: KeyDatesSnapshot["nextDeadline"] = null
  for (const d of dates) {
    if (!d.confirmed || !d.start) continue
    const target =
      d.kind === "window" && registrationOpen ? d.end : d.start
    const days = daysUntil(target, today)
    if (days === null || days < 0) continue
    if (!nextDeadline || days < nextDeadline.daysLeft) {
      nextDeadline = {
        date: target!,
        daysLeft: days,
        label: d.label,
      }
    }
  }

  return { dates, nextDeadline, registrationOpen, lastUpdated }
}