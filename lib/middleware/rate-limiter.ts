/**
 * Rate limiting middleware for API endpoints
 *
 * Uses in-memory storage for simplicity in development
 * In production, consider using Redis or a similar solution
 */

import { NextResponse } from 'next/server';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('middleware:rate-limiter');

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum requests per window
  message?: string;  // Custom error message
  skipAuth?: boolean; // Skip rate limiting for authenticated users
  keyGenerator?: (req: Request) => string; // Custom key generator
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  increment(key: string, windowMs: number): { count: number; remaining: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;

    let entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      entry = { count: 1, resetTime };
      this.store.set(key, entry);
    } else {
      entry.count++;
    }

    const remaining = Math.max(0, entry.count);
    return { count: entry.count, remaining, resetTime: entry.resetTime };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton store instance
const store = new RateLimitStore();

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const url = new URL(req.url);
  return `${ip}:${url.pathname}`;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 100, // 100 requests per window default
    message = 'Too many requests, please try again later.',
    skipAuth = false,
    keyGenerator = defaultKeyGenerator,
  } = config;

  return async function rateLimitMiddleware(request: Request): Promise<NextResponse | undefined> {
    try {
      // Skip rate limiting in test environment
      if (process.env.NODE_ENV === 'test') {
        return undefined;
      }

      // Check if user is authenticated (if skipAuth is enabled)
      if (skipAuth) {
        const authHeader = request.headers.get('authorization');
        const sessionCookie = request.headers.get('cookie')?.includes('session=');
        if (authHeader || sessionCookie) {
          logger.debug('Skipping rate limit for authenticated user');
          return undefined;
        }
      }

      // Generate key for this request
      const key = keyGenerator(request);

      // Check rate limit
      const { count, remaining, resetTime } = store.increment(key, windowMs);

      if (count > max) {
        logger.warn(`Rate limit exceeded for key: ${key} (${count}/${max})`);

        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': max.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(resetTime).toISOString(),
              'Retry-After': retryAfter.toString(),
            },
          }
        );
      }

      // Add rate limit headers to response
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', max.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, max - count).toString());
      response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

      return undefined; // Continue to next middleware/handler
    } catch (error) {
      logger.error('Rate limiting error:', error);
      return undefined; // Don't block request on error
    }
  };
}

/**
 * Preset configurations for common use cases
 */
export const RateLimitPresets = {
  // Health check endpoint - more restrictive
  health: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Health check rate limit exceeded',
  },

  // API endpoints - standard rate
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'API rate limit exceeded',
    skipAuth: true, // Don't rate limit authenticated users
  },

  // Authentication endpoints - strict to prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts',
  },

  // Public endpoints - lenient
  public: {
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute
    message: 'Rate limit exceeded',
  },
} as const;

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => store.destroy());
  process.on('SIGINT', () => {
    store.destroy();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    store.destroy();
    process.exit(0);
  });
}