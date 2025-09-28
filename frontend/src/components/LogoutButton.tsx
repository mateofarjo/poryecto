"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";

interface Props {
  className?: string;
  redirectTo?: string;
}

export function LogoutButton({ className = "", redirectTo = "/login" }: Props) {
  const { logout } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className={`rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-rose-500 hover:text-rose-200 ${className}`}
    >
      Cerrar sesión
    </button>
  );
}