"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Download, FileSpreadsheet, Sparkles, User } from "lucide-react";
import { vacancies } from "@/lib/data";
import { useProfile } from "@/lib/profile";
import { useFavorites } from "@/lib/favorites";
import { useApplications } from "@/lib/applications";
import { rankVacancies } from "@/domain/match";
import { VacancyCard } from "@/components/vacancy-card";
import { exportFavoritesToExcel } from "@/lib/excel";

const totalEmpleos = vacancies.reduce(
  (a, v) => a + (v.ubicaciones.numeroCargos ?? 0),
  0
);

export default function DashboardPage() {
  const { profile, hasProfile } = useProfile();
  const { favorites } = useFavorites();
  const { applications } = useApplications();

  const appliedCount = Object.values(applications).filter(
    (r) => r.status === "aplicada" || r.status === "en_proceso" || r.status === "entrevista" || r.status === "nombrada"
  ).length;

  const ranked = useMemo(() => {
    if (!hasProfile) return null;
    return rankVacancies(vacancies, profile);
  }, [hasProfile, profile]);

  const favVacancies = useMemo(
    () => vacancies.filter((v) => favorites.includes(v.id)),
    [favorites]
  );

  const topMatches = ranked?.matches.filter((m) => m.passed).slice(0, 6) ?? [];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section
        className="card-surface relative overflow-hidden p-6 sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-2xl"
        />
        <div className="relative">
          <span className="inline-flex animate-in items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary fade-in">
            <Sparkles className="h-3 w-3" />
            Concurso de méritos · Inscripción del 07 al 18 de septiembre
          </span>
          <h1 className="mt-3 animate-in text-2xl font-bold fade-in slide-in-from-bottom-2 sm:text-3xl">
            Mérito Construyendo Excelencia 2026
          </h1>
          <p className="mt-1 max-w-xl animate-in text-muted-foreground fade-in slide-in-from-bottom-2 [animation-delay:80ms]">
            {vacancies.length} convocatorias · {totalEmpleos} empleos ·{" "}
            {hasProfile
              ? "Tu perfil ya está activo para comparar compatibilidad."
              : "Arma tu perfil para ver cuáles vacantes se ajustan a ti."}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="animate-in rounded-lg bg-primary/10 p-4 fade-in slide-in-from-bottom-2 [animation-delay:120ms]">
              <p className="text-3xl font-bold text-primary">
                {ranked?.passedCount ?? "—"}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Vacantes compatibles
              </p>
            </div>
            <div className="animate-in rounded-lg bg-accent/10 p-4 fade-in slide-in-from-bottom-2 [animation-delay:180ms]">
              <p className="text-3xl font-bold text-accent">
                {favorites.length}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">En favoritos</p>
            </div>
            <div className="animate-in rounded-lg bg-muted p-4 fade-in slide-in-from-bottom-2 [animation-delay:240ms]">
              <p className="text-3xl font-bold text-primary">
                {appliedCount}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                En proceso de postulación
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!hasProfile && (
              <Link
                href="/mi-perfil"
                className="btn-lift inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <User className="h-4 w-4" /> Armar mi perfil
              </Link>
            )}
            <Link
              href="/vacantes"
              className="btn-lift inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Explorar vacantes <ArrowRight className="h-4 w-4" />
            </Link>
            {favVacancies.length > 0 && (
              <button
                onClick={() => exportFavoritesToExcel(favVacancies)}
                className="btn-lift inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                <FileSpreadsheet className="h-4 w-4" /> Descargar Excel de favoritos
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {topMatches.length > 0 && (
        <section className="animate-in fade-in [animation-delay:120ms]">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Mejores coincidencias para tu perfil
              </h2>
              <p className="text-sm text-muted-foreground">
                Ordenadas por el motor clasificatorio del concurso.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topMatches.map((m, i) => {
              const v = vacancies.find((x) => x.id === m.vacancyId)!;
              return (
                <VacancyCard key={v.id} vacancy={v} score={m.score?.total} index={i} />
              );
            })}
          </div>
        </section>
      )}

      {favorites.length > 0 && (
        <section className="animate-in fade-in [animation-delay:200ms]">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">Tus favoritas</h2>
              <p className="text-sm text-muted-foreground">
                Guardadas en este navegador.
              </p>
            </div>
            <Link
              href="/favoritos"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favVacancies.slice(0, 6).map((v, i) => (
              <VacancyCard key={v.id} vacancy={v} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}