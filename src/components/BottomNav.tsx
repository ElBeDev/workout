"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, LineChart, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Hoy", icon: Home },
  { href: "/rutinas", label: "Rutinas", icon: Dumbbell },
  { href: "/progreso", label: "Progreso", icon: LineChart },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

const HIDDEN_ON = ["/login", "/registro"];

export function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-(--background)/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] dark:border-white/10">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-black/40 dark:text-white/40"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.5 : 2}
                  fill={active ? "currentColor" : "none"}
                  fillOpacity={active ? 0.15 : 0}
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
