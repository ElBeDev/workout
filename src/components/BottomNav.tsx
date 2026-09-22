"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Dumbbell, ChartNoAxesColumn, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Hoy", icon: Home },
  { href: "/rutinas", label: "Rutinas", icon: Dumbbell },
  { href: "/progreso", label: "Progreso", icon: ChartNoAxesColumn },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

const HIDDEN_ON = ["/login", "/registro"];

/**
 * Cápsula flotante de vidrio, como la tab bar de iOS 26: se encoge (esconde
 * las etiquetas) al hacer scroll hacia abajo y vuelve al subir.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 8) return;
      setCompact(y > last && y > 80);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <ul
        className={`glass pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full px-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all duration-300 ${
          compact ? "py-1" : "py-1.5"
        }`}
      >
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 transition ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={active ? 2.6 : 2}
                  fill={active ? "currentColor" : "none"}
                  fillOpacity={active ? 0.18 : 0}
                />
                <span
                  className={`overflow-hidden text-[11px] font-semibold leading-none transition-all duration-300 ${
                    compact ? "h-0 opacity-0" : "h-3 opacity-100"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
