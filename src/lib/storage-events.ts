/**
 * Cross-store event for backup import.
 *
 * All localStorage stores keep an in-memory cache; when ProfileBackup writes
 * many keys at once it dispatches this event so every store invalidates its
 * cache and notifies subscribers (useSyncExternalStore).
 */

export const BACKUP_IMPORTED_EVENT = "merito-tracker:backup-imported";

/** Subscribe a store's listener to the backup event, returning unsubscribe. */
export function subscribeBackupListener(
  listener: () => void
): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(BACKUP_IMPORTED_EVENT, listener);
  return () => window.removeEventListener(BACKUP_IMPORTED_EVENT, listener);
}