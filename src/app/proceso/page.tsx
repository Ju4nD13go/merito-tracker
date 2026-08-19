import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Layers,
  ListChecks,
  MousePointerClick,
  ScrollText,
  Users,
} from "lucide-react";
import { dataset } from "@/lib/data";
import { formatFullDate } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Cómo funciona el concurso",
  description:
    "Mapa del proceso del concurso de méritos: inscripción, verificación de requisitos, pruebas, entrevista y lista de elegibles.",
};

const RESOLUTION_LABEL: Record<number, string> = {
  76: "Resolución 076",
  108: "Resolución 108",
  133: "Resolución 133",
  212: "Resolución 212",
};

const STEPS = [
  {
    icon: CalendarCheck,
    title: "Fijación del concurso",
    body: "La CNSC fija la convocatoria abierta y publica el acuerdo rector. Aquí se conocen las condiciones generales, el número de empleos y las etapas del proceso.",
    date: "fechaFijacion",
    official: true,
  },
  {
    icon: MousePointerClick,
    title: "Inscripción en SIMO",
    body: "Radicación de la inscripción dentro de la ventana oficial. Es cuando se consigna el Formulario Oficial de Inscripción (FOI) en el Sistema de Apoyo para la Igualdad, el Mérito y la Oportunidad (SIMO).",
    date: "inscripcionWindow",
    official: true,
    link: "https://simo.cnsc.gov.co/",
  },
  {
    icon: ClipboardCheck,
    title: "Verificación de requisitos mínimos",
    body: "La entidad revisa que cumplas los requisitos mínimos del empleo (estudio, experiencia, tarjeta profesional). Publican el listado de admitidos y no admitidos; hay etapa de reclamaciones y subsanación.",
    date: "porConfirmar",
  },
  {
    icon: BookOpenCheck,
    title: "Pruebas escritas",
    body: "Pruebas sobre competencias funcionales y comportamentales. El peso de cada prueba está definido en los requisitos y cambia por empleo; las pruebas son eliminatorias y clasificatorias.",
    date: "porConfirmar",
  },
  {
    icon: Users,
    title: "Entrevista y valoración",
    body: "Prueba de entrevista para los cargos que la contemplan. Verifica la experiencia y el conocimiento del aspirante frente al empleo.",
    date: "porConfirmar",
  },
  {
    icon: ScrollText,
    title: "Lista de elegibles",
    body: "Con base en el puntaje total se conforma la lista de elegibles por empleo y territorialidad. Es la fuente para la expedición de la lista y el nombramiento en periodo de prueba.",
    date: "porConfirmar",
  },
];

export default function ProcesoPage() {
  const meta = dataset.metadata;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Layers className="h-6 w-6 text-primary" /> Cómo funciona el
          concurso
        </h1>
        <p className="mt-1 text-muted-foreground">
          Mapa del proceso oficial desde la fijación hasta la lista de
          elegibles. Las fechas marcadas como “por confirmar” las publica la
          CNSC después del cierre de inscripciones — aquí no inventamos
          fechas.
        </p>
      </header>

      {/* Context card */}
      <section className="card-surface animate-in p-6 fade-in slide-in-from-bottom-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-primary" /> {meta.competitionName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta.processName}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Fijación
            </dt>
            <dd className="mt-0.5 font-medium">
              {formatFullDate(meta.fechaFijacion)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Inscripciones
            </dt>
            <dd className="mt-0.5 font-medium">
              {meta.inscripcionWindow?.label ?? "Por confirmar"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Marco normativo
            </dt>
            <dd className="mt-0.5">
              {meta.resolutions
                .map((r) => RESOLUTION_LABEL[r] ?? `Resolución ${r}`)
                .join(" · ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Oficial
            </dt>
            <dd className="mt-0.5">
              <Link
                href="https://www.cnsc.gov.co/"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Comisión Nacional del Servicio Civil <ArrowRight className="h-3 w-3" />
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      {/* Timeline */}
      <ol className="space-y-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const dateLabel =
            step.date === "fechaFijacion"
              ? `Fijado el ${formatFullDate(meta.fechaFijacion)}`
              : step.date === "inscripcionWindow"
                ? meta.inscripcionWindow?.label
                : "Fecha por confirmar";
          const confirmed = step.date !== "porConfirmar";

          return (
            <li
              key={step.title}
              className="card-surface animate-in relative p-5 fade-in slide-in-from-bottom-2 [animation-delay:60ms]"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      confirmed
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="mt-2 h-full w-px bg-border" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        confirmed
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {dateLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                  {step.link && (
                    <Link
                      href={step.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      <ListChecks className="h-4 w-4" /> Inscribirme en SIMO
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="rounded-lg border bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Fuente: datos oficiales del concurso publicados en la convocatoria
        (resoluciones {meta.resolutions.join(", ")}). Esta guía es un resumen
        orientativo; el acuerdo rector de la CNSC es el documento vinculante.
      </p>
    </div>
  );
}