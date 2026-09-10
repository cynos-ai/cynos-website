import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FastifyInstance, RawServerDefault } from 'fastify';
import type { Logger } from 'pino';
import type { DatabaseContext } from './db/client.js';

const RUN_ID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/** Dedicated non-production integration. Disabled without an explicit deployment token. */
export function registerTestDataCleanup(
  app: FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse, Logger>,
  database: DatabaseContext,
  token: string,
) {
  const expected = createHash('sha256').update(`Bearer ${token}`).digest();
  const count = database.sqlite.prepare(
    'SELECT COUNT(*) AS remaining FROM users WHERE lower(email) LIKE ? OR lower(display_name) LIKE ?',
  );
  const remove = database.sqlite.prepare(
    'DELETE FROM users WHERE lower(email) LIKE ? OR lower(display_name) LIKE ?',
  );
  for (const method of ['GET', 'DELETE'] as const) {
    app.route<{ Params: { runId: string } }>({
      method,
      url: '/api/luowang/test-data/:runId',
      handler: async (request, reply) => {
        const supplied = createHash('sha256')
          .update(request.headers.authorization ?? '')
          .digest();
        if (!timingSafeEqual(expected, supplied))
          return reply.code(401).send({ error: 'UNAUTHORIZED' });
        const { runId } = request.params;
        if (!RUN_ID.test(runId)) return reply.code(400).send({ error: 'INVALID_RUN_ID' });
        // The validated ULID contains no SQL LIKE metacharacters; the trailing delimiter is required.
        const pattern = `luowang-${runId.toLowerCase()}-%`;
        const result = database.sqlite.transaction(() => {
          const deleted = method === 'DELETE' ? remove.run(pattern, pattern).changes : 0;
          const { remaining } = count.get(pattern, pattern) as { remaining: number };
          return { runId, deleted, remaining };
        })();
        return reply.header('cache-control', 'no-store').send(result);
      },
    });
  }
}
