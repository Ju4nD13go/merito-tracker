import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatusStepper } from "./status-stepper";
import { ApplicationsProvider } from "@/lib/applications";

function renderStepper(vacancyId = "cov-001") {
  return render(
    <ApplicationsProvider>
      <StatusStepper vacancyId={vacancyId} />
    </ApplicationsProvider>
  );
}

describe("StatusStepper", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders all application statuses", () => {
    renderStepper();
    expect(screen.getByRole("button", { name: /Interesada/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aplicada/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrevista/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nombrada/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Descartada/ })).toBeInTheDocument();
  });

  it("marks the selected status as pressed and shows the check", () => {
    renderStepper();
    const aplicada = screen.getByRole("button", { name: /Aplicada/ });
    fireEvent.click(aplicada);
    expect(aplicada).toHaveAttribute("aria-pressed", "true");
  });

  it("switches status and persists via the store", () => {
    renderStepper("cov-009");
    fireEvent.click(screen.getByRole("button", { name: /Entrevista/ }));
    expect(
      screen.getByRole("button", { name: /Entrevista/ })
    ).toHaveAttribute("aria-pressed", "true");

    // persisted in localStorage
    const raw = window.localStorage.getItem("merito-tracker:applications");
    expect(raw).toContain("cov-009");
    expect(raw).toContain("entrevista");
  });

  it("clears the status and removes the Quitar control", () => {
    renderStepper();
    fireEvent.click(screen.getByRole("button", { name: /Aplicada/ }));
    const quitar = screen.getByRole("button", { name: "Quitar estado" });
    expect(quitar).toBeInTheDocument();

    fireEvent.click(quitar);
    expect(screen.queryByRole("button", { name: "Quitar estado" })).toBeNull();
  });
});