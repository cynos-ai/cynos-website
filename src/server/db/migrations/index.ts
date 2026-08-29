import { authMigration } from './0001-auth.js';
import { foundationMigration, type Migration } from './0000-foundation.js';

export type { Migration } from './0000-foundation.js';

export const migrations: Migration[] = [foundationMigration, authMigration];
