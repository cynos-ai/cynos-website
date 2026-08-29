import type Database from 'better-sqlite3';

import type { Migration } from './0000-foundation.js';

export const authMigration: Migration = {
  version: '0001_auth',
  apply(database: Database.Database) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS auth_sessions (
        token_hash TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
        ON auth_sessions (expires_at);
      CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
        ON auth_sessions (user_id);
    `);
  },
};
