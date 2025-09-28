import { ArticleDocument } from "../models/Article";
import { articleRepository } from "../repositories/ArticleRepository";

type ArticleInput = Pick<ArticleDocument, "code" | "name" | "stock" | "unitPrice">;

type ArticleUpdateInput = Partial<Omit<ArticleInput, "code">> & { stock?: number };

export async function createArticle(input: ArticleInput): Promise<ArticleDocument> {
  const existing = await articleRepository.findByCode(input.code);
  if (existing) {
    throw new Error("ARTICLE_EXISTS");
  }

  return articleRepository.create({
    ...input,
    code: input.code.toUpperCase(),
  } as ArticleInput);
}

export async function listArticles(): Promise<ArticleDocument[]> {
  return articleRepository.list();
}

export async function updateArticle(articleId: string, input: ArticleUpdateInput): Promise<ArticleDocument | null> {
  return articleRepository.findByIdAndUpdate(articleId, input as Partial<ArticleDocument>);
}

export async function findArticleByCode(code: string): Promise<ArticleDocument | null> {
  return articleRepository.findByCode(code);
}
