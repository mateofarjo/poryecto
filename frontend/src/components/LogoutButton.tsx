"use client";

import { useSession } from "@/context/SessionContext";

interface Props {
  className?: string;
  redirectTo?: string;
}

export function LogoutButton({ className = "", redirectTo = "/login" }: Props) {
  const { logout } = useSession();

  const handleLogout = async () => {
    // Delegate cleanup and navigation to the session context.
    await logout({ redirectTo });
  };

  const baseClasses =
    "rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-rose-500 hover:text-rose-200";
  const mergedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <button type="button" onClick={() => void handleLogout()} className={mergedClasses}>
      Cerrar sesion
    </button>
  );
}
