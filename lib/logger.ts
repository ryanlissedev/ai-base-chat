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

// Prefer JSON in production; pretty in development.
// We also add base bindings so child loggers inherit app metadata.
export const logger: Logger =
  process.env.NODE_ENV === 'production'
    ? pino({
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
      })
    : process.env.NODE_ENV === 'test'
    ? pino({
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
      })
    : pino({
        level: getLogLevel(),
        base: { app: 'sparka' },
        timestamp: stdTimeFunctions.isoTime,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
      });

export function createModuleLogger(moduleName: string): Logger {
  return logger.child({ module: moduleName });
}
