import { resolve } from 'node:path';

const DEFAULT_VERSION = '0.1.0';

export interface AppConfig {
  environment: 'development' | 'test' | 'production';
  host: string;
  port: number;
  dataDir: string;
  databasePath: string;
  webRoot: string;
  version: string;
  allowedOrigin?: string;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const environmentName = environment.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(environmentName)) {
    throw new ConfigError('NODE_ENV must be development, test, or production');
  }

  const dataDir = readPath(environment.CYNOS_DATA_DIR, './.data');
  const databasePath = readPath(environment.CYNOS_DATABASE_PATH, `${dataDir}/cynos-website.db`);
  const port = Number(environment.CYNOS_PORT ?? 3100);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new ConfigError('CYNOS_PORT must be an integer between 0 and 65535');
  }

  return {
    environment: environmentName as AppConfig['environment'],
    host: environment.CYNOS_HOST ?? '127.0.0.1',
    port,
    dataDir,
    databasePath,
    webRoot: readPath(environment.CYNOS_WEB_ROOT, resolve(process.cwd(), 'dist/web')),
    version: environment.CYNOS_VERSION ?? DEFAULT_VERSION,
    allowedOrigin:
      environment.CYNOS_ALLOWED_ORIGIN && environment.CYNOS_ALLOWED_ORIGIN.trim() !== ''
        ? environment.CYNOS_ALLOWED_ORIGIN.trim()
        : undefined,
  };
}

function readPath(value: string | undefined, fallback: string): string {
  return resolve(value && value.trim() !== '' ? value : fallback);
}
