export interface EnvironmentVariables {
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  REDIS_URL?: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_SECURE?: boolean;
  EMAIL_FROM?: string;
  EMAIL_PROVIDER?: string;
  GOOGLE_CLIENT_ID?: string;
  [key: string]: unknown;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const requiredKeys = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  for (const key of requiredKeys) {
    if (!config[key]) {
      throw new Error(`CRITICAL STARTUP ERROR: Missing required environment variable ${key}`);
    }
  }

  return {
    ...config,
    PORT: Number(config.PORT) || 4000,
    NODE_ENV: (config.NODE_ENV as string) || 'development',
    CORS_ORIGIN: (config.CORS_ORIGIN as string) || '*',
    DATABASE_URL: config.DATABASE_URL as string,
    REDIS_URL: config.REDIS_URL as string,
    JWT_ACCESS_SECRET: config.JWT_ACCESS_SECRET as string,
    JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET as string,
    JWT_ACCESS_EXPIRES_IN: (config.JWT_ACCESS_EXPIRES_IN as string) || '15m',
    JWT_REFRESH_EXPIRES_IN: (config.JWT_REFRESH_EXPIRES_IN as string) || '7d',
    SMTP_HOST: config.SMTP_HOST ? String(config.SMTP_HOST).trim() : undefined,
    SMTP_PORT: config.SMTP_PORT ? Number(config.SMTP_PORT) : undefined,
    SMTP_USER: config.SMTP_USER ? String(config.SMTP_USER).trim() : undefined,
    SMTP_PASS: config.SMTP_PASS ? String(config.SMTP_PASS).trim() : undefined,
    SMTP_SECURE: config.SMTP_SECURE !== undefined ? String(config.SMTP_SECURE) === 'true' : undefined,
    EMAIL_FROM: config.EMAIL_FROM ? String(config.EMAIL_FROM).trim() : undefined,
    EMAIL_PROVIDER: config.EMAIL_PROVIDER ? String(config.EMAIL_PROVIDER).trim() : undefined,
    GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID ? String(config.GOOGLE_CLIENT_ID).trim() : undefined,
  };
}
