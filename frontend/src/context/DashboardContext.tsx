"use client";

import { createContext, useContext, useEffect, useMemo, useCallback, useState } from "react";
import type { Article, Order } from "@/types";

type DashboardState = {
  articles: Article[];
  orders: Order[];
  articlesLoading: boolean;
  ordersLoading: boolean;
  refresh: () => Promise<void>;
};

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    setArticlesLoading(true);
    try {
      const response = await fetch("/api/articles", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setArticles(payload.articles ?? []);
      }
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setOrders(payload.orders ?? []);
      }
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadArticles(), loadOrders()]);
  }, [loadArticles, loadOrders]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      articles,
      orders,
      articlesLoading,
      ordersLoading,
      refresh,
    }),
    [articles, orders, articlesLoading, ordersLoading, refresh]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }

  return context;
}
