import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyDatesCard, countdownText } from "./key-dates-card";
import { buildKeyDatesSnapshot } from "@/domain/key-dates";

const META = {
  fechaFijacion: "2026-03-24",
  inscripcionWindow: {
    label: "07 al 18 de septiembre de 2026",
    start: "2026-09-07",
    end: "2026-09-18",
  },
};

describe("countdownText", () => {
  it("is null outside the alert window", () => {
    const snap = buildKeyDatesSnapshot(
      { ...META, actualDate: "2026-08-18" },
      null
    );
    expect(countdownText(snap)).toBeNull();
  });

  it("alerts X days before the registration close", () => {
    const snap = buildKeyDatesSnapshot(
      { ...META, actualDate: "2026-09-10" },
      null
    );
    expect(countdownText(snap)).toMatch(/Inscripciones ABIERTAS/);
    expect(countdownText(snap)).toMatch(/8 días/);
  });

  it("alerts last-day registration", () => {
    const snap = buildKeyDatesSnapshot(
      { ...META, actualDate: "2026-09-18" },
      null
    );
    expect(countdownText(snap)).toBe("¡Último día de inscripciones!");
  });

  it("alerts when a confirmed stage is within 7 days", () => {
    const snap = buildKeyDatesSnapshot(
      { ...META, actualDate: "2026-09-05", fechaFijacion: "2026-09-01" },
      null
    );
    // window opens 09-07, still closed, but 2 days away
    expect(countdownText(snap)).not.toBeNull();
  });
});

describe("KeyDatesCard", () => {
  it("renders confirmed and pending stages with correct badges", () => {
    render(<KeyDatesCard meta={META} lastUpdated="2026-08-18T00:00:00Z" />);

    expect(screen.getByText("Inscripción en SIMO")).toBeInTheDocument();
    expect(screen.getByText("Verificación de requisitos mínimos")).toBeInTheDocument();
    expect(screen.getByText("Pruebas escritas (aptitudes y conocimientos)")).toBeInTheDocument();
    expect(screen.getByText("Lista de elegibles")).toBeInTheDocument();

    // unpublished stages are labeled "Por confirmar"
    expect(screen.getAllByText("Por confirmar").length).toBeGreaterThanOrEqual(1);
    // the registration window shows its official label range
    expect(screen.getByText(/sept/i)).toBeInTheDocument();
  });

  it("shows the countdown banner during the registration window", () => {
    render(
      <KeyDatesCard
        meta={META}
        lastUpdated={null}
        today="2026-09-10"
      />
    );
    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(/Inscripciones ABIERTAS/);
  });

  it("shows no banner outside the registration window", () => {
    render(
      <KeyDatesCard
        meta={META}
        lastUpdated={null}
        today="2026-08-18"
      />
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});