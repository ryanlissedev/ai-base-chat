import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { createModuleLogger } from '@/lib/logger';
import { getMainPool } from '@/lib/db/pool';
import { rateLimit, RateLimitPresets } from '@/lib/middleware/rate-limiter';

const logger = createModuleLogger('api:health');

// Apply rate limiting to health endpoint
const healthRateLimiter = rateLimit(RateLimitPresets.health);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
      poolStats?: {
        total: number;
        idle: number;
        waiting: number;
        max: number;
      };
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

async function checkDatabase(): Promise<HealthCheck['checks']['database']> {
  const startTime = Date.now();

  try {
    // Try to execute a simple query
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - startTime;

    // Get pool stats if available
    let poolStats: HealthCheck['checks']['database']['poolStats'];
    try {
      const pool = getMainPool();
      poolStats = pool.getPoolStats();
    } catch (error) {
      // Pool might not be available
      logger.debug('Pool stats not available');
    }

    return {
      status: 'up',
      latency,
      poolStats,
    };
  } catch (error) {
    logger.error('Database health check failed: %s', error instanceof Error ? error.message : String(error));
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkMemory(): HealthCheck['checks']['memory'] {
  const used = process.memoryUsage();
  const total = used.heapTotal;
  const usedMemory = used.heapUsed;
  const percentage = Math.round((usedMemory / total) * 100);

  let status: HealthCheck['checks']['memory']['status'] = 'ok';
  if (percentage > 90) {
    status = 'critical';
  } else if (percentage > 75) {
    status = 'warning';
  }

  return {
    status,
    used: usedMemory,
    total,
    percentage,
  };
}

export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimitResponse = await healthRateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const startTime = process.hrtime.bigint();

  try {
    // Perform health checks
    const [databaseCheck, memoryCheck] = await Promise.all([
      checkDatabase(),
      checkMemory(),
    ]);

    // Calculate overall status
    let overallStatus: HealthCheck['status'] = 'healthy';

    if (databaseCheck.status === 'down') {
      overallStatus = 'unhealthy';
    } else if (memoryCheck.status === 'critical') {
      overallStatus = 'unhealthy';
    } else if (memoryCheck.status === 'warning') {
      overallStatus = 'degraded';
    }

    const health: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
      },
    };

    // Set appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    logger.error('Health check error: %s', error instanceof Error ? error.message : String(error));

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}

// Support HEAD requests for simple up/down checks
export async function HEAD(request: Request) {
  // Apply rate limiting
  const rateLimitResponse = await healthRateLimiter(request);
  if (rateLimitResponse) {
    return new Response(null, { status: 429 });
  }

  try {
    await db.execute(sql`SELECT 1`);
    return new Response(null, { status: 200 });
  } catch (error) {
    logger.error('Health check HEAD failed: %s', error instanceof Error ? error.message : String(error));
    return new Response(null, { status: 503 });
  }
}