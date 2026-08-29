import type Database from 'better-sqlite3';

import type { AppConfig } from '../config.js';
import { openDatabase, type DatabaseContext } from './client.js';
import { migrations, type Migration } from './migrations/index.js';

export function runMigrations(
  database: Database.Database,
  pendingMigrations: Migration[] = migrations,
): string[] {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    database
      .prepare('SELECT version FROM schema_migrations')
      .all()
      .map((row) => String((row as { version: string }).version)),
  );
  const newlyApplied: string[] = [];
  for (const migration of pendingMigrations) {
    if (applied.has(migration.version)) {
      continue;
    }
    database.transaction(() => {
      migration.apply(database);
      database
        .prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
        .run(migration.version, new Date().toISOString());
    })();
    newlyApplied.push(migration.version);
  }
  return newlyApplied;
}

export function initializeDatabase(config: AppConfig): DatabaseContext {
  const database = openDatabase(config);
  try {
    runMigrations(database.sqlite);
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}
