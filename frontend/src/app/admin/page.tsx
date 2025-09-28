import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import { AdminClient } from "@/components/admin/AdminClient";

export default async function AdminPage() {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-12">
      <AdminClient user={session.user} />
    </main>
  );
}