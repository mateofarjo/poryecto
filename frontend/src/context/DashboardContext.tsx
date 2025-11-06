"use client";

import { createContext, useContext, useEffect, useMemo, useCallback, useState } from "react";
import type { Article, Order, Recommendation } from "@/types";
import { useSession } from "@/context/SessionContext";

type DashboardState = {
  articles: Article[];
  orders: Order[];
  recommendations: Recommendation[];
  articlesLoading: boolean;
  ordersLoading: boolean;
  recommendationsLoading: boolean;
  refresh: () => Promise<void>;
};

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const { user, logout } = useSession();

  // Fetch catalog data while guarding against unauthenticated usage.
  const loadArticles = useCallback(async () => {
    setArticlesLoading(true);
    try {
      if (!user) {
        setArticles([]);
        return;
      }
      const response = await fetch("/api/articles", { cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        await logout();
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setArticles(payload.articles ?? []);
      }
    } finally {
      setArticlesLoading(false);
    }
  }, [logout, user]);

  // Load recent orders respecting the caller's role.
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      if (!user) {
        setOrders([]);
        return;
      }
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        await logout();
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setOrders(payload.orders ?? []);
      }
    } finally {
      setOrdersLoading(false);
    }
  }, [logout, user]);

  // Retrieve personalized recommendations when there is an active principal.
  const loadRecommendations = useCallback(async () => {
    setRecommendationsLoading(true);
    try {
      if (!user) {
        setRecommendations([]);
        return;
      }
      const response = await fetch("/api/recommendations", { cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        await logout();
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setRecommendations(payload.recommendations ?? []);
      }
    } finally {
      setRecommendationsLoading(false);
    }
  }, [logout, user]);

  const refresh = useCallback(async () => {
    await Promise.all([loadArticles(), loadOrders(), loadRecommendations()]);
  }, [loadArticles, loadOrders, loadRecommendations]);

  useEffect(() => {
    if (!user) {
      setArticles([]);
      setOrders([]);
      setRecommendations([]);
      setArticlesLoading(false);
      setOrdersLoading(false);
      setRecommendationsLoading(false);
      return;
    }
    void refresh();
  }, [user, refresh]);

  const value = useMemo(
    () => ({
      articles,
      orders,
      recommendations,
      articlesLoading,
      ordersLoading,
      recommendationsLoading,
      refresh,
    }),
    [articles, orders, recommendations, articlesLoading, ordersLoading, recommendationsLoading, refresh]
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

