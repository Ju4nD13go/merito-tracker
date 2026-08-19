"use client";

import { useMemo, useState } from "react";
import { Check, User } from "lucide-react";
import { useProfile } from "@/lib/profile";
import { vacancies } from "@/lib/vacancies";
import { normalizeCity } from "@/domain/cities";
import { EDUCATION_LEVELS } from "@/domain/contracts";
import type { EducationLevel } from "@/domain/contracts";

const LEVEL_LABELS: Record<EducationLevel, string> = {
  bachillerato: "Bachillerato",
  técnica: "Técnica",
  tecnológica: "Tecnológica",
  universitaria: "Universitaria",
  posgrado: "Posgrado",
};

export default function ProfilePage() {
  const { profile, hasProfile, saveProfile, clearProfile } = useProfile();
  const [saved, setSaved] = useState(false);

  const allCities = useMemo(
    () =>
      [...new Set(vacancies.flatMap((v) => v.ubicaciones.sites.map((s) => normalizeCity(s.city))))].sort(
        (a, b) => a.localeCompare(b, "es")
      ),
    []
  );

  function toggleCity(city: string) {
    const next = profile.preferredCities.includes(city)
      ? profile.preferredCities.filter((c) => c !== city)
      : [...profile.preferredCities, city];
    saveProfile({ ...profile, preferredCities: next });
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    saveProfile(profile);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <User className="h-6 w-6 text-primary" /> Mi perfil
        </h1>
        <p className="mt-1 text-muted-foreground">
          Con estos datos el motor de compatibilidad filtra las vacantes que
          pasan tus requisitos mínimos (eliminatorio) y luego las ordena por
          afinidad (clasificatorio). Todo se guarda solo en este navegador.
        </p>
      </header>

      {hasProfile && (
        <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
          Perfil guardado — el Dashboard ya usa tu información.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-surface space-y-6 p-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            Nivel educativo más alto
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EDUCATION_LEVELS.map((level) => {
              const active = profile.educationLevel === level;
              return (
                <button
                  type="button"
                  key={level}
                  onClick={() => {
                    saveProfile({ ...profile, educationLevel: level });
                    setSaved(false);
                  }}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {LEVEL_LABELS[level]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">
            Carrera / título profesional
          </span>
          <input
            type="text"
            value={profile.degrees.join(", ")}
            onChange={(e) => {
              const degrees = e.target.value
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean);
              saveProfile({ ...profile, degrees });
              setSaved(false);
            }}
            placeholder="Ej: Derecho, Administración Pública"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Años de experiencia</span>
          <input
            type="number"
            min={0}
            max={60}
            value={profile.experienceYears}
            onChange={(e) => {
              const years = Number(e.target.value) || 0;
              saveProfile({ ...profile, experienceYears: years });
              setSaved(false);
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profile.hasProfessionalLicense}
            onChange={(e) => {
              saveProfile({
                ...profile,
                hasProfessionalLicense: e.target.checked,
              });
              setSaved(false);
            }}
            className="rounded border"
          />
          Tengo tarjeta profesional registrada
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            Ciudades donde puedes trabajar
          </legend>
          <div className="flex max-h-48 flex-wrap gap-1.5 overflow-auto rounded-md border p-2">
            {allCities.map((city) => {
              const active = profile.preferredCities.includes(city);
              return (
                <button
                  type="button"
                  key={city}
                  onClick={() => toggleCity(city)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                  {city}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="btn-lift rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Guardar perfil
          </button>
          {hasProfile && (
            <button
              type="button"
              onClick={clearProfile}
              className="btn-lift rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Borrar perfil
            </button>
          )}
        </div>

        {saved && (
          <p className="text-sm font-medium text-primary">
            Perfil guardado ✓
          </p>
        )}
      </form>
    </div>
  );
}