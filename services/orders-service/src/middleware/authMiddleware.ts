import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface IntrospectedUser {
  id: string;
  role: "user" | "admin";
  email: string;
  name: string;
  status: "inactive" | "active";
}

export interface AuthenticatedRequest extends Request {
  user?: IntrospectedUser;
}

function verifySignature(token: string) {
  try {
    jwt.verify(token, env.authJwtSecret);
  } catch {
    throw new Error("TOKEN_INVALID");
  }
}

// Consulta al auth-service en cada request para garantizar que permisos y estado estén actualizados.
async function fetchPrincipal(token: string): Promise<IntrospectedUser> {
  const fetchImpl: typeof fetch | undefined = (globalThis as any).fetch;

  if (!fetchImpl) {
    throw new Error("FETCH_UNAVAILABLE");
  }

  const response = await fetchImpl(`${env.authServiceUrl}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error("TOKEN_INVALID");
  }

  if (response.status === 403) {
    throw new Error("USER_INACTIVE");
  }

  if (!response.ok) {
    throw new Error("INTROSPECTION_FAILED");
  }

  const payload = await response.json().catch(() => ({}));
  if (!payload.user) {
    throw new Error("TOKEN_INVALID");
  }

  return payload.user as IntrospectedUser;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    verifySignature(token);
    const principal = await fetchPrincipal(token);

    if (principal.status !== "active") {
      return res.status(403).json({ message: "User inactive" });
    }

    req.user = principal;
    next();
  } catch (error) {
    const errorCode = (error as Error).message;

    if (errorCode === "TOKEN_INVALID") {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (errorCode === "USER_INACTIVE") {
      return res.status(403).json({ message: "User inactive" });
    }

    if (errorCode === "FETCH_UNAVAILABLE") {
      return res.status(500).json({ message: "Auth introspection unavailable" });
    }

    console.error("[orders-service] Auth introspection failed", error);
    return res.status(503).json({ message: "Authentication service unavailable" });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
}
