"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Hoy" },
  { href: "/rutinas", label: "Rutinas" },
  { href: "/progreso", label: "Progreso" },
  { href: "/perfil", label: "Perfil" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-[var(--background)]/95 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:border-white/10">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2 text-xs font-medium ${
                  active ? "text-blue-600 dark:text-blue-400" : "text-black/50 dark:text-white/50"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
