"use client";

import Link from "next/link";
import { ArrowRight, Heart, MapPin, Users } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useApplications, type ApplicationStatus } from "@/lib/applications";
import type { Vacancy } from "@/domain/contracts";

const STATUS_BADGES: Partial<Record<ApplicationStatus, string>> = {
  aplicada: "bg-primary/10 text-primary border-primary/30",
  en_proceso: "bg-accent/10 text-accent border-accent/40",
  entrevista: "bg-accent/10 text-accent border-accent/40",
  nombrada: "bg-primary/10 text-primary border-primary/30",
  descartada: "bg-destructive/5 text-destructive border-destructive/30",
};

const STATUS_LABELS: Partial<Record<ApplicationStatus, string>> = {
  interesada: "Interesada",
  aplicada: "Aplicada",
  en_proceso: "En proceso",
  entrevista: "Entrevista",
  nombrada: "Nombrada",
  descartada: "Descartada",
};

export function VacancyCard({
  vacancy,
  score,
  index = 0,
}: {
  vacancy: Vacancy;
  score?: number;
  index?: number;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getStatus } = useApplications();
  const fav = isFavorite(vacancy.id);
  const status = getStatus(vacancy.id);
  const cities = vacancy.ubicaciones.sites.slice(0, 3);

  return (
    <article
      className="group relative flex animate-in flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:animate-none motion-reduce:transition-none"
      style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
    >
      {/* Stretched link: the whole card is clickable */}
      <Link
        href={`/vacantes/${vacancy.id}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
        aria-label={`Ver detalle de ${vacancy.empleo.denominacion}`}
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-tight">
            <Link
              href={`/vacantes/${vacancy.id}`}
              className="after:absolute after:inset-0 hover:text-primary"
            >
              {vacancy.empleo.denominacion}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground">
            {vacancy.empleo.codigoGrado} · Nivel {vacancy.empleo.nivelJerarquico}
          </p>
          {status && STATUS_LABELS[status] && (
            <span
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                STATUS_BADGES[status] ?? "border-border text-muted-foreground"
              }`}
            >
              {STATUS_LABELS[status]}
            </span>
          )}
        </div>
        <button
          onClick={() => toggleFavorite(vacancy.id)}
          aria-label={fav ? "Quitar de favoritos" : "Guardar en favoritos"}
          className={`rounded-md p-1.5 transition-colors ${
            fav
              ? "bg-accent/20 text-accent"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Heart
            key={fav ? "on" : "off"}
            className={`heart-pop h-5 w-5 ${fav ? "fill-current" : ""}`}
          />
        </button>
      </div>

      <div className="relative z-10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {vacancy.ubicaciones.numeroCargos ?? "—"} cargos
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {cities.map((c) => c.city).join(", ") || "Donde se ubique"}
        </span>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {vacancy.requisitos.estudio}
      </p>

      {score !== undefined && (
        <div className="relative z-10 mt-auto">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium">Compatibilidad</span>
            <span className="font-bold text-primary">{score}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      <div className="relative z-10 mt-auto flex items-center justify-between pt-1">
        <span className="text-sm font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Ver detalle
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </article>
  );
}