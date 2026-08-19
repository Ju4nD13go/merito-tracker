"use client";

import { ClipboardCheck } from "lucide-react";
import { deriveDocuments } from "@/domain/documents";
import type { Vacancy } from "@/domain/contracts";
import { useDocuments } from "@/lib/documents";

export function DocumentChecklist({ vacancy }: { vacancy: Vacancy }) {
  const { checkedFor, toggleDoc, resetFor } = useDocuments();
  const items = deriveDocuments(vacancy);
  const checked = checkedFor(vacancy.id);
  const done = items.filter((i) => checked.includes(i.id)).length;
  const complete = items.length > 0 && done === items.length;

  if (items.length === 0) return null;

  return (
    <section className="card-surface animate-in p-6 fade-in slide-in-from-bottom-2 [animation-delay:240ms]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ClipboardCheck className="h-5 w-5 text-primary" /> Checklist de
          documentos
        </h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            complete
              ? "bg-green-500/15 text-green-700 dark:text-green-400"
              : "bg-primary/10 text-primary"
          }`}
        >
          {done}/{items.length} listos
        </span>
      </div>

      {complete && (
        <p className="mb-3 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          ¡Todo listo para esta vacante! Revisa fechas y requisitos antes de
          inscribirte.
        </p>
      )}

      <ul className="space-y-1.5">
        {items.map((item) => {
          const isChecked = checked.includes(item.id);
          return (
            <li key={item.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
                  isChecked
                    ? "border-primary/40 bg-primary/5"
                    : "hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleDoc(vacancy.id, item.id)}
                  className="mt-0.5 rounded border"
                  aria-label={item.label}
                />
                <span>
                  <span
                    className={`font-medium ${isChecked ? "text-primary" : ""}`}
                  >
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="block text-xs text-muted-foreground">
                      {item.hint}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {checked.length > 0 && (
        <button
          type="button"
          onClick={() => resetFor(vacancy.id)}
          className="btn-lift mt-3 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Reiniciar checklist
        </button>
      )}
    </section>
  );
}