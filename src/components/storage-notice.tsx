"use client";

import { useSyncExternalStore } from "react";
import { Info, ShieldCheck, X } from "lucide-react";

/**
 * Privacy / local-storage notice for non-technical users.
 *
 * Two pieces:
 * 1. First-visit modal — shown once, before the user starts working, with
 *    plain-language explanations about where their data lives.
 * 2. Persistent banner — small reminder visible on every page.
 *
 * Both remember their dismissed state in localStorage. State is exposed via
 * useSyncExternalStore (same pattern as the profile/favorites stores) so we
 * never call setState inside an effect.
 */

const MODAL_KEY = "merito-tracker:storage-modal-dismissed";
const BANNER_KEY = "merito-tracker:storage-banner-dismissed";

// --- tiny dual-flag store (module-level cache + listeners) ---
let modalDismissed = false;
let bannerDismissed = false;
let loaded = false;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function load() {
  if (loaded || typeof window === "undefined") return;
  try {
    modalDismissed = window.localStorage.getItem(MODAL_KEY) === "1";
    bannerDismissed = window.localStorage.getItem(BANNER_KEY) === "1";
  } catch {
    // storage unavailable — defaults stay false
  }
  loaded = true;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readModal(): boolean {
  load();
  return modalDismissed;
}

function readBanner(): boolean {
  load();
  return bannerDismissed;
}

/**
 * Server snapshot: treat as dismissed so SSR never renders the notice (no
 * flash for returning visitors). After hydration the client reads
 * localStorage; first-time visitors get `false` here → the modal appears.
 */
function readServerSnapshot(): boolean {
  return true;
}

function dismissModal() {
  modalDismissed = true;
  try {
    window.localStorage.setItem(MODAL_KEY, "1");
  } catch {
    // storage unavailable — keep in-memory state
  }
  notify();
}

function dismissBanner() {
  bannerDismissed = true;
  try {
    window.localStorage.setItem(BANNER_KEY, "1");
  } catch {
    // storage unavailable — keep in-memory state
  }
  notify();
}

export function StorageNotice() {
  const modalDismissed = useSyncExternalStore(subscribe, readModal, readServerSnapshot);
  const bannerDismissed = useSyncExternalStore(subscribe, readBanner, readServerSnapshot);

  const showModal = !modalDismissed;
  const showBanner = !bannerDismissed && !showModal;

  return (
    <>
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="storage-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={dismissModal}
        >
          <div
            className="card-surface w-full max-w-md p-6 animate-in zoom-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 id="storage-modal-title" className="text-lg font-bold">
                  Antes de empezar: ¿dónde se guardan tus datos?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Una cosa importante que debes saber desde ahora:{" "}
                  <strong className="text-foreground">
                    esta página no guarda tus datos en internet.
                  </strong>{" "}
                  Tu perfil, tus favoritas y tus estados de postulación se
                  guardan únicamente{" "}
                  <strong className="text-foreground">
                    en este mismo navegador, en tu propio dispositivo.
                  </strong>{" "}
                  No necesitas cuenta, no pedimos correo y no se comparte nada
                  con nadie.
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 rounded-lg border border-amber-300/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">
              <li className="flex gap-2">
                <span aria-hidden>⚠️</span>
                <span>
                  Si entras desde <strong>otro computador o celular</strong>,
                  no verás tus datos: están en este dispositivo, no en la nube.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>⚠️</span>
                <span>
                  Si <strong>borras los datos del navegador</strong>, tu perfil
                  y tus favoritas se pierden para siempre.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>💡</span>
                <span>
                  Consejo: descarga tu lista de favoritas en{" "}
                  <strong>Excel</strong> (botón en el inicio) para tener un
                  respaldo por fuera.
                </span>
              </li>
            </ul>

            <button
              onClick={dismissModal}
              className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Entendido, ¡a empezar!
            </button>
          </div>
        </div>
      )}

      {showBanner && (
        <div
          role="region"
          aria-label="Aviso sobre dónde se guardan tus datos"
          className="flex items-center justify-between gap-3 border-b border-amber-300/40 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
        >
          <p className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>
              Tus datos (perfil, favoritas, postulaciones) se guardan{" "}
              <strong>solo en este navegador</strong> — no se suben a internet
              ni se comparten.
            </span>
          </p>
          <button
            onClick={dismissBanner}
            aria-label="Cerrar aviso"
            className="shrink-0 rounded p-0.5 text-amber-700 hover:bg-amber-200/60 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}