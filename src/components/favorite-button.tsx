"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

export function FavoriteButton({ vacancyId }: { vacancyId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(vacancyId);

  return (
    <button
      onClick={() => toggleFavorite(vacancyId)}
      aria-pressed={fav}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        fav
          ? "bg-accent text-accent-foreground"
          : "border hover:bg-muted"
      }`}
    >
      <Heart
        key={fav ? "on" : "off"}
        className={`heart-pop h-4 w-4 ${fav ? "fill-current" : ""}`}
      />
      {fav ? "Guardada" : "Guardar en favoritos"}
    </button>
  );
}