import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mérito Tracker — Vacantes concurso Procuraduría 2026",
    short_name: "Mérito Tracker",
    description:
      "Explora, clasifica y guarda las vacantes del concurso de méritos de la Procuraduría General de la Nación 2026.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3ee",
    theme_color: "#1e5e3f",
    lang: "es",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}