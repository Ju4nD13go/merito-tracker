import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentChecklist } from "./document-checklist";
import { DocumentsProvider, resetDocumentsCacheForTests } from "@/lib/documents";
import type { Vacancy } from "@/domain/contracts";

const BASE: Vacancy = {
  id: "cov-010",
  convocatoriaNo: 1,
  convocatoriaLabel: "Cov 001",
  resolucion: 76,
  versionNo: 1,
  fechaFijacion: null,
  terminoInscripciones: null,
  empleo: {
    denominacion: "Conductor",
    codigoGrado: "OP-2014",
    codigo: null,
    grado: 4,
    nivelJerarquico: "Operativo",
    asignacionBasica: null,
  },
  ubicaciones: {
    plan: null,
    dependency: null,
    proceso: null,
    whereverAssigned: false,
    numeroCargos: 1,
    groups: [],
    sites: [],
  },
  requisitos: {
    estudio: "Licencia de conducción categoría C2",
    experiencia: null,
    tarjetaProfesional: false,
    equivalencias: null,
    documentsNote: null,
  },
  proposito: "Conducir vehículos",
  funciones: [],
  conocimientosEspecificos: [],
  conocimientosComunes: [],
  pruebas: [],
  notasGenerales: null,
  rawNotes: [],
};

function renderChecklist(vacancy: Vacancy = BASE) {
  return render(
    <DocumentsProvider>
      <DocumentChecklist vacancy={vacancy} />
    </DocumentsProvider>
  );
}

describe("DocumentChecklist", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDocumentsCacheForTests();
  });

  it("derives driving licence item from the estudio text", () => {
    renderChecklist();
    expect(screen.getByText("Licencia de conducción")).toBeInTheDocument();
    expect(screen.getByText("Cédula de ciudadanía")).toBeInTheDocument();
    expect(screen.getByText("Inscripción en SIMO")).toBeInTheDocument();
  });

  it("adds tarjeta item when the vacancy requires a professional license", () => {
    const withTarjeta: Vacancy = {
      ...BASE,
      requisitos: {
        ...BASE.requisitos,
        tarjetaProfesional: true,
        estudio: "Título profesional en derecho",
      },
    };
    renderChecklist(withTarjeta);
    expect(screen.getByText("Tarjeta profesional")).toBeInTheDocument();
  });

  it("counts progress and shows complete message", () => {
    renderChecklist();
    const total = screen.getAllByRole("checkbox").length;
    expect(total).toBeGreaterThan(0);
    expect(screen.getByText(`0/${total} listos`)).toBeInTheDocument();

    // Re-query each iteration: after a click the DOM re-renders and
    // previously captured nodes become stale (detached) references.
    for (let i = 0; i < total; i++) {
      fireEvent.click(screen.getAllByRole("checkbox")[i]);
    }
    expect(screen.getByText(`${total}/${total} listos`)).toBeInTheDocument();
    // the paragraph contains an extra sentence, so match a fragment
    expect(
      screen.getByText(/Todo listo para esta vacante/)
    ).toBeInTheDocument();
  });

  it("persists checks in localStorage per vacancy", () => {
    renderChecklist();
    const cedula = screen.getByRole("checkbox", { name: "Cédula de ciudadanía" });
    fireEvent.click(cedula);

    const raw = window.localStorage.getItem("merito-tracker:documents");
    expect(raw).toContain("cov-010");
    expect(raw).toContain("cedula");
  });
});