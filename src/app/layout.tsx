import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FavoritesProvider } from "@/lib/favorites";
import { ProfileProvider } from "@/lib/profile";
import { ApplicationsProvider } from "@/lib/applications";
import { Navbar } from "@/components/navbar";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { StorageNotice } from "@/components/storage-notice";

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
      <head>
        {/* Apply persisted theme before first paint to avoid a flash of
            the wrong theme (FOUC). Keep in sync with src/lib/theme.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=window.localStorage.getItem("merito-tracker:theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <ServiceWorkerRegister />
        <ProfileProvider>
          <ApplicationsProvider>
            <FavoritesProvider>
              <StorageNotice />
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
          </ApplicationsProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}