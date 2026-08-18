"use client";

import { Check, X } from "lucide-react";
import {
  APPLICATION_STATUSES,
  useApplications,
  type ApplicationStatus,
} from "@/lib/applications";

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  interesada: {
    label: "Interesada",
    className: "border-border text-muted-foreground",
  },
  aplicada: {
    label: "Aplicada",
    className: "border-primary/60 text-primary bg-primary/5",
  },
  en_proceso: {
    label: "En proceso",
    className: "border-accent text-accent bg-accent/5",
  },
  entrevista: {
    label: "Entrevista",
    className: "border-accent text-accent bg-accent/10",
  },
  nombrada: {
    label: "Nombrada",
    className: "border-primary text-primary bg-primary/10",
  },
  descartada: {
    label: "Descartada",
    className: "border-destructive text-destructive bg-destructive/5",
  },
};

export function StatusStepper({ vacancyId }: { vacancyId: string }) {
  const { getStatus, setStatus, clearStatus } = useApplications();
  const current = getStatus(vacancyId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {APPLICATION_STATUSES.map((status) => {
        const meta = STATUS_META[status];
        const active = current === status;
        return (
          <button
            key={status}
            onClick={() => setStatus(vacancyId, status)}
            aria-pressed={active}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
              active
                ? `${meta.className} shadow-sm`
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {active && <Check className="mr-1 inline h-3 w-3" />}
            {meta.label}
          </button>
        );
      })}
      {current && (
        <button
          onClick={() => clearStatus(vacancyId)}
          aria-label="Quitar estado"
          className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <X className="h-3 w-3" /> Quitar
        </button>
      )}
    </div>
  );
}