import Link from "next/link";
import { getSessionFromCookies } from "@/lib/session";

export default async function HomePage() {
  const session = await getSessionFromCookies();
  const isAuthenticated = Boolean(session);
  const isAdmin = session?.user.role === "admin";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-lg shadow-indigo-900/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-400">UCH-FyD Cloud Portal</p>
            <h1 className="mt-2 text-4xl font-semibold text-white md:text-5xl">
              Gestión unificada de usuarios, artículos y pedidos
            </h1>
          </div>
          <span className="hidden rounded-full border border-indigo-600/40 bg-indigo-500/10 px-4 py-2 text-xs font-medium text-indigo-300 md:inline-flex">
            Cloud Ready
          </span>
        </div>
        <p className="max-w-3xl text-balance text-lg text-slate-300">
          Plataforma web responsiva para que los clientes de UCH-FyD puedan consultar el catálogo, generar pedidos y para que el equipo administrativo administre usuarios de forma segura.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span className="rounded-full border border-slate-700 px-3 py-1">Next.js 15</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Servicios REST Node.js</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">MongoDB</span>
          <span className="rounded-full border border-slate-700 px-3 py-1">Autenticación con JWT</span>
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
                Iniciar sesión
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

      <section className="grid gap-6 md:grid-cols-2">
        <article className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/30 p-6">
          <h2 className="text-xl font-semibold text-white">Arquitectura modular</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Dos microservicios Node.js independientes: uno dedicado a autenticación y otro a catálogo y pedidos. Ambos exponen APIs REST y están listos para desplegarse en infraestructura cloud separada.
          </p>
          <ul className="mt-auto space-y-2 text-sm text-slate-400">
            <li>- Aislamiento de usuarios sobre MongoDB</li>
            <li>- Control de stock con operaciones atómicas</li>
            <li>- JWT reutilizable entre servicios</li>
          </ul>
        </article>
        <article className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/30 p-6">
          <h2 className="text-xl font-semibold text-white">Ciclo de vida del usuario</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Los clientes se registran y quedan en estado inactivo hasta que un administrador apruebe su acceso. Se incorpora un panel administrativo para activar o suspender usuarios.
          </p>
          <ul className="mt-auto space-y-2 text-sm text-slate-400">
            <li>- Registro con validaciones y mensajes claros</li>
            <li>- Activación / suspensión desde un panel protegido</li>
            <li>- Seguimiento auditado por timestamps</li>
          </ul>
        </article>
        <article className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/30 p-6">
          <h2 className="text-xl font-semibold text-white">Experiencia de pedidos</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Los usuarios autenticados visualizan el catálogo disponible, generan pedidos y consultan su historial. El sistema asegura que no existan conflictos de stock en operaciones concurrentes.
          </p>
          <ul className="mt-auto space-y-2 text-sm text-slate-400">
            <li>- Pedidos con cálculo automático de importes</li>
            <li>- Historial filtrado por usuario</li>
            <li>- Notificaciones en tiempo real vía UI</li>
          </ul>
        </article>
        <article className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/30 p-6">
          <h2 className="text-xl font-semibold text-white">Preparada para despliegue cloud</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Configuración mediante variables de entorno y separación de responsabilidades permiten escalar horizontalmente cada servicio según la demanda.
          </p>
          <ul className="mt-auto space-y-2 text-sm text-slate-400">
            <li>- Variables `.env.example` para cada servicio</li>
            <li>- Scripts de build y start diferenciados</li>
            <li>- Sin acoplamiento a Docker: fácil verificación local</li>
          </ul>
        </article>
      </section>
    </main>
  );
}