import { strict as assert } from 'node:assert';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import pino from 'pino';
import { afterEach, describe, it } from 'vitest';

import { createApp } from '../src/server/app.js';
import { loadConfig } from '../src/server/config.js';
import { initializeDatabase } from '../src/server/db/migrate.js';

const cleanup: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (cleanup.length > 0) await cleanup.pop()?.();
});

describe('Cynos account authentication', () => {
  it('registers, restores a session, and logs out', async () => {
    const { app, database } = await makeApp();
    const register = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: '  Test.User@example.com ',
        displayName: '测试用户',
        password: 'a-secure-test-password',
      },
    });
    assert.equal(register.statusCode, 201);
    assert.equal(register.json().user.email, 'test.user@example.com');
    assert.match(register.headers['set-cookie'] ?? '', /HttpOnly/);
    assert.match(register.headers['set-cookie'] ?? '', /SameSite=Strict/);
    assert.equal(register.body.includes('a-secure-test-password'), false);

    const cookie = readCookie(register.headers['set-cookie']);
    const status = await app.inject({
      method: 'GET',
      url: '/api/auth/status',
      headers: { cookie },
    });
    assert.equal(status.statusCode, 200);
    assert.equal(status.json().authenticated, true);
    assert.equal(status.json().user.displayName, '测试用户');

    const hash = database.sqlite.prepare('SELECT password_hash FROM users').get() as {
      password_hash: string;
    };
    assert.match(hash.password_hash, /^\$argon2id\$/);
    assert.equal(hash.password_hash.includes('a-secure-test-password'), false);

    const me = await app.inject({ method: 'GET', url: '/api/me', headers: { cookie } });
    assert.equal(me.statusCode, 200);

    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie },
    });
    assert.equal(logout.statusCode, 200);
    assert.equal(
      (await app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).statusCode,
      401,
    );
  });

  it('rejects duplicates, weak credentials, and a foreign origin', async () => {
    const { app } = await makeApp();
    const payload = {
      email: 'person@example.com',
      displayName: 'Person',
      password: 'long-enough-password',
    };
    assert.equal(
      (await app.inject({ method: 'POST', url: '/api/auth/register', payload })).statusCode,
      201,
    );
    const duplicate = await app.inject({ method: 'POST', url: '/api/auth/register', payload });
    assert.equal(duplicate.statusCode, 409);

    const weak = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { ...payload, email: 'other@example.com', password: 'short' },
    });
    assert.equal(weak.statusCode, 400);
    assert.equal(weak.json().error.code, 'WEAK_PASSWORD');

    const foreign = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'https://evil.example.test' },
      payload: { email: payload.email, password: payload.password },
    });
    assert.equal(foreign.statusCode, 403);
    assert.equal(foreign.json().error.code, 'ORIGIN_FORBIDDEN');
  });

  it('keeps the health endpoint available on an empty database', async () => {
    const { app } = await makeApp();
    const health = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(health.statusCode, 200);
    assert.deepEqual(health.json().service, 'cynos-website');
  });
});

async function makeApp() {
  const dataDir = await mkdtemp(join(tmpdir(), 'cynos-website-test-'));
  cleanup.push(async () => rm(dataDir, { recursive: true, force: true }));
  const config = loadConfig({ NODE_ENV: 'test', CYNOS_DATA_DIR: dataDir });
  const database = initializeDatabase(config);
  const app = await createApp({ config, database, logger: pino({ level: 'silent' }) });
  cleanup.push(async () => app.close());
  return { app, database };
}

function readCookie(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.split(';', 1)[0] ?? '';
}
