import { Types } from "mongoose";
import { UserDocument, UserStatus } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  signAuthToken,
  signRefreshToken,
  verifyRefreshToken,
  AuthTokenPayload,
} from "../utils/jwt";
import { env } from "../config/env";
import { userRepository } from "../repositories/UserRepository";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserDocument["role"];
  status: UserDocument["status"];
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: SessionUser;
}

// Map DB user into token payload to keep issued tokens consistent.
function buildAuthPayload(user: UserDocument): AuthTokenPayload {
  return {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  };
}

function toSessionUser(user: UserDocument): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

// Issue both access and refresh tokens for the consumer.
function buildLoginResult(user: UserDocument): LoginResult {
  const payload = buildAuthPayload(user);

  return {
    token: signAuthToken(payload),
    refreshToken: signRefreshToken(payload),
    user: toSessionUser(user),
  };
}

export async function registerUser({ name, email, password }: RegisterInput): Promise<UserDocument> {
  const passwordHash = await hashPassword(password);
  return userRepository.create({ name, email: email.toLowerCase(), passwordHash });
}

export async function authenticateUser(email: string, password: string): Promise<LoginResult> {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (user.status !== "active") {
    throw new Error("USER_INACTIVE");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return buildLoginResult(user);
}

export async function refreshUserSession(refreshToken: string): Promise<LoginResult> {
  let payload: AuthTokenPayload;

  try {
    // Validate signature and expiry first to avoid unnecessary DB lookups.
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const user = await userRepository.findById(payload.sub);

  if (!user) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  if (user.status !== "active") {
    throw new Error("USER_INACTIVE");
  }

  return buildLoginResult(user);
}

export async function listUsers(status?: UserStatus): Promise<UserDocument[]> {
  return userRepository.list(status);
}

export async function setUserStatus(userId: string, status: UserStatus): Promise<UserDocument | null> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_ID");
  }

  return userRepository.updateStatus(userId, status);
}

export async function ensureAdminUser(): Promise<void> {
  const existingAdmin = await userRepository.findByEmail(env.adminEmail);
  if (existingAdmin) {
    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      existingAdmin.status = "active";
      await existingAdmin.save();
    }
    return;
  }

  const passwordHash = await hashPassword(env.adminPassword);
  await userRepository.create({
    name: env.adminName,
    email: env.adminEmail,
    passwordHash,
    status: "active",
    role: "admin",
  });
}
