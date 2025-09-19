import { default as pino, type Logger, stdTimeFunctions } from 'pino';

// Determine log level based on environment
const getLogLevel = () => {
  const logLevel = process.env.LOG_LEVEL;
  if (logLevel) return logLevel;

  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info';
    case 'test':
      return 'error'; // Only log errors during tests to keep output clean
    case 'development':
    default:
      return 'debug';
  }
};

// Use consistent JSON logging across all environments to avoid thread-stream issues.
// We also add base bindings so child loggers inherit app metadata.
const baseConfig = {
  level: getLogLevel(),
  base: { app: 'sparka' },
  timestamp: stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password',
      'headers.authorization',
      'headers.cookie',
      'cookies',
      'token',
      'DATABASE_URL',
      'POSTGRES_URL',
      '*.password',
      '*.token',
      '*.secret',
      '*.DATABASE_URL',
      '*.POSTGRES_URL',
    ],
    remove: false,
  },
};

export const logger: Logger = pino(baseConfig);

export function createModuleLogger(moduleName: string): Logger {
  return logger.child({ module: moduleName });
}
