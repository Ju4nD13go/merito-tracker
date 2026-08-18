"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { vacancies } from "@/lib/data";
import { normalizeCity } from "@/domain/cities";
import { VacancyCard } from "@/components/vacancy-card";

const LEVELS = [
  "Asesor",
  "Ejecutivo",
  "Profesional",
  "Técnico",
  "Administrativo",
  "Operativo",
] as const;

export default function VacantesPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const cities = useMemo(
    () =>
      [
        ...new Set(
          vacancies.flatMap((v) =>
            v.ubicaciones.sites.map((s) => normalizeCity(s.city))
          )
        ),
      ].sort((a, b) => a.localeCompare(b, "es")),
    []
  );

  const filtered = useMemo(() => {
    return vacancies.filter((v) => {
      if (level !== "all" && v.empleo.nivelJerarquico !== level) return false;
      if (city !== "all") {
        const hasCity = v.ubicaciones.sites.some(
          (s) => normalizeCity(s.city) === city
        );
        if (!hasCity) return false;
      }
      if (onlyAvailable && v.ubicaciones.numeroCargos === 0) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [
          v.empleo.denominacion,
          v.empleo.codigoGrado,
          v.proposito,
          ...v.funciones,
          v.requisitos.estudio,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [search, level, city, onlyAvailable]);

  const hasFilters = search.trim() !== "" || level !== "all" || city !== "all" || onlyAvailable;

  return (
    <div className="space-y-6">
      <header className="animate-in fade-in">
        <h1 className="text-2xl font-bold">Explorar vacantes</h1>
        <p className="text-muted-foreground">
          {filtered.length} de {vacancies.length} convocatorias
        </p>
      </header>

      <div className="card-surface grid animate-in gap-3 p-4 fade-in [animation-delay:60ms] sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cargo, funciones…"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Todos los niveles</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              Nivel {l}
            </option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="rounded border"
          />
          Solo con cargos disponibles
        </label>
      </div>

      {hasFilters && (
        <div className="animate-in fade-in">
          <button
            onClick={() => {
              setSearch("");
              setLevel("all");
              setCity("all");
              setOnlyAvailable(false);
            }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Limpiar filtros
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No hay convocatorias que coincidan con los filtros. Ajusta tu
          búsqueda.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v, i) => (
            <VacancyCard key={v.id} vacancy={v} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}