/**
 * Test performance monitoring system
 * Following Supabase's approach to performance tracking in tests
 */

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { performance } from 'node:perf_hooks';
import { createModuleLogger } from '../../../lib/logger';

const logger = createModuleLogger('db:test-performance');

export interface TestMetrics {
  testName: string;
  executionTimeMs: number;
  memoryUsageKb?: number;
  queriesExecuted?: number;
  queryTimeMs?: number;
  transactionCount?: number;
  status: 'success' | 'failure' | 'skipped';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  maxExecutionTimeMs?: number;
  maxMemoryUsageKb?: number;
  maxQueries?: number;
  maxQueryTimeMs?: number;
}

/**
 * Performance monitor for database tests
 */
export class TestPerformanceMonitor {
  private db: PostgresJsDatabase;
  private activeTests: Map<string, { startTime: number; startMemory?: number }> = new Map();
  private queryMetrics: Map<string, { count: number; totalTime: number }> = new Map();

  constructor(db: PostgresJsDatabase) {
    this.db = db;
  }

  /**
   * Initialize performance tracking tables
   */
  async initialize(): Promise<void> {
    logger.debug('Initializing performance tracking');

    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS test_performance (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255) NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        memory_usage_kb INTEGER,
        queries_executed INTEGER,
        query_time_ms INTEGER,
        transaction_count INTEGER,
        test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        test_status VARCHAR(20) NOT NULL,
        error_message TEXT,
        metadata JSONB,

        -- Indexes for performance analysis
        INDEX idx_test_name (test_name),
        INDEX idx_test_date (test_date DESC),
        INDEX idx_test_status (test_status),
        INDEX idx_execution_time (execution_time_ms)
      )
    `);

    // Create performance baseline table
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS test_performance_baseline (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255) UNIQUE NOT NULL,
        avg_execution_time_ms INTEGER NOT NULL,
        max_execution_time_ms INTEGER NOT NULL,
        min_execution_time_ms INTEGER NOT NULL,
        p95_execution_time_ms INTEGER NOT NULL,
        sample_size INTEGER NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.debug('Performance tracking initialized');
  }

  /**
   * Start monitoring a test
   */
  startTest(testName: string): void {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed / 1024; // Convert to KB

    this.activeTests.set(testName, { startTime, startMemory });
    this.queryMetrics.set(testName, { count: 0, totalTime: 0 });

    logger.debug(`Started monitoring test: ${testName}`);
  }

  /**
   * Record a query execution
   */
  recordQuery(testName: string, queryTimeMs: number): void {
    const metrics = this.queryMetrics.get(testName);
    if (metrics) {
      metrics.count++;
      metrics.totalTime += queryTimeMs;
    }
  }

  /**
   * End monitoring a test and record metrics
   */
  async endTest(
    testName: string,
    status: 'success' | 'failure' | 'skipped' = 'success',
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<TestMetrics> {
    const testData = this.activeTests.get(testName);
    if (!testData) {
      throw new Error(`No active test found for: ${testName}`);
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024;

    const executionTimeMs = Math.round(endTime - testData.startTime);
    const memoryUsageKb = Math.round(endMemory - (testData.startMemory || 0));

    const queryMetrics = this.queryMetrics.get(testName) || { count: 0, totalTime: 0 };

    const metrics: TestMetrics = {
      testName,
      executionTimeMs,
      memoryUsageKb,
      queriesExecuted: queryMetrics.count,
      queryTimeMs: Math.round(queryMetrics.totalTime),
      status,
      errorMessage,
      metadata,
    };

    // Record metrics to database
    await this.recordMetrics(metrics);

    // Cleanup
    this.activeTests.delete(testName);
    this.queryMetrics.delete(testName);

    logger.debug(`Ended monitoring test: ${testName} - Duration: ${metrics.executionTimeMs}ms, Queries: ${metrics.queriesExecuted}`);

    return metrics;
  }

  /**
   * Record test metrics to database
   */
  private async recordMetrics(metrics: TestMetrics): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO test_performance (
        test_name,
        execution_time_ms,
        memory_usage_kb,
        queries_executed,
        query_time_ms,
        test_status,
        error_message,
        metadata
      ) VALUES (
        ${metrics.testName},
        ${metrics.executionTimeMs},
        ${metrics.memoryUsageKb || null},
        ${metrics.queriesExecuted || null},
        ${metrics.queryTimeMs || null},
        ${metrics.status},
        ${metrics.errorMessage || null},
        ${JSON.stringify(metrics.metadata) || null}
      )
    `);
  }

  /**
   * Check if test performance meets thresholds
   */
  async checkThresholds(
    testName: string,
    thresholds: PerformanceThresholds
  ): Promise<{ passed: boolean; violations: string[] }> {
    const metrics = await this.getLatestMetrics(testName);
    if (!metrics) {
      return { passed: false, violations: ['No metrics found for test'] };
    }

    const violations: string[] = [];

    if (
      thresholds.maxExecutionTimeMs &&
      metrics.executionTimeMs > thresholds.maxExecutionTimeMs
    ) {
      violations.push(
        `Execution time ${metrics.executionTimeMs}ms exceeds threshold ${thresholds.maxExecutionTimeMs}ms`
      );
    }

    if (
      thresholds.maxMemoryUsageKb &&
      metrics.memoryUsageKb &&
      metrics.memoryUsageKb > thresholds.maxMemoryUsageKb
    ) {
      violations.push(
        `Memory usage ${metrics.memoryUsageKb}KB exceeds threshold ${thresholds.maxMemoryUsageKb}KB`
      );
    }

    if (
      thresholds.maxQueries &&
      metrics.queriesExecuted &&
      metrics.queriesExecuted > thresholds.maxQueries
    ) {
      violations.push(
        `Query count ${metrics.queriesExecuted} exceeds threshold ${thresholds.maxQueries}`
      );
    }

    if (
      thresholds.maxQueryTimeMs &&
      metrics.queryTimeMs &&
      metrics.queryTimeMs > thresholds.maxQueryTimeMs
    ) {
      violations.push(
        `Query time ${metrics.queryTimeMs}ms exceeds threshold ${thresholds.maxQueryTimeMs}ms`
      );
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Get latest metrics for a test
   */
  async getLatestMetrics(testName: string): Promise<TestMetrics | null> {
    const result = await this.db.execute(sql`
      SELECT * FROM test_performance
      WHERE test_name = ${testName}
      ORDER BY test_date DESC
      LIMIT 1
    `);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      testName: row.test_name as string,
      executionTimeMs: row.execution_time_ms as number,
      memoryUsageKb: row.memory_usage_kb as number,
      queriesExecuted: row.queries_executed as number,
      queryTimeMs: row.query_time_ms as number,
      status: row.test_status as 'success' | 'failure' | 'skipped',
      errorMessage: row.error_message as string,
      metadata: row.metadata as Record<string, any>,
    };
  }

  /**
   * Calculate performance statistics for a test
   */
  async calculateStats(testName: string, sampleSize = 100): Promise<{
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
    successRate: number;
  }> {
    const result = await this.db.execute(sql`
      WITH recent_tests AS (
        SELECT
          execution_time_ms,
          test_status
        FROM test_performance
        WHERE test_name = ${testName}
        ORDER BY test_date DESC
        LIMIT ${sampleSize}
      ),
      percentiles AS (
        SELECT
          percentile_cont(0.5) WITHIN GROUP (ORDER BY execution_time_ms) AS p50,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY execution_time_ms) AS p95,
          percentile_cont(0.99) WITHIN GROUP (ORDER BY execution_time_ms) AS p99
        FROM recent_tests
        WHERE test_status = 'success'
      )
      SELECT
        AVG(execution_time_ms) AS avg,
        MIN(execution_time_ms) AS min,
        MAX(execution_time_ms) AS max,
        p.p50,
        p.p95,
        p.p99,
        COUNT(CASE WHEN test_status = 'success' THEN 1 END)::FLOAT / COUNT(*) AS success_rate
      FROM recent_tests, percentiles p
      GROUP BY p.p50, p.p95, p.p99
    `);

    if (result.length === 0) {
      return {
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        successRate: 0,
      };
    }

    const row = result[0];
    return {
      avg: Math.round(row.avg as number),
      min: row.min as number,
      max: row.max as number,
      p50: Math.round(row.p50 as number),
      p95: Math.round(row.p95 as number),
      p99: Math.round(row.p99 as number),
      successRate: row.success_rate as number,
    };
  }

  /**
   * Update performance baseline for a test
   */
  async updateBaseline(testName: string): Promise<void> {
    const stats = await this.calculateStats(testName);

    await this.db.execute(sql`
      INSERT INTO test_performance_baseline (
        test_name,
        avg_execution_time_ms,
        max_execution_time_ms,
        min_execution_time_ms,
        p95_execution_time_ms,
        sample_size,
        last_updated
      ) VALUES (
        ${testName},
        ${stats.avg},
        ${stats.max},
        ${stats.min},
        ${stats.p95},
        100,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (test_name) DO UPDATE SET
        avg_execution_time_ms = EXCLUDED.avg_execution_time_ms,
        max_execution_time_ms = EXCLUDED.max_execution_time_ms,
        min_execution_time_ms = EXCLUDED.min_execution_time_ms,
        p95_execution_time_ms = EXCLUDED.p95_execution_time_ms,
        sample_size = EXCLUDED.sample_size,
        last_updated = CURRENT_TIMESTAMP
    `);

    logger.info(`Updated performance baseline for test: ${testName}`);
  }

  /**
   * Compare current performance against baseline
   */
  async compareToBaseline(testName: string): Promise<{
    withinBaseline: boolean;
    percentChange: number;
    message: string;
  }> {
    const latest = await this.getLatestMetrics(testName);
    if (!latest) {
      return {
        withinBaseline: false,
        percentChange: 0,
        message: 'No metrics found',
      };
    }

    const baseline = await this.db.execute(sql`
      SELECT * FROM test_performance_baseline
      WHERE test_name = ${testName}
    `);

    if (baseline.length === 0) {
      return {
        withinBaseline: true,
        percentChange: 0,
        message: 'No baseline established',
      };
    }

    const baselineData = baseline[0];
    const p95Baseline = baselineData.p95_execution_time_ms as number;
    const percentChange = ((latest.executionTimeMs - p95Baseline) / p95Baseline) * 100;

    const withinBaseline = latest.executionTimeMs <= p95Baseline * 1.1; // Allow 10% variance

    return {
      withinBaseline,
      percentChange,
      message: withinBaseline
        ? `Performance within baseline (${percentChange.toFixed(1)}% change)`
        : `Performance regression detected (${percentChange.toFixed(1)}% slower than baseline)`,
    };
  }

  /**
   * Generate performance report
   */
  async generateReport(testNames?: string[]): Promise<string> {
    let whereClause = '';
    if (testNames && testNames.length > 0) {
      const testList = testNames.map(name => `'${name}'`).join(',');
      whereClause = `WHERE test_name IN (${testList})`;
    }

    const result = await this.db.execute(sql.raw(`
      SELECT
        test_name,
        COUNT(*) as total_runs,
        COUNT(CASE WHEN test_status = 'success' THEN 1 END) as successful_runs,
        AVG(execution_time_ms) as avg_time,
        MIN(execution_time_ms) as min_time,
        MAX(execution_time_ms) as max_time,
        AVG(memory_usage_kb) as avg_memory,
        AVG(queries_executed) as avg_queries
      FROM test_performance
      ${whereClause}
      GROUP BY test_name
      ORDER BY avg_time DESC
    `));

    let report = '# Test Performance Report\n\n';
    report += '| Test Name | Runs | Success Rate | Avg Time (ms) | Min/Max (ms) | Avg Memory (KB) | Avg Queries |\n';
    report += '|-----------|------|--------------|---------------|--------------|-----------------|-------------|\n';

    for (const row of result) {
      const successRate = ((row.successful_runs as number) / (row.total_runs as number) * 100).toFixed(1);
      report += `| ${row.test_name} | ${row.total_runs} | ${successRate}% | ${Math.round(row.avg_time as number)} | ${row.min_time}/${row.max_time} | ${Math.round(row.avg_memory as number || 0)} | ${Math.round(row.avg_queries as number || 0)} |\n`;
    }

    return report;
  }
}

/**
 * Create a performance monitor instance
 */
export function createTestPerformanceMonitor(
  db: PostgresJsDatabase
): TestPerformanceMonitor {
  return new TestPerformanceMonitor(db);
}

/**
 * Performance test decorator
 */
export function performanceTest(
  thresholds?: PerformanceThresholds
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const monitor = (this as any).performanceMonitor as TestPerformanceMonitor;

      if (!monitor) {
        // No monitor available, run test without monitoring
        return originalMethod.apply(this, args);
      }

      const testName = `${target.constructor.name}.${String(propertyKey)}`;

      monitor.startTest(testName);

      try {
        const result = await originalMethod.apply(this, args);

        const metrics = await monitor.endTest(testName, 'success');

        if (thresholds) {
          const { passed, violations } = await monitor.checkThresholds(testName, thresholds);
          if (!passed) {
            throw new Error(`Performance threshold violations: ${violations.join(', ')}`);
          }
        }

        return result;
      } catch (error) {
        await monitor.endTest(testName, 'failure', (error as Error).message);
        throw error;
      }
    };

    return descriptor;
  };
}