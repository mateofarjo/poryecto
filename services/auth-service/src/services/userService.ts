import { Types } from "mongoose";
import { UserDocument, UserStatus } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAuthToken, AuthTokenPayload } from "../utils/jwt";
import { env } from "../config/env";
import { userRepository } from "../repositories/UserRepository";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginResult {
  token: string;
  user: Pick<UserDocument, "id" | "name" | "email" | "role" | "status">;
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

  const payload: AuthTokenPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  };

  const token = signAuthToken(payload);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
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
