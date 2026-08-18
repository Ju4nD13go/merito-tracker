import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FavoritesProvider } from "@/lib/favorites";
import { ProfileProvider } from "@/lib/profile";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mérito Tracker — Vacantes concurso Procuraduría 2026",
    template: "%s — Mérito Tracker",
  },
  description:
    "Explora, clasifica y guarda las vacantes del concurso de méritos de la Procuraduría General de la Nación 2026. Compara tu perfil con los requisitos y descarga tus favoritas en Excel.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e5e3f" },
    { media: "(prefers-color-scheme: dark)", color: "#0f110e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <ProfileProvider>
          <FavoritesProvider>
            <Navbar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
              {children}
            </main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
              <p>
                Mérito Tracker — datos oficiales del concurso “Mérito
                Construyendo Excelencia” 2026. Herramienta independiente, no
                afiliada a la Procuraduría General de la Nación.
              </p>
            </footer>
          </FavoritesProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}