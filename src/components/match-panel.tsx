"use client";

import Link from "next/link";
import { CheckCircle2, Gauge, User, XCircle } from "lucide-react";
import { matchVacancy } from "@/domain/match";
import { useProfile } from "@/lib/profile";
import type { Vacancy } from "@/domain/contracts";

const FIELD_LABELS: Record<string, string> = {
  educación: "Educación",
  experiencia: "Experiencia",
  tarjetaProfesional: "Tarjeta profesional",
};

const PART_LABELS: Record<string, string> = {
  ciudad: "Ciudad",
  nivel_educación: "Nivel de educación",
  experiencia_adicional: "Experiencia adicional",
  afinidad_disciplina: "Afinidad de disciplina",
  tarjeta_profesional: "Tarjeta profesional",
};

export function MatchPanel({ vacancy }: { vacancy: Vacancy }) {
  const { profile, hasProfile } = useProfile();

  if (!hasProfile) {
    return (
      <section className="card-surface animate-in p-6 fade-in" data-testid="match-panel">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">¿Esta vacante es para ti?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Arma tu perfil para ver al instante si pasas los requisitos
              mínimos y qué tan afín es esta convocatoria.
            </p>
            <Link
              href="/mi-perfil"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              <User className="h-4 w-4" /> Armar mi perfil
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const match = matchVacancy(vacancy, profile);
  const blockers = match.requirements.reasons.filter((r) => !r.ok);
  const passed = match.passed;

  return (
    <section
      className="card-surface animate-in overflow-hidden fade-in"
      data-testid="match-panel"
    >
      {/* Verdict header */}
      <div
        className={`flex items-center justify-between gap-3 px-6 py-4 ${
          passed ? "bg-primary/10" : "bg-destructive/10"
        }`}
      >
        <div className="flex items-center gap-3">
          {passed ? (
            <CheckCircle2 className="h-6 w-6 text-primary" />
          ) : (
            <XCircle className="h-6 w-6 text-destructive" />
          )}
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              {passed ? "Cumples los requisitos" : "No cumples los requisitos"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {passed
                ? "Puedes postularte — revisa tu afinidad abajo."
                : `${blockers.length} campo(s) te bloquea(n). Mira el detalle.`}
            </p>
          </div>
        </div>
        {match.score && (
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{match.score.total}%</p>
            <p className="text-xs text-muted-foreground">Afinidad</p>
          </div>
        )}
      </div>

      {/* Eliminatorio checklist */}
      <div className="p-6">
        <h3 className="mb-3 text-sm font-semibold">
          Requisitos mínimos (eliminatorio)
        </h3>
        <ul className="space-y-2">
          {match.requirements.reasons.map((reason, i) => (
            <li
              key={`${reason.field}-${i}`}
              className={`flex items-start gap-2.5 rounded-md px-3 py-2 text-sm ${
                reason.ok ? "bg-muted/50" : "bg-destructive/5"
              }`}
            >
              {reason.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <div>
                <span className="font-medium">
                  {FIELD_LABELS[reason.field] ?? reason.field}:{" "}
                </span>
                <span className={reason.ok ? "" : "text-destructive"}>
                  {reason.detail}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* Clasificatorio breakdown */}
        {match.score && (
          <>
            <div className="mb-3 mt-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Afinidad (clasificatorio)
              </h3>
              <span className="text-sm font-bold text-primary">
                {match.score.total}%
              </span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${match.score.total}%` }}
              />
            </div>
            <ul className="space-y-2">
              {match.score.parts.map((part, i) => (
                <li key={`${part.label}-${i}`} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {PART_LABELS[part.label] ?? part.label}
                    </span>
                    <span className="font-medium">{Math.round(part.points)} pts</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {part.detail}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}