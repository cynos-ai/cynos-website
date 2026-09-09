import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pino from 'pino';
import { afterEach, describe, it } from 'vitest';
import { createApp } from '../src/server/app.js';
import { loadConfig } from '../src/server/config.js';
import { initializeDatabase } from '../src/server/db/migrate.js';

const RUN = '01K00000000000000000000000';
const OTHER = '01K00000000000000000000001';
const TOKEN = 'synthetic-cleanup-token-12345678901234567890';
const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (cleanup.length) await cleanup.pop()!();
});

async function fixture(enabled = true) {
  const dir = await mkdtemp(join(tmpdir(), 'website-cleanup-'));
  const config = loadConfig({
    NODE_ENV: 'test',
    CYNOS_DATA_DIR: dir,
    ...(enabled ? { CYNOS_TEST_DATA_CLEANUP_TOKEN: TOKEN } : {}),
  });
  const database = initializeDatabase(config);
  const app = await createApp({ config, database, logger: pino({ level: 'silent' }) });
  cleanup.push(async () => {
    await app.close();
    database.sqlite.close();
    await rm(dir, { recursive: true, force: true });
  });
  const seed = (id: string, email: string, name: string) => {
    database.sqlite
      .prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, email, name, 'synthetic-unused-hash', 'now', 'now');
    database.sqlite
      .prepare('INSERT INTO auth_sessions VALUES (?, ?, ?, ?)')
      .run('session-' + id, id, 'now', 'later');
  };
  return { app, database, seed };
}

describe('opt-in Run-scoped test data cleanup', () => {
  it('is disabled by default and rejects weak deployment credentials', async () => {
    const { app } = await fixture(false);
    assert.equal(
      (await app.inject({ method: 'DELETE', url: `/api/luowang/test-data/${RUN}` })).statusCode,
      404,
    );
    assert.throws(() => loadConfig({ CYNOS_TEST_DATA_CLEANUP_TOKEN: 'short' }));
  });
  it('requires authorization and a valid full Run ID without mutating users', async () => {
    const { app, database, seed } = await fixture();
    seed('one', `luowang-${RUN.toLowerCase()}-one@example.test`, 'one');
    assert.equal(
      (await app.inject({ method: 'DELETE', url: `/api/luowang/test-data/${RUN}` })).statusCode,
      401,
    );
    assert.equal(
      (
        await app.inject({
          method: 'DELETE',
          url: '/api/luowang/test-data/all',
          headers: { authorization: `Bearer ${TOKEN}` },
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (database.sqlite.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n,
      1,
    );
  });
  it('deletes only exact Run-marked users and cascading sessions; GET independently confirms absence', async () => {
    const { app, database, seed } = await fixture();
    seed('email', `luowang-${RUN.toLowerCase()}-email@example.test`, 'email');
    seed('name', 'name@example.test', `luowang-${RUN}-name`);
    seed('other', `luowang-${OTHER.toLowerCase()}-other@example.test`, 'other');
    seed('lookalike', `luowang-${RUN.toLowerCase()}x@example.test`, 'unmarked');
    const call = (method: 'GET' | 'DELETE') =>
      app.inject({
        method,
        url: `/api/luowang/test-data/${RUN}`,
        headers: { authorization: `Bearer ${TOKEN}` },
      });
    assert.equal((await call('GET')).json().remaining, 2);
    const deleted = await call('DELETE');
    assert.deepEqual(deleted.json(), { runId: RUN, deleted: 2, remaining: 0 });
    assert.equal(deleted.body.includes(TOKEN), false);
    assert.equal((await call('GET')).json().remaining, 0);
    assert.equal((await call('DELETE')).json().deleted, 0);
    assert.equal(
      (database.sqlite.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n,
      2,
    );
    assert.equal(
      (database.sqlite.prepare('SELECT COUNT(*) AS n FROM auth_sessions').get() as { n: number }).n,
      2,
    );
  });
});
