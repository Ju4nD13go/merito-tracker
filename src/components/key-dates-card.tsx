"use client";

import { useMemo } from "react";
import { AlarmClock, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import {
  buildKeyDatesSnapshot,
  daysUntil,
  type KeyDate,
} from "@/domain/key-dates";
import { formatShortDate } from "@/lib/dates";

interface KeyDatesCardProps {
  meta: {
    fechaFijacion: string | null;
    inscripcionWindow?: { label: string; start: string; end: string } | null;
  };
  lastUpdated: string | null;
}

/** Banner message derived from the snapshot, or null for no banner. */
export function countdownText(
  snapshot: ReturnType<typeof buildKeyDatesSnapshot>
): string | null {
  const insc = snapshot.dates.find((x) => x.id === "inscripcion");
  const today = new Date().toISOString().slice(0, 10);
  if (insc?.end && snapshot.registrationOpen) {
    const days = daysUntil(insc.end, today);
    if (days !== null && days >= 0) {
      return days === 0
        ? "¡Último día de inscripciones!"
        : `¡Inscripciones ABIERTAS! Faltan ${days} día${days === 1 ? "" : "s"} para el cierre (${formatShortDate(insc.end)})`;
    }
    return "¡Inscripciones ABIERTAS!";
  }
  if (snapshot.nextDeadline && snapshot.nextDeadline.daysLeft <= 7) {
    return `Faltan ${snapshot.nextDeadline.daysLeft} día${snapshot.nextDeadline.daysLeft === 1 ? "" : "s"} para ${snapshot.nextDeadline.label}`;
  }
  return null;
}

function DateRow({ date }: { date: KeyDate }) {
  const today = new Date().toISOString().slice(0, 10);
  const target = date.kind === "window" ? date.end : date.start;
  const days = daysUntil(target, today);

  let chip: { text: string; cls: string } | null = null;
  if (!date.confirmed) {
    chip = { text: "Por confirmar", cls: "bg-muted text-muted-foreground border" };
  } else if (date.kind === "window" && date.start && date.end && today >= date.start && today <= date.end) {
    chip = { text: "Abierta", cls: "bg-green-500/15 text-green-700 dark:text-green-400" };
  } else if (days !== null && days >= 0 && days <= 7) {
    chip = { text: `Faltan ${days} día${days === 1 ? "" : "s"}`, cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" };
  } else if (days !== null && days < 0) {
    chip = { text: "Cumplida", cls: "bg-muted text-muted-foreground" };
  } else if (days !== null) {
    chip = { text: `Faltan ${days} días`, cls: "bg-primary/10 text-primary" };
  }

  const display = date.kind === "window" && date.start && date.end
    ? `${formatShortDate(date.start)} → ${formatShortDate(date.end)}`
    : formatShortDate(date.start);

  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className="flex items-start gap-2.5">
        {date.confirmed ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">{date.label}</p>
          <p className="text-xs text-muted-foreground">{display}</p>
          {date.note && <p className="mt-0.5 text-xs text-muted-foreground/80">{date.note}</p>}
        </div>
      </div>
      {chip && (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.cls}`}>
          {chip.text}
        </span>
      )}
    </li>
  );
}

export function KeyDatesCard({ meta, lastUpdated }: KeyDatesCardProps) {
  const snapshot = useMemo(() => buildKeyDatesSnapshot(meta, lastUpdated), [meta, lastUpdated]);
  const banner = countdownText(snapshot);

  return (
    <section className="card-surface animate-in p-6 fade-in slide-in-from-bottom-2">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
        <CalendarDays className="h-5 w-5 text-primary" /> Calendario del
        concurso
      </h2>
      <p className="mb-1 text-xs text-muted-foreground">
        {lastUpdated ? `Actualizado el ${formatShortDate(lastUpdated)}` : "Fechas oficiales de la CNSC"}
      </p>

      {banner && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400"
        >
          <AlarmClock className="h-4 w-4 shrink-0" />
          {banner}
        </div>
      )}

      <ul className="divide-y divide-border">
        {snapshot.dates.map((d) => (
          <DateRow key={d.id} date={d} />
        ))}
      </ul>
    </section>
  );
}