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
    PORT: Number(config.PORT) || 4000,
    NODE_ENV: (config.NODE_ENV as string) || 'development',
    CORS_ORIGIN: (config.CORS_ORIGIN as string) || '*',
    DATABASE_URL: config.DATABASE_URL as string,
    REDIS_URL: config.REDIS_URL as string,
    JWT_ACCESS_SECRET: config.JWT_ACCESS_SECRET as string,
    JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET as string,
    JWT_ACCESS_EXPIRES_IN: (config.JWT_ACCESS_EXPIRES_IN as string) || '15m',
    JWT_REFRESH_EXPIRES_IN: (config.JWT_REFRESH_EXPIRES_IN as string) || '7d',
  };
}
