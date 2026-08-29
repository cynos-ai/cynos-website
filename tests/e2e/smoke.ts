import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

async function waitForHealth(port: number, child: ReturnType<typeof spawn>): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('server did not become healthy');
}

const dataDir = await mkdtemp(join(tmpdir(), 'cynos-website-e2e-'));
const port = await availablePort();
const child = spawn(process.execPath, ['dist/server/main.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'production',
    CYNOS_DATA_DIR: dataDir,
    CYNOS_HOST: '127.0.0.1',
    CYNOS_PORT: String(port),
    CYNOS_LOG_LEVEL: 'silent',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stderr = '';
child.stdout?.resume();
child.stderr?.on('data', (chunk: Buffer) => {
  stderr += chunk.toString();
});

try {
  await waitForHealth(port, child);
  const email = `smoke-${Date.now()}@example.test`;
  const password = 'smoke-test-password-123';
  const register = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, displayName: 'Smoke User', password }),
  });
  assert.equal(register.status, 201);
  const cookieHeader = register.headers.get('set-cookie');
  assert.ok(cookieHeader);
  const cookie = cookieHeader.split(';', 1)[0];

  const restored = await fetch(`http://127.0.0.1:${port}/api/auth/status`, { headers: { cookie } });
  assert.equal(restored.status, 200);
  assert.equal((await restored.json()).user.email, email);

  const logout = await fetch(`http://127.0.0.1:${port}/api/auth/logout`, {
    method: 'POST',
    headers: { cookie },
  });
  assert.equal(logout.status, 200);
  const protectedResponse = await fetch(`http://127.0.0.1:${port}/api/me`, { headers: { cookie } });
  assert.equal(protectedResponse.status, 401);
} catch (error) {
  throw new Error(
    `${error instanceof Error ? error.message : String(error)}${stderr ? `\n${stderr}` : ''}`,
  );
} finally {
  if (child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise<void>((resolve) => child.once('exit', () => resolve()));
  }
  await rm(dataDir, { recursive: true, force: true });
}

console.log('cynos website e2e smoke passed');
