"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";

const schema = z.object({
  email: z.string().email({ message: "Ingresá un email válido" }),
  password: z.string().min(8, { message: "Al menos 8 caracteres" }),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.message ?? "No se pudo iniciar sesión");
      return;
    }

    await refresh();
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl shadow-indigo-950/20">
        <h1 className="text-3xl font-semibold text-white">Bienvenido</h1>
        <p className="mt-2 text-sm text-slate-400">
          Ingresá con tu email y contraseña. Si todavía no tenés cuenta podés registrarte y un administrador la activará.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="cliente@uchfyd.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="********"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿No tenés cuenta? {" "}
          <Link href="/register" className="text-indigo-300 hover:text-indigo-200">
            Registrate acá
          </Link>
        </p>
      </div>
    </main>
  );
}