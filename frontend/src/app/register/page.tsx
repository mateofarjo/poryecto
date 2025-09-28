"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z
  .object({
    name: z.string().min(3, { message: "Indicá tu nombre completo" }),
    email: z.string().email({ message: "Ingresá un email válido" }),
    password: z.string().min(8, { message: "Al menos 8 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (formValues: FormValues) => {
    const { confirmPassword: _omitConfirmPassword, ...values } = formValues;
    void _omitConfirmPassword;

    setMessage(null);
    setError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(values),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.message ?? "No se pudo registrar la cuenta");
      return;
    }

    setMessage("¡Listo! Revisá tu email mientras un administrador activa tu cuenta.");
    reset();
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl shadow-indigo-950/20">
        <h1 className="text-3xl font-semibold text-white">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-400">
          Registrate para poder realizar pedidos. Un administrador revisará tu cuenta y la activará antes del primer ingreso.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="name">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="Ej: Martina Rodríguez"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>
            )}
          </div>

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

          <div className="grid gap-4 md:grid-cols-2">
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
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="confirmPassword">
                Repetir contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="********"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Registrando..." : "Registrarme"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          ¿Ya estás registrado? {" "}
          <Link href="/login" className="text-indigo-300 hover:text-indigo-200">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}