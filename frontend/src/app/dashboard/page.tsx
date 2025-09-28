import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { DashboardProvider } from "@/context/DashboardContext";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardPage() {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  if (session.user.status !== "active") {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-8 text-center text-amber-100">
          <h1 className="text-2xl font-semibold text-amber-100">Tu cuenta esta pendiente</h1>
          <p className="mt-4 text-sm text-amber-100/80">
            Un administrador debe activar tu usuario antes de que puedas operar en el sistema. Te avisaremos por correo cuando el estado cambie.
          </p>
          <LogoutButton className="mt-6 inline-flex items-center justify-center" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <DashboardProvider>
        <DashboardClient user={session.user} />
      </DashboardProvider>
    </main>
  );
}





