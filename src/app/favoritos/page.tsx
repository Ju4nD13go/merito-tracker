"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, Heart, Trash2 } from "lucide-react";
import { vacancies } from "@/lib/vacancies";
import { useFavorites } from "@/lib/favorites";
import { VacancyCard } from "@/components/vacancy-card";
import { exportFavoritesToExcel } from "@/lib/excel";

export default function FavoritesPage() {
  const { favorites, clearFavorites } = useFavorites();
  const [exporting, setExporting] = useState(false);

  const favVacancies = useMemo(
    () => vacancies.filter((v) => favorites.includes(v.id)),
    [favorites]
  );

  async function handleExport() {
    setExporting(true);
    try {
      await exportFavoritesToExcel(favVacancies);
    } catch (err) {
      console.error("Excel export failed", err);
    } finally {
      setExporting(false);
    }
  }

  if (favVacancies.length === 0) {
    return (
      <div className="animate-in py-16 text-center fade-in">
        <Heart className="mx-auto h-12 w-12 animate-in text-muted-foreground/50 fade-in zoom-in" />
        <h1 className="mt-4 animate-in text-2xl font-bold fade-in slide-in-from-bottom-2 [animation-delay:60ms]">
          Sin favoritas todavía
        </h1>
        <p className="mx-auto mt-2 max-w-md animate-in text-muted-foreground fade-in slide-in-from-bottom-2 [animation-delay:120ms]">
          Cuando veas una vacante que te interese, pínchale el corazón para
          guardarla aquí. Luego podrás descargarlas todas en Excel con un solo
          clic.
        </p>
        <Link
          href="/vacantes"
          className="mt-6 inline-flex animate-in items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:opacity-90 fade-in [animation-delay:180ms]"
        >
          Explorar vacantes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Favoritas ({favVacancies.length})
          </h1>
          <p className="text-muted-foreground">
            Tu lista personal de convocatorias — solo en este navegador.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <Download className="h-4 w-4" />
            {exporting ? "Generando…" : "Descargar Excel"}
          </button>
          <button
            onClick={clearFavorites}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" /> Limpiar
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favVacancies.map((v, i) => (
          <VacancyCard key={v.id} vacancy={v} index={i} />
        ))}
      </div>
    </div>
  );
}