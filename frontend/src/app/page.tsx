import Link from "next/link";
import { ShieldCheck, UsersRound, Package2, BarChart3 } from "lucide-react";
import { getSessionFromCookies } from "@/lib/session";

const features = [
  {
    icon: UsersRound,
    title: "Usuarios bajo control",
    description: "Alta, activacion y suspension desde un panel sencillo para el equipo interno.",
  },
  {
    icon: Package2,
    title: "Catalogo y pedidos",
    description: "Lista de articulos, stock en tiempo real y pedidos con calculo automatico de importes.",
  },
  {
    icon: ShieldCheck,
    title: "Autenticacion segura",
    description: "Accesos administrados con JWT y sesiones protegidas en cookies httpOnly.",
  },
  {
    icon: BarChart3,
    title: "Indicadores claros",
    description: "Tableros con metricas, historial de pedidos y sugerencias personalizadas.",
  },
];

export default async function HomePage() {
  // Determine default CTA based on current session.
  const session = await getSessionFromCookies();
  const isAuthenticated = Boolean(session);
  const isAdmin = session?.user.role === "admin";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-16 px-6 py-20">
      <header className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-10 shadow-lg shadow-indigo-900/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-400">UCH-FyD</p>
            <h1 className="mt-1 text-4xl font-semibold text-white md:text-5xl">Portal para clientes y administradores</h1>
          </div>
          <span className="rounded-full border border-indigo-600/40 bg-indigo-500/10 px-4 py-1 text-xs font-medium text-indigo-300">
            Version demo
          </span>
        </div>
        <p className="max-w-2xl text-base text-slate-300 md:text-lg">
          La app unifica la gestion de usuarios, catalogo y pedidos. Los clientes cargan compras, el equipo interno
          controla activaciones y stock, y todos ven informacion consistente.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 md:text-sm">
          <span className="rounded-full border border-slate-700 px-3 py-1">Next.js + React 19</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Express + MongoDB</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">JWT Sharing</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Docker Ready</span>
        </div>
        <div className="flex flex-wrap gap-4">
          {isAuthenticated ? (
            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
            >
              Ir al panel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
              >
                Iniciar sesion
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-6 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
                <feature.icon className="h-5 w-5 text-indigo-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
