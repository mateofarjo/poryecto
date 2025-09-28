"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import toast from "react-hot-toast";
import { Package2, PlusCircle, Search, UserCheck, UserPlus, UsersRound } from "lucide-react";
import type { SessionUser } from "@/lib/session";
import type { ApiUser, Article } from "@/types";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";

type Alert = { type: "success" | "error"; message: string } | null;

type ApiUserWithMongoId = ApiUser & { _id?: string; created_at?: string; updated_at?: string };

type UserFilter = "all" | "active" | "inactive";

type StatsCardProps = {
  title: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
  tone?: "default" | "green" | "amber";
};

interface Props {
  user: SessionUser;
}

function normalizeUsers(users: ApiUserWithMongoId[]): ApiUser[] {
  return users.map((user) => ({
    ...user,
    id: user.id ?? user._id ?? "",
    createdAt: user.createdAt ?? user.created_at,
    updatedAt: user.updatedAt ?? user.updated_at,
  }));
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function StatsCard({ title, value, caption, icon, tone = "default" }: StatsCardProps) {
  const toneClasses =
    tone === "green"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : tone === "amber"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
      : "border-indigo-500/40 bg-indigo-500/10 text-indigo-200";

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg shadow-indigo-950/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-xs text-slate-400">{caption}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", toneClasses)}>{icon}</div>
      </div>
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-3xl border border-slate-800 bg-slate-900/30", className)} />;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/30 text-sm text-slate-400">
      {message}
    </div>
  );
}

const initialArticleForm = {
  code: "",
  name: "",
  stock: "",
  unitPrice: "",
};

export function AdminClient({ user }: Props) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<Alert>(null);
  const [statusFilter, setStatusFilter] = useState<UserFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [articleForm, setArticleForm] = useState(initialArticleForm);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);

  // Carga inicial de usuarios y artículos para mantener ambos paneles sincronizados.
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, articlesRes] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/articles", { cache: "no-store" }),
      ]);

      const usersPayload = await usersRes.json().catch(() => ({ users: [] }));
      const articlesPayload = await articlesRes.json().catch(() => ({ articles: [] }));

      if (usersRes.ok) {
        const normalized = normalizeUsers((usersPayload.users ?? []) as ApiUserWithMongoId[]);
        setUsers(normalized);
      }
      if (articlesRes.ok) {
        setArticles(articlesPayload.articles ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Maneja la activación/suspensión de usuarios aplicando feedback en pantalla.
  const handleToggleUser = useCallback(
    async (userId: string, status: "active" | "inactive") => {
      if (!userId) {
        setAlert({ type: "error", message: "Falta el identificador de usuario" });
        return;
      }

      const endpoint = status === "active" ? "deactivate" : "activate";
      const response = await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: "PATCH",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = payload.message ?? "No se pudo actualizar el usuario";
        setAlert({ type: "error", message });
        toast.error(message);
        return;
      }

      toast.success(status === "active" ? "Usuario suspendido" : "Usuario activado");
      setAlert({ type: "success", message: "Usuario actualizado correctamente" });
      await loadData();
    },
    [loadData]
  );

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesQuery =
        query.length === 0 || [item.name, item.email].some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [users, statusFilter, searchTerm]);

  const columnHelper = createColumnHelper<ApiUser>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nombre",
        cell: (info) => (
          <div>
            <p className="font-medium text-slate-100">{info.getValue()}</p>
            <p className="text-xs text-slate-400">{info.row.original.email}</p>
          </div>
        ),
      }),
      columnHelper.accessor("role", {
        header: "Rol",
        cell: (info) => (info.getValue() === "admin" ? "Administrador" : "Cliente"),
      }),
      columnHelper.accessor("status", {
        header: "Estado",
        cell: (info) => (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              info.getValue() === "active"
                ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border border-amber-500/40 bg-amber-500/10 text-amber-200"
            )}
          >
            {info.getValue() === "active" ? "Activo" : "Inactivo"}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.createdAt ?? "", {
        id: "createdAt",
        header: "Alta",
        cell: (info) => <span className="text-xs text-slate-400">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: (info) => {
          const rowUser = info.row.original;
          if (rowUser.role === "admin") {
            return null;
          }

          return (
            <button
              onClick={() => void handleToggleUser(rowUser.id, rowUser.status)}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-indigo-400 hover:text-indigo-200"
            >
              {rowUser.status === "active" ? "Suspender" : "Activar"}
            </button>
          );
        },
      }),
    ],
    [columnHelper, handleToggleUser]
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const pendingUsers = users.filter((u) => u.status === "inactive").length;
  const lowStockArticles = articles.filter((article) => article.stock <= 5).length;
  const sortedArticles = useMemo(
    () => [...articles].sort((a, b) => a.code.localeCompare(b.code)),
    [articles]
  );

  const handleCreateArticle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = articleForm.code.trim().toUpperCase();
    const trimmedName = articleForm.name.trim();
    const parsedStock = Number(articleForm.stock);
    const parsedUnitPrice = Number(articleForm.unitPrice);

    if (!trimmedCode || !trimmedName) {
      setAlert({ type: "error", message: "Completá el código y el nombre del artículo" });
      return;
    }

    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setAlert({ type: "error", message: "El stock debe ser un número mayor o igual a 0" });
      return;
    }

    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      setAlert({ type: "error", message: "El precio debe ser un número mayor o igual a 0" });
      return;
    }

    setIsCreatingArticle(true);
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        body: JSON.stringify({
          code: trimmedCode,
          name: trimmedName,
          stock: parsedStock,
          unitPrice: parsedUnitPrice,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = payload.message ?? "No se pudo crear el artículo";
        setAlert({ type: "error", message });
        toast.error(message);
        return;
      }

      toast.success("Artículo creado correctamente");
      setAlert({ type: "success", message: "Artículo agregado al catálogo" });
      setArticleForm(initialArticleForm);
      await loadData();
    } finally {
      setIsCreatingArticle(false);
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-indigo-500/40 bg-indigo-500/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Panel administrativo</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Hola {user.name},</h1>
            <p className="text-sm text-indigo-100/80">
              Controla usuarios, catalogo y pedidos desde un unico lugar.
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {alert && (
        <div
          className={cn(
            "rounded-3xl border px-4 py-3 text-sm",
            alert.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          )}
        >
          {alert.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Usuarios"
          value={`${totalUsers}`}
          caption="Total registrados"
          icon={<UsersRound className="h-5 w-5" />}
        />
        <StatsCard
          title="Activos"
          value={`${activeUsers}`}
          caption="Con acceso habilitado"
          icon={<UserCheck className="h-5 w-5" />}
          tone="green"
        />
        <StatsCard
          title="Pendientes"
          value={`${pendingUsers}`}
          caption="Requieren aprobacion"
          icon={<UserPlus className="h-5 w-5" />}
          tone="amber"
        />
        <StatsCard
          title="Articulos con bajo stock"
          value={`${lowStockArticles}`}
          caption="<= 5 unidades disponibles"
          icon={<Package2 className="h-5 w-5" />}
        />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Usuarios registrados</h2>
            <p className="text-xs text-slate-500">Filtra por estado o busca por nombre/email.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar usuario"
                className="w-48 rounded-full border border-slate-700 bg-slate-950/60 px-9 py-2 text-xs text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as UserFilter)}
              className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          {loading ? (
            <div className="space-y-2 p-4">
              <SkeletonCard className="h-16" />
              <SkeletonCard className="h-16" />
              <SkeletonCard className="h-16" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState message="No se encontraron usuarios para los filtros aplicados." />
          ) : (
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-slate-200">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
        <form
          className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
          onSubmit={handleCreateArticle}
        >
          <div className="flex items-center gap-3">
            <PlusCircle className="h-5 w-5 text-indigo-300" />
            <div>
              <h2 className="text-xl font-semibold text-white">Agregar artículo</h2>
              <p className="text-xs text-slate-500">Publicá nuevos productos en el catálogo.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300" htmlFor="article-code">
                Código
              </label>
              <input
                id="article-code"
                value={articleForm.code}
                onChange={(event) =>
                  setArticleForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                }
                placeholder="Ej: A100"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300" htmlFor="article-name">
                Nombre
              </label>
              <input
                id="article-name"
                value={articleForm.name}
                onChange={(event) => setArticleForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ej: Nebulizador Plus"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300" htmlFor="article-stock">
                  Stock inicial
                </label>
                <input
                  id="article-stock"
                  type="number"
                  min={0}
                  value={articleForm.stock}
                  onChange={(event) => setArticleForm((prev) => ({ ...prev, stock: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300" htmlFor="article-price">
                  Precio unitario
                </label>
                <input
                  id="article-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={articleForm.unitPrice}
                  onChange={(event) => setArticleForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreatingArticle}
            className="mt-6 w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingArticle ? "Guardando artículo..." : "Crear artículo"}
          </button>
        </form>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Catálogo disponible</h2>
              <p className="text-xs text-slate-500">Artículos activos para los clientes.</p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              {sortedArticles.length} artículos
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
            {loading ? (
              <div className="space-y-2 p-4">
                <SkeletonCard className="h-16" />
                <SkeletonCard className="h-16" />
              </div>
            ) : sortedArticles.length === 0 ? (
              <EmptyState message="Todavía no hay artículos cargados." />
            ) : (
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                  {sortedArticles.map((article) => (
                    <tr key={article._id}>
                      <td className="px-4 py-3 text-slate-200">{article.code}</td>
                      <td className="px-4 py-3 text-slate-200">{article.name}</td>
                      <td className="px-4 py-3 text-slate-200">{article.stock}</td>
                      <td className="px-4 py-3 text-slate-200">
                        {article.unitPrice.toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
