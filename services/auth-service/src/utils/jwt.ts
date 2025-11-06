import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthTokenPayload {
  sub: string;
  role: 'user' | 'admin';
  email: string;
  name: string;
}

// Keep short-lived token for API calls while allowing longer refresh tokens.
const ACCESS_TOKEN_TTL: SignOptions['expiresIn'] = '15m';
const REFRESH_TOKEN_TTL: SignOptions['expiresIn'] = env.jwtRefreshTtl as SignOptions['expiresIn'];

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  // Uses a dedicated secret so refresh key rotation does not affect access tokens.
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as AuthTokenPayload;
}
