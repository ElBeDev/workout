"use client";

import { LogOut } from "lucide-react";
import { SecondaryButton } from "@/components/ui";
import { logoutAction } from "@/app/login/actions";

/** Clears offline caches for this device before ending the session. */
export function LogoutButton() {
  async function clearLocal() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("workout:"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith("pages-")).map((k) => caches.delete(k)));
      }
      navigator.serviceWorker?.controller?.postMessage({ type: "purge-pages" });
    } catch {}
  }

  return (
    <form
      action={async () => {
        await clearLocal();
        await logoutAction();
      }}
    >
      <SecondaryButton type="submit" className="w-full text-danger">
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </SecondaryButton>
    </form>
  );
}
