import { articleRepository } from "../repositories/ArticleRepository";
import { orderRepository } from "../repositories/OrderRepository";
import type { ArticleDocument } from "../models/Article";

const RECOMMENDATIONS_LIMIT = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface ArticleRecommendation {
  article: ArticleDocument;
  score: number;
  reason: string;
  tags: string[];
}

// Returns days elapsed since last order; infinity for never purchased.
function computeDaysSince(date: Date | null | undefined): number {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / DAY_IN_MS);
}

export async function getPersonalizedRecommendations(userEmail: string): Promise<ArticleRecommendation[]> {
  const userStats = await orderRepository.aggregateUserArticleStats(userEmail, RECOMMENDATIONS_LIMIT * 2);

  const recommendations: ArticleRecommendation[] = [];
  const seenCodes = new Set<string>();

  if (userStats.length > 0) {
    const codes = userStats.map((stat) => stat.code);
    const articles = await articleRepository.findByCodes(codes);
    const articleMap = new Map(articles.map((article) => [article.code, article]));

    for (const stat of userStats) {
      const article = articleMap.get(stat.code);
      if (!article) {
        continue;
      }
      const daysSince = computeDaysSince(stat.lastOrderDate);
      const tags: string[] = [];
      let reason = "";

      if (daysSince === Number.POSITIVE_INFINITY) {
        reason = `Lo compraste ${stat.totalQuantity} veces`;
        tags.push("Favorito");
      } else if (daysSince > 45) {
        reason = `Hace ${daysSince} dias que no lo pedis`;
        tags.push("Recordatorio");
      } else if (daysSince <= 14) {
        reason = `Ultima compra hace ${daysSince} dias`;
        tags.push("Recurrente");
      } else {
        reason = `Lo pediste ${stat.totalQuantity} veces`;
      }

      const score = stat.totalQuantity + (daysSince > 45 ? 4 : daysSince <= 14 ? 2 : 0);

      recommendations.push({
        article,
        score,
        reason,
        tags,
      });
      seenCodes.add(article.code);

      if (recommendations.length >= RECOMMENDATIONS_LIMIT) {
        break;
      }
    }
  }

  // Fill remaining slots with popular items while avoiding duplicates.
  if (recommendations.length < RECOMMENDATIONS_LIMIT) {
    const remaining = RECOMMENDATIONS_LIMIT - recommendations.length;
    const globalTop = await orderRepository.aggregateGlobalTopArticles(RECOMMENDATIONS_LIMIT * 2);
    const candidates = globalTop.filter((item) => !seenCodes.has(item.code)).slice(0, remaining);

    if (candidates.length > 0) {
      const articles = await articleRepository.findByCodes(candidates.map((item) => item.code));
      const articleMap = new Map(articles.map((article) => [article.code, article]));

      for (const candidate of candidates) {
        const article = articleMap.get(candidate.code);
        if (!article) continue;
        recommendations.push({
          article,
          score: candidate.totalQuantity,
          reason: "Popular entre otros clientes",
          tags: ["Tendencia"],
        });
        seenCodes.add(article.code);
      }
    }
  }

  // As a last resort expose items from the catalogue to keep list length stable.
  if (recommendations.length < RECOMMENDATIONS_LIMIT) {
    const fallbackArticles = (await articleRepository.list()).filter((article) => !seenCodes.has(article.code));
    for (const article of fallbackArticles) {
      recommendations.push({
        article,
        score: 0,
        reason: "Disponible en el catalogo",
        tags: [],
      });
      seenCodes.add(article.code);
      if (recommendations.length >= RECOMMENDATIONS_LIMIT) {
        break;
      }
    }
  }

  return recommendations.sort((a, b) => b.score - a.score).slice(0, RECOMMENDATIONS_LIMIT);
}
