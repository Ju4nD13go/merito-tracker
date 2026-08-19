import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Briefcase, ClipboardList, GraduationCap, MapPin, Users } from "lucide-react";
import { findVacancy, vacancies, formatSalary } from "@/lib/vacancies";
import { FavoriteButton } from "@/components/favorite-button";
import { MatchPanel } from "@/components/match-panel";
import { StatusStepper } from "@/components/status-stepper";
import { DocumentChecklist } from "@/components/document-checklist";

export function generateStaticParams() {
  return vacancies.map((v) => ({ id: v.id }));
}

export const dynamicParams = false;

export function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return params.then(({ id }) => {
    const v = findVacancy(id);
    return {
      title: v ? v.empleo.denominacion : "Detalle de vacante",
      description: v?.requisitos.estudio,
    };
  });
}

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = findVacancy(id);
  if (!v) notFound();

  const totalSites = v.ubicaciones.sites.reduce((a, s) => a + s.count, 0);

  return (
    <article className="space-y-6">
      <Link
        href="/vacantes"
        className="inline-flex animate-in items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary fade-in"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a vacantes
      </Link>

      {/* Header */}
      <header className="card-surface animate-in p-6 fade-in slide-in-from-bottom-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {v.convocatoriaLabel} · Resolución {v.resolucion} ·{" "}
          {v.empleo.codigoGrado}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{v.empleo.denominacion}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nivel {v.empleo.nivelJerarquico} ·{" "}
          {formatSalary(v.empleo.asignacionBasica?.amount)}
          {v.empleo.asignacionBasica?.vigencia &&
            ` · Vigencia ${v.empleo.asignacionBasica.vigencia}`}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <FavoriteButton vacancyId={v.id} />
          {v.terminoInscripciones && (
            <span className="text-xs text-muted-foreground">
              Inscripciones hasta {v.terminoInscripciones}
            </span>
          )}
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mi estado en esta vacante
          </p>
          <StatusStepper vacancyId={v.id} />
        </div>
      </header>

      {/* Compatibilidad: eliminatorio + clasificatorio con transparencia */}
      <MatchPanel vacancy={v} />

      {/* Checklist de documentos para esta vacante */}
      <DocumentChecklist vacancy={v} />

      {/* Ubicaciones */}
      <section className="card-surface animate-in p-6 fade-in slide-in-from-bottom-2 [animation-delay:80ms]">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <MapPin className="h-5 w-5 text-primary" /> Ubicaciones
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            {v.ubicaciones.numeroCargos ?? "—"} cargos ofertados · {totalSites}{" "}
            cupos totales
          </span>
        </div>
        {v.ubicaciones.plan && (
          <p className="mt-3 text-sm text-muted-foreground">
            <strong className="text-foreground">Plan:</strong>{" "}
            {v.ubicaciones.plan}
            {v.ubicaciones.dependency && ` — ${v.ubicaciones.dependency}`}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {v.ubicaciones.sites.map((s) => (
            <span
              key={s.city}
              className="rounded-full border bg-muted px-3 py-1 text-xs"
            >
              {s.city} ({s.count})
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requisitos */}
        <section className="card-surface animate-in p-6 fade-in slide-in-from-bottom-2 [animation-delay:140ms]">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" /> Requisitos mínimos
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="grid gap-1 sm:grid-cols-[130px_1fr]">
              <dt className="font-medium text-muted-foreground">Estudio</dt>
              <dd>{v.requisitos.estudio}</dd>
            </div>
            {v.requisitos.experiencia && (
              <div className="grid gap-1 sm:grid-cols-[130px_1fr]">
                <dt className="font-medium text-muted-foreground">
                  Experiencia
                </dt>
                <dd>{v.requisitos.experiencia}</dd>
              </div>
            )}
            <div className="grid gap-1 sm:grid-cols-[130px_1fr]">
              <dt className="font-medium text-muted-foreground">
                Tarjeta profesional
              </dt>
              <dd className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-primary" />
                {v.requisitos.tarjetaProfesional ? "Requerida" : "No requerida"}
              </dd>
            </div>
            {v.requisitos.equivalencias && (
              <div className="grid gap-1 sm:grid-cols-[130px_1fr]">
                <dt className="font-medium text-muted-foreground">
                  Equivalencias
                </dt>
                <dd>{v.requisitos.equivalencias}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Propósito y funciones */}
        <section className="card-surface animate-in p-6 fade-in slide-in-from-bottom-2 [animation-delay:200ms]">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Briefcase className="h-5 w-5 text-primary" /> Propósito y funciones
          </h2>
          <p className="text-sm leading-relaxed">{v.proposito}</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {v.funciones.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* Pruebas */}
      {v.pruebas.length > 0 && (
        <section className="card-surface animate-in p-6 fade-in slide-in-from-bottom-2 [animation-delay:260ms]">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="h-5 w-5 text-primary" /> Pruebas del
            concurso
          </h2>
          <ul className="space-y-1.5">
            {v.pruebas.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm"
              >
                <span>{p.name}</span>
                {p.pct !== null && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {p.pct}%
                  </span>
                )}
              </li>
            ))}
          </ul>
          {v.notasGenerales && (
            <p className="mt-3 text-xs text-muted-foreground">
              {v.notasGenerales}
            </p>
          )}
        </section>
      )}
    </article>
  );
}