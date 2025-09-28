"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Combobox } from "@headlessui/react";
import { Package2, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import type { SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/LogoutButton";

interface Props {
  user: SessionUser;
}

type QuickOrderFormValues = {
  articleCode: string;
  customerName: string;
  quantity: number;
};

type StatsCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
};

function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg shadow-indigo-950/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-200">
          {icon}
        </div>
      </div>
      {subtitle ? <p className="mt-4 text-xs text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/30 text-sm text-slate-400">
      {message}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-3xl border border-slate-800 bg-slate-900/30", className)} />;
}

function OrdersChart({ data }: { data: Array<{ date: string; total: number }> }) {
  if (data.length === 0) {
    return <EmptyState message="Todavia no hay pedidos registrados." />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b" }}
            cursor={{ stroke: "#334155", strokeWidth: 1 }}
          />
          <Area type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={3} fill="url(#ordersGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PopularArticles({ articles }: { articles: Array<{ name: string; total: number; units: number }> }) {
  if (articles.length === 0) {
    return <EmptyState message="Aun no hay articulos con pedidos." />;
  }

  return (
    <div className="space-y-3">
      {articles.slice(0, 5).map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm"
        >
          <div>
            <p className="font-medium text-slate-100">{item.name}</p>
            <p className="text-xs text-slate-400">{item.units} unidades · {item.total.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

export function DashboardClient({ user }: Props) {
  const { articles, orders, articlesLoading, ordersLoading, refresh } = useDashboard();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<QuickOrderFormValues>({
    defaultValues: {
      articleCode: "",
      customerName: "",
      quantity: 1,
    },
  });

  const selectedCode = watch("articleCode");
  const quantity = watch("quantity") || 1;
  const selectedArticle = useMemo(() => articles.find((article) => article.code === selectedCode) ?? null, [articles, selectedCode]);
  const isRefreshing = articlesLoading || ordersLoading;

  const quickOrderSubmit = async (values: QuickOrderFormValues) => {
    if (!values.articleCode) {
      toast.error("Selecciona un articulo");
      return;
    }

    if (!values.customerName.trim()) {
      toast.error("Ingresa el nombre del cliente");
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: values.customerName.trim(),
          articleCode: values.articleCode,
          quantity: Number(values.quantity),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload.message ?? "No se pudo generar el pedido");
        return;
      }

      toast.success("Pedido registrado correctamente");
      reset({ articleCode: "", customerName: "", quantity: 1 });
      await refresh();
    } catch (error) {
      toast.error("Ocurrio un error inesperado");
      console.error(error);
    }
  };

  const totalOrders = orders.length;
  const totalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const totalUnitsSold = orders.reduce((acc, order) => acc + order.quantity, 0);
  const availableStock = articles.reduce((acc, article) => acc + article.stock, 0);

  const ordersChartData = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((order) => {
      const date = new Date(order.date ?? order.createdAt ?? Date.now());
      const key = date.toLocaleDateString("es-AR");
      map.set(key, (map.get(key) ?? 0) + order.totalAmount);
    });

    return Array.from(map.entries())
      .map(([date, total]) => ({ date, total: Number(total.toFixed(2)) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [orders]);

  const popularArticles = useMemo(() => {
    const aggregate = new Map<string, { name: string; total: number; units: number }>();

    orders.forEach((order) => {
      const targetArticle = articles.find((item) => item.code === order.articleCode);
      const key = targetArticle?.name ?? order.articleCode;
      const current = aggregate.get(key) ?? { name: key, total: 0, units: 0 };
      current.total += order.totalAmount;
      current.units += order.quantity;
      aggregate.set(key, current);
    });

    return Array.from(aggregate.values()).sort((a, b) => b.total - a.total);
  }, [orders, articles]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.date ?? b.createdAt ?? 0).getTime() - new Date(a.date ?? a.createdAt ?? 0).getTime())
      .slice(0, 6);
  }, [orders]);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Panel de pedidos</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Hola {user.name.split(" ")[0]}, bienvenido!</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              Estado: {user.status === "active" ? "Activo" : "Inactivo"}
            </span>
            <LogoutButton />
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Consulta metricas en tiempo real, genera pedidos rapidos y visualiza tu historial reciente.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Pedidos" value={`${totalOrders}`} subtitle="Total registrados" icon={<ShoppingCart className="h-5 w-5" />} />
        <StatsCard title="Facturado" value={formatCurrency(totalAmount)} subtitle="Importe total" icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Stock disponible" value={`${availableStock}`} subtitle="Unidades sumadas" icon={<Package2 className="h-5 w-5" />} />
        <StatsCard title="Unidades vendidas" value={`${totalUnitsSold}`} subtitle="Acumulado historico" icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Evolucion de ventas</h2>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => void refresh()}
              className="text-xs text-indigo-300 transition hover:text-indigo-100 disabled:opacity-60"
            >
              {isRefreshing ? "Actualizando..." : "Actualizar datos"}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">Importe total de pedidos por fecha.</p>
          {ordersLoading ? <SkeletonCard className="mt-6 h-64" /> : <OrdersChart data={ordersChartData} />}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6">
          <h2 className="text-xl font-semibold text-white">Articulos destacados</h2>
          <p className="mt-1 text-xs text-slate-500">Basado en unidades vendidas.</p>
          {ordersLoading ? <SkeletonCard className="mt-6 h-64" /> : <PopularArticles articles={popularArticles} />}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Mis pedidos</h2>
            <span className="text-xs text-slate-400">{orders.length} registros</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Listado de tus ultimas operaciones.</p>
          <div className="mt-4 space-y-3">
            {ordersLoading ? (
              <>
                <SkeletonCard className="h-20" />
                <SkeletonCard className="h-20" />
                <SkeletonCard className="h-20" />
              </>
            ) : recentOrders.length === 0 ? (
              <EmptyState message="Todavia no registraste pedidos." />
            ) : (
              recentOrders.map((order) => (
                <article
                  key={order._id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-100">{order.orderNumber}</p>
                    <p className="text-xs text-slate-400">{new Date(order.date ?? order.createdAt ?? Date.now()).toLocaleString("es-AR")}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
                    <span>Cliente: {order.customerName}</span>
                    <span>Articulo: {order.articleCode}</span>
                    <span>Cantidad: {order.quantity}</span>
                    <span>Importe: {formatCurrency(order.totalAmount)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="h-fit rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-white">Nuevo pedido</h2>
          <p className="mt-1 text-xs text-slate-500">Carga rapida con busqueda de articulos.</p>

          <form className="mt-4 space-y-5" onSubmit={handleSubmit(quickOrderSubmit)}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Articulo</label>
              <Controller
                name="articleCode"
                control={control}
                render={({ field }) => (
                  <Combobox value={field.value} onChange={field.onChange} disabled={articlesLoading}>
                    <div className="relative">
                      <Combobox.Input
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
                        displayValue={(code: string) => articles.find((item) => item.code === code)?.name ?? ""}
                        placeholder="Buscar articulo..."
                      />
                      <Combobox.Options className="absolute z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/90 text-sm shadow-xl shadow-indigo-950/30">
                        {articlesLoading ? (
                          <div className="px-4 py-3 text-slate-400">Cargando articulos...</div>
                        ) : articles.length === 0 ? (
                          <div className="px-4 py-3 text-slate-400">No hay articulos cargados.</div>
                        ) : (
                          articles.map((article) => (
                            <Combobox.Option
                              key={article._id}
                              value={article.code}
                              className={({ active }) =>
                                cn(
                                  "flex items-center justify-between px-4 py-3 transition",
                                  active ? "bg-indigo-500/10 text-indigo-100" : "text-slate-200"
                                )
                              }
                            >
                              <div>
                                <p className="font-medium">{article.name}</p>
                                <p className="text-xs text-slate-400">{article.code}</p>
                              </div>
                              <p className="text-xs text-slate-300">Stock: {article.stock}</p>
                            </Combobox.Option>
                          ))
                        )}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300" htmlFor="customerName">
                Nombre del cliente
              </label>
              <Controller
                name="customerName"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="customerName"
                    placeholder="Ej: Drogueria Central"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300" htmlFor="quantity">
                Cantidad
              </label>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    id="quantity"
                    type="number"
                    min={1}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  />
                )}
              />
              {selectedArticle ? (
                <p className="text-xs text-slate-400">
                  Stock disponible: {selectedArticle.stock} · Precio unitario: {formatCurrency(selectedArticle.unitPrice)}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Selecciona un articulo para ver el stock disponible.</p>
              )}
            </div>

            {selectedArticle ? (
              <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-xs text-indigo-200">
                Total estimado: {formatCurrency(selectedArticle.unitPrice * Number(quantity))}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || articlesLoading}
              className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Registrando pedido..." : "Confirmar pedido"}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}



