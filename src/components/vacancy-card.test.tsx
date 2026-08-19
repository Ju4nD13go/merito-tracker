import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VacancyCard } from "./vacancy-card";
import { FavoritesProvider } from "@/lib/favorites";
import { ApplicationsProvider } from "@/lib/applications";
import type { Vacancy } from "@/domain/contracts";

const VACANCY: Vacancy = {
  id: "cov-001",
  convocatoriaNo: 1,
  convocatoriaLabel: "Cov 001",
  resolucion: 76,
  versionNo: 1,
  fechaFijacion: null,
  terminoInscripciones: null,
  empleo: {
    denominacion: "Profesional Universitario",
    codigoGrado: "PU-2003",
    codigo: null,
    grado: 16,
    nivelJerarquico: "Profesional",
    asignacionBasica: null,
  },
  ubicaciones: {
    plan: null,
    dependency: null,
    proceso: null,
    whereverAssigned: false,
    numeroCargos: 2,
    groups: [],
    sites: [{ city: "Bogotá D.C.", count: 2 }],
  },
  requisitos: {
    estudio: "Título profesional en derecho",
    experiencia: "Un (1) año",
    tarjetaProfesional: true,
    equivalencias: null,
    documentsNote: null,
  },
  proposito: "Ejercer funciones profesionales",
  funciones: ["Apoyar la gestión jurídica"],
  conocimientosEspecificos: [],
  conocimientosComunes: [],
  pruebas: [{ name: "Funcional", pct: 60 }],
  notasGenerales: null,
  rawNotes: [],
};

function renderCard(props: { score?: number; index?: number } = {}) {
  return render(
    <FavoritesProvider>
      <ApplicationsProvider>
        <VacancyCard vacancy={VACANCY} {...props} />
      </ApplicationsProvider>
    </FavoritesProvider>
  );
}

describe("VacancyCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the vacancy title, grade and city", () => {
    renderCard();
    expect(screen.getByText("Profesional Universitario")).toBeInTheDocument();
    expect(screen.getByText(/PU-2003/)).toBeInTheDocument();
    expect(screen.getByText(/Bogotá D.C./)).toBeInTheDocument();
  });

  it("links to the vacancy detail page", () => {
    renderCard();
    const link = screen.getByRole("link", { name: /Ver detalle de Profesional Universitario/ });
    expect(link).toHaveAttribute("href", "/vacantes/cov-001");
  });

  it("shows compatibility score bar when score is provided", () => {
    renderCard({ score: 75 });
    expect(screen.getByText("75%")).toBeInTheDocument();
    const scoreBar = screen.getByText("75%").closest("div")?.parentElement;
    expect(scoreBar).not.toBeNull();
  });

  it("does not show score when omitted", () => {
    renderCard();
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("toggles favorite and updates the label", async () => {
    renderCard();
    const favButton = screen.getByRole("button", { name: "Guardar en favoritos" });
    fireEvent.click(favButton);

    expect(
      screen.getByRole("button", { name: "Quitar de favoritos" })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Quitar de favoritos" })
    );
    expect(
      screen.getByRole("button", { name: "Guardar en favoritos" })
    ).toBeInTheDocument();
  });

  it("shows the application status badge when set", () => {
    render(
      <FavoritesProvider>
        <ApplicationsProvider>
          <VacancyCard vacancy={VACANCY} />
        </ApplicationsProvider>
      </FavoritesProvider>
    );
    // no badge initially
    expect(screen.queryByText("Aplicada")).not.toBeInTheDocument();
  });
});