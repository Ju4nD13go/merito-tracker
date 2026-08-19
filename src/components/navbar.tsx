"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, Moon, Search, Sun, User } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useTheme } from "@/lib/theme";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vacantes", label: "Vacantes", icon: Search },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/mi-perfil", label: "Mi perfil", icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const { favorites } = useFavorites();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 items-center rounded-md bg-primary px-2 text-sm font-bold text-primary-foreground transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-primary/30 group-active:translate-y-0 group-active:shadow-sm">
            MÉRITO
          </span>
          <span className="hidden sm:inline">Tracker</span>
        </Link>

        <ul className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all ${
                    active
                      ? "font-medium text-primary shadow-sm after:absolute after:-bottom-0.5 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md"
                  } active:translate-y-0.5 active:shadow-sm`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                  {href === "/favoritos" && favorites.length > 0 && (
                    <span
                      key={favorites.length}
                      className="animate-in rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground zoom-in"
                    >
                      {favorites.length}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Cambiar a tema claro"
                  : "Cambiar a tema oscuro"
              }
              title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
              className="relative ml-1 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-muted hover:text-foreground hover:shadow-md active:translate-y-0 active:shadow-sm"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="hidden md:inline">
                {theme === "dark" ? "Claro" : "Oscuro"}
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}