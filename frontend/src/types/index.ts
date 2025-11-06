export type UserRole = "user" | "admin";
export type UserStatus = "active" | "inactive";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Article {
  _id: string;
  code: string;
  name: string;
  stock: number;
  unitPrice: number;
  updatedAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  date: string;
  userName: string;
  userEmail: string;
  customerName: string;
  articleCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt: string;
}

export interface Recommendation {
  article: Article;
  score: number;
  reason: string;
  tags: string[];
}
