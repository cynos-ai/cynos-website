export type ServiceStatus = 'ok' | 'degraded';

export type DatabaseStatus = 'ok' | 'error';

export interface HealthResponse {
  status: ServiceStatus;
  service: 'cynos-website';
  version: string;
  database: DatabaseStatus;
  timestamp: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: UserProfile | null;
}
