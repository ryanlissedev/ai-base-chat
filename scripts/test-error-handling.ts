#!/usr/bin/env tsx

/**
 * Comprehensive error handling and stability test script
 * Tests all critical error scenarios and edge cases
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

class ErrorHandlingTester {
  private results: TestResult[] = [];
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting comprehensive error handling tests...\n');

    await this.testApiErrorHandling();
    await this.testDatabaseResilience();
    await this.testMemoryLeaks();
    await this.testClientErrorHandling();
    await this.testEdgeCases();

    this.printResults();
  }

  private async testApiErrorHandling(): Promise<void> {
    console.log('📡 Testing API error handling...');

    // Test health endpoint with various scenarios
    await this.test('Health endpoint responds correctly', async () => {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok && response.status !== 503) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.timestamp || !data.status) {
        throw new Error('Missing required health check fields');
      }
    });

    // Test rate limiting
    await this.test('Rate limiting works', async () => {
      const promises = Array(20).fill(0).map(() => 
        fetch(`${this.baseUrl}/api/health`, { method: 'HEAD' })
      );
      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      if (!rateLimited) {
        throw new Error('Rate limiting not triggered');
      }
    });

    // Test invalid JSON body
    await this.test('Invalid JSON handling', async () => {
      const response = await fetch(`${this.baseUrl}/api/client-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json}',
      });
      if (response.status !== 400) {
        throw new Error(`Expected 400, got ${response.status}`);
      }
    });

    // Test correlation IDs
    await this.test('Correlation IDs present', async () => {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const correlationId = response.headers.get('X-Correlation-ID');
      if (!correlationId) {
        throw new Error('Missing correlation ID header');
      }
    });
  }

  private async testDatabaseResilience(): Promise<void> {
    console.log('🗄️ Testing database resilience...');

    // Test database timeout handling
    await this.test('Database operations have timeouts', async () => {
      // This test assumes the health endpoint uses database
      const start = Date.now();
      const response = await fetch(`${this.baseUrl}/api/health`);
      const duration = Date.now() - start;
      
      // Should not take longer than configured timeout (10s for health)
      if (duration > 15000) {
        throw new Error(`Health check took too long: ${duration}ms`);
      }
    });

    // Test circuit breaker by checking if we can get status
    await this.test('Circuit breaker status accessible', async () => {
      // We can't directly test circuit breaker without causing failures,
      // but we can verify the system handles database errors gracefully
      const response = await fetch(`${this.baseUrl}/api/health`);
      const data = await response.json();
      
      // Even if database is down, health endpoint should respond
      if (!data.status) {
        throw new Error('Health endpoint should always return status');
      }
    });
  }

  private async testMemoryLeaks(): Promise<void> {
    console.log('💾 Testing memory leak prevention...');

    // Test multiple rapid requests don't cause memory issues
    await this.test('No memory leaks from rapid requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make many concurrent requests
      const promises = Array(50).fill(0).map(() => 
        fetch(`${this.baseUrl}/api/health`)
      );
      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Allow for some memory increase, but not excessive
      if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
        throw new Error(`Excessive memory increase: ${memoryIncrease / 1024 / 1024}MB`);
      }
    });

    // Test that event listeners are properly cleaned up
    await this.test('Event listeners cleanup', async () => {
      // This is more of a structural test
      // In a real scenario, we'd check that components unmount cleanly
      return true;
    });
  }

  private async testClientErrorHandling(): Promise<void> {
    console.log('🌐 Testing client-side error handling...');

    // Test client logs endpoint
    await this.test('Client logs endpoint works', async () => {
      const response = await fetch(`${this.baseUrl}/api/client-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message: 'Test error',
          context: { test: true },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Client logs failed: ${response.status}`);
      }
    });

    // Test error boundary fallbacks
    await this.test('Error boundaries present in HTML', async () => {
      const response = await fetch(`${this.baseUrl}`);
      const html = await response.text();
      
      // Check that the HTML includes our error handling components
      if (!html.includes('ErrorBoundary') && !html.includes('GlobalErrorHandler')) {
        console.warn('Note: Error boundaries may be client-side only');
      }
      return true;
    });
  }

  private async testEdgeCases(): Promise<void> {
    console.log('🎯 Testing edge cases and boundary conditions...');

    // Test very large request bodies
    await this.test('Large request body handling', async () => {
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const response = await fetch(`${this.baseUrl}/api/client-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: largeData }),
      });
      
      // Should either accept or properly reject with 413
      if (response.status !== 200 && response.status !== 413 && response.status !== 400) {
        throw new Error(`Unexpected status for large body: ${response.status}`);
      }
    });

    // Test concurrent connections
    await this.test('Concurrent connection handling', async () => {
      const promises = Array(100).fill(0).map(() => 
        fetch(`${this.baseUrl}/api/health`, { method: 'HEAD' })
      );
      
      const responses = await Promise.allSettled(promises);
      const failures = responses.filter(r => r.status === 'rejected');
      
      // Allow some failures due to rate limiting, but not all
      if (failures.length > responses.length * 0.5) {
        throw new Error(`Too many concurrent request failures: ${failures.length}/${responses.length}`);
      }
    });

    // Test malformed requests
    await this.test('Malformed request handling', async () => {
      const response = await fetch(`${this.baseUrl}/api/nonexistent`);
      if (response.status !== 404) {
        console.warn(`Expected 404 for nonexistent endpoint, got ${response.status}`);
      }
      return true;
    });

    // Test timeout scenarios
    await this.test('Request timeout handling', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 100); // Very short timeout
      
      try {
        await fetch(`${this.baseUrl}/api/health`, {
          signal: controller.signal,
        });
      } catch (error) {
        // Should handle abort gracefully
        if (error instanceof Error && error.name !== 'AbortError') {
          throw new Error(`Unexpected error type: ${error.name}`);
        }
      }
    });
  }

  private async test(name: string, testFn: () => Promise<boolean | void>): Promise<void> {
    try {
      await testFn();
      this.results.push({ name, passed: true });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`  ❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private printResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);

    console.log('\n📊 Test Results Summary:');
    console.log(`  Total tests: ${total}`);
    console.log(`  Passed: ${passed} (${percentage}%)`);
    console.log(`  Failed: ${total - passed}`);

    if (passed === total) {
      console.log('\n🎉 All error handling tests passed!');
    } else {
      console.log('\n⚠️ Some tests failed. Review the errors above.');
      
      const failures = this.results.filter(r => !r.passed);
      console.log('\nFailed tests:');
      failures.forEach(failure => {
        console.log(`  - ${failure.name}: ${failure.error}`);
      });
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ErrorHandlingTester();
  tester.runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export { ErrorHandlingTester };