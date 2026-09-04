"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WifiOff } from "lucide-react";

const PAGE_CACHE = "pages-v1";

/**
 * Registers the service worker, keeps the current page in the offline
 * cache (client-side navigations never hit the SW's "navigate" branch,
 * so we warm it from here), and shows a banner while offline.
 */
export function Connectivity() {
  const [offline, setOffline] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const id = setTimeout(update, 0);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      clearTimeout(id);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("caches" in window) || !navigator.onLine) return;
    if (pathname === "/login" || pathname === "/registro") return;
    const id = setTimeout(() => {
      caches
        .open(PAGE_CACHE)
        .then((cache) => cache.add(pathname))
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(id);
  }, [pathname]);

  if (!offline) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-70 flex justify-center px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground shadow-[0_8px_24px_rgba(21,21,31,0.25)]">
        <WifiOff className="h-4 w-4" />
        Sin conexión — las series se guardan aquí y se envían al reconectar
      </div>
    </div>
  );
}
