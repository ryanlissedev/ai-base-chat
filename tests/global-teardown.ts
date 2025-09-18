import { execSync } from 'child_process';

/**
 * Global teardown for Playwright tests
 * Cleans up database containers and test resources
 */
async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Stop and remove test containers with volumes
    console.log('🛑 Stopping test database containers...');
    execSync('docker compose -f docker-compose.test.yml down -v --remove-orphans', { 
      stdio: 'inherit',
      timeout: 30000 
    });

    // Clean up any orphaned containers and networks
    try {
      execSync('docker container prune -f', { stdio: 'ignore' });
      execSync('docker network prune -f', { stdio: 'ignore' });
    } catch (error) {
      // Ignore cleanup errors
    }

    console.log('✅ Test environment cleanup completed');
  } catch (error) {
    console.error('⚠️  Warning: Failed to cleanup test environment:', error);
    // Don't throw error here as tests may have already passed
  }
}

export default globalTeardown;