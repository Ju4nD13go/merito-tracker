"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useProfile } from "@/lib/profile";
import { useFavorites } from "@/lib/favorites";
import { useApplications } from "@/lib/applications";

/**
 * Backup / restore of all browser-stored user data (profile, favorites,
 * applications, document checklists) as a single JSON file.
 */

export interface BackupPayload {
  app: string;
  version: 1;
  exportedAt: string;
  profile: unknown;
  favorites: string[];
  applications: Record<string, unknown>;
  documents: Record<string, string[]>;
}

export function ProfileBackup() {
  const { profile } = useProfile();
  const { favorites } = useFavorites();
  const { applications } = useApplications();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Recompute from the live stores: the documents store exposes per-vacancy
  // reads, so we read straight from localStorage for the full map.
  function readFullDocuments(): Record<string, string[]> {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem("merito-tracker:documents");
      return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    } catch {
      return {};
    }
  }

  function handleExport() {
    const payload: BackupPayload = {
      app: "merito-tracker",
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      favorites,
      applications,
      documents: readFullDocuments(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merito-tracker-respaldo-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ kind: "ok", text: "Respaldo descargado. Guárdalo en un lugar seguro." });
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Partial<BackupPayload>;
        if (data.app !== "merito-tracker" || data.version !== 1) {
          throw new Error("archivo no reconocido");
        }
        if (typeof data.profile !== "object" || data.profile === null) {
          throw new Error("el archivo no trae un perfil válido");
        }

        window.localStorage.setItem(
          "merito-tracker:profile",
          JSON.stringify(data.profile)
        );
        if (Array.isArray(data.favorites)) {
          window.localStorage.setItem(
            "merito-tracker:favorites",
            JSON.stringify(data.favorites)
          );
        }
        if (data.applications && typeof data.applications === "object") {
          window.localStorage.setItem(
            "merito-tracker:applications",
            JSON.stringify(data.applications)
          );
        }
        if (data.documents && typeof data.documents === "object") {
          window.localStorage.setItem(
            "merito-tracker:documents",
            JSON.stringify(data.documents)
          );
        }

        // Sync the in-memory caches so the UI updates immediately.
        window.dispatchEvent(new Event("merito-tracker:backup-imported"));
        setMessage({
          kind: "ok",
          text: "Respaldo importado. Tus datos se actualizaron.",
        });
      } catch (e) {
        setMessage({
          kind: "err",
          text: e instanceof Error ? e.message : "No se pudo importar el archivo.",
        });
      }
    };
    reader.readAsText(file);
  }

  return (
    <section className="card-surface space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Respaldo de tus datos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Exporta tu perfil, favoritos, postulaciones y checklists a un archivo
          JSON. Sirve para cambiar de navegador o devolverte de un borrado de
          caché. Tus datos nunca salen de tu dispositivo salvo este archivo
          que tú descargas.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="btn-lift inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Descargar respaldo
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-lift inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Upload className="h-4 w-4" /> Importar respaldo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {message && (
        <p
          role="status"
          className={`text-sm font-medium ${
            message.kind === "ok" ? "text-primary" : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}