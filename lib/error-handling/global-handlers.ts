/**
 * Global error handlers for both client and server environments
 * Provides comprehensive error catching and reporting
 */

import { createModuleLogger } from '@/lib/logger';

const logger = createModuleLogger('error-handling:global');

interface ErrorContext {
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorReport {
  type: 'unhandled-rejection' | 'uncaught-exception' | 'client-error';
  message: string;
  error?: Error;
  context: ErrorContext;
}

/**
 * Client-side global error handlers
 */
export function setupClientErrorHandlers() {
  if (typeof window === 'undefined') {
    return;
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error({
      reason: event.reason,
      promise: event.promise,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }, 'Unhandled promise rejection');

    // Report to monitoring service
    reportClientError({
      type: 'unhandled-rejection',
      message: event.reason?.message || String(event.reason),
      error: event.reason instanceof Error ? event.reason : undefined,
      context: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        stack: event.reason?.stack,
      },
    });

    // Prevent the default console error
    event.preventDefault();
  });

  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    logger.error({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }, 'Uncaught JavaScript error');

    // Report to monitoring service
    reportClientError({
      type: 'client-error',
      message: event.message,
      error: event.error,
      context: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        stack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      },
    });
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      logger.warn({
        element: event.target,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }, 'Resource loading error');
    }
  }, true);
}

/**
 * Server-side global error handlers
 */
export function setupServerErrorHandlers() {
  if (typeof process === 'undefined') {
    return;
  }

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({
      reason,
      promise,
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: new Date().toISOString(),
    }, 'Unhandled promise rejection');

    // In production, you might want to exit the process
    // after graceful cleanup
    if (process.env.NODE_ENV === 'production') {
      logger.error('Unhandled rejection in production, considering graceful shutdown');
      // Implement graceful shutdown logic here
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }, 'Uncaught exception');

    // Exit the process after logging
    // This prevents the app from continuing in an unknown state
    process.exit(1);
  });

  // Handle graceful shutdown signals
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    // Close server connections, database pools, etc.
    // This should be implemented based on your specific resources
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

/**
 * Report client-side errors to the server
 */
async function reportClientError(errorReport: ErrorReport) {
  try {
    // Rate limiting to prevent spam
    if (shouldRateLimit(errorReport)) {
      return;
    }

    await fetch('/api/client-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level: 'error',
        message: errorReport.message,
        error: errorReport.error?.message,
        stack: errorReport.error?.stack,
        context: errorReport.context,
        type: errorReport.type,
      }),
    });
  } catch (reportError) {
    // Fallback to console if reporting fails
    console.error('Failed to report error:', reportError);
    console.error('Original error:', errorReport);
  }
}

/**
 * Simple rate limiting for error reports
 */
const errorReportCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // Max 10 errors per minute per type

function shouldRateLimit(errorReport: ErrorReport): boolean {
  const key = `${errorReport.type}:${errorReport.message}`;
  const now = Date.now();
  const current = errorReportCounts.get(key) || { count: 0, lastReset: now };

  // Reset count if window has passed
  if (now - current.lastReset > RATE_LIMIT_WINDOW) {
    current.count = 0;
    current.lastReset = now;
  }

  current.count++;
  errorReportCounts.set(key, current);

  return current.count > RATE_LIMIT_MAX;
}

/**
 * Initialize global error handlers based on environment
 */
export function initializeGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    setupClientErrorHandlers();
    logger.info('Client-side error handlers initialized');
  }

  if (typeof process !== 'undefined') {
    setupServerErrorHandlers();
    logger.info('Server-side error handlers initialized');
  }
}

/**
 * Create a manual error reporter for components
 */
export function createErrorReporter(component: string) {
  return {
    reportError: (error: Error, context?: Record<string, unknown>) => {
      const errorReport: ErrorReport = {
        type: 'client-error',
        message: error.message,
        error,
        context: {
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          stack: error.stack,
          metadata: {
            component,
            ...context,
          },
        },
      };

      if (typeof window !== 'undefined') {
        reportClientError(errorReport);
      } else {
        logger.error(errorReport, `Error in ${component}`);
      }
    },
  };
}