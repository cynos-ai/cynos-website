import { createHash, randomBytes, randomUUID } from 'node:crypto';

import argon2 from 'argon2';
import type Database from 'better-sqlite3';

import type { UserProfile } from '../../shared/types.js';

export const SESSION_COOKIE_NAME = 'cynos_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 12;

const MAX_PASSWORD_LENGTH = 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthError extends Error {
  readonly code: 'WEAK_PASSWORD' | 'INVALID_EMAIL' | 'INVALID_NAME';

  constructor(code: AuthError['code'], message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface AuthService {
  register(email: string, displayName: string, password: string): Promise<SessionResult>;
  login(email: string, password: string): Promise<SessionResult | null>;
  authenticate(token: string | undefined): UserProfile | null;
  logout(token: string | undefined): void;
  deleteAccount(token: string | undefined): boolean;
}

export interface SessionResult {
  token: string;
  user: UserProfile;
}

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  created_at: string;
}

interface SessionUserRow extends UserRow {
  token_hash: string;
  expires_at: string;
}

export function normalizeEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new AuthError('INVALID_EMAIL', '请输入有效的邮箱地址');
  }
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 320 || !EMAIL_PATTERN.test(normalized)) {
    throw new AuthError('INVALID_EMAIL', '请输入有效的邮箱地址');
  }
  return normalized;
}

export function validateDisplayName(displayName: unknown): string {
  if (typeof displayName !== 'string') {
    throw new AuthError('INVALID_NAME', '请输入昵称');
  }
  const normalized = displayName.trim();
  if (normalized.length < 1 || normalized.length > 80) {
    throw new AuthError('INVALID_NAME', '昵称长度必须在 1 到 80 个字符之间');
  }
  return normalized;
}

export function validatePassword(password: unknown): asserts password is string {
  if (
    typeof password !== 'string' ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    throw new AuthError(
      'WEAK_PASSWORD',
      `密码长度必须在 ${MIN_PASSWORD_LENGTH} 到 ${MAX_PASSWORD_LENGTH} 个字符之间`,
    );
  }
}

export function createAuthService(database: Database.Database): AuthService {
  return new SqliteAuthService(database);
}

class SqliteAuthService implements AuthService {
  constructor(private readonly database: Database.Database) {}

  async register(email: string, displayName: string, password: string): Promise<SessionResult> {
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = validateDisplayName(displayName);
    validatePassword(password);
    const id = randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    try {
      this.database
        .prepare(
          `INSERT INTO users (id, email, display_name, password_hash, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(id, normalizedEmail, normalizedName, passwordHash, now, now);
    } catch (error: unknown) {
      if (isUniqueConstraint(error)) {
        throw new RegistrationError();
      }
      throw error;
    }

    const user: UserProfile = {
      id,
      email: normalizedEmail,
      displayName: normalizedName,
      createdAt: now,
    };
    return { token: this.createSession(id), user };
  }

  async login(email: string, password: string): Promise<SessionResult | null> {
    const normalizedEmail = normalizeEmail(email);
    if (typeof password !== 'string' || password.length > MAX_PASSWORD_LENGTH) {
      return null;
    }
    const row = this.database
      .prepare(
        'SELECT id, email, display_name, password_hash, created_at FROM users WHERE email = ?',
      )
      .get(normalizedEmail) as UserRow | undefined;
    if (!row) {
      return null;
    }

    let valid = false;
    try {
      valid = await argon2.verify(row.password_hash, password);
    } catch {
      valid = false;
    }
    if (!valid) {
      return null;
    }

    return {
      token: this.createSession(row.id),
      user: toUserProfile(row),
    };
  }

  authenticate(token: string | undefined): UserProfile | null {
    if (!token) {
      return null;
    }
    const now = new Date().toISOString();
    this.database.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(now);
    const row = this.database
      .prepare(
        `SELECT s.token_hash, s.expires_at,
                u.id, u.email, u.display_name, u.password_hash, u.created_at
         FROM auth_sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?`,
      )
      .get(hashToken(token), now) as SessionUserRow | undefined;
    return row ? toUserProfile(row) : null;
  }

  logout(token: string | undefined): void {
    if (token) {
      this.database.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(hashToken(token));
    }
  }

  deleteAccount(token: string | undefined): boolean {
    if (!token) return false;
    const now = new Date().toISOString();
    const session = this.database
      .prepare(
        `SELECT user_id
         FROM auth_sessions
         WHERE token_hash = ? AND expires_at > ?`,
      )
      .get(hashToken(token), now) as { user_id: string } | undefined;
    if (!session) return false;
    return (
      this.database.prepare('DELETE FROM users WHERE id = ?').run(session.user_id).changes === 1
    );
  }

  private createSession(userId: string): string {
    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    this.database
      .prepare(
        `INSERT INTO auth_sessions (token_hash, user_id, created_at, expires_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(hashToken(token), userId, now.toISOString(), expiresAt.toISOString());
    return token;
  }
}

export class RegistrationError extends Error {
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor() {
    super('该邮箱已经注册');
    this.name = 'RegistrationError';
  }
}

function toUserProfile(
  row: Pick<UserRow, 'id' | 'email' | 'display_name' | 'created_at'>,
): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Error && /unique constraint/i.test(error.message);
}

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
