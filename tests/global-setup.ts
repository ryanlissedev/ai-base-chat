import { spawn } from 'child_process';
import { promisify } from 'util';
import { execSync, exec } from 'child_process';

const execAsync = promisify(exec);

/**
 * Global setup for Playwright tests
 * Handles database container lifecycle and ensures proper test environment
 */
async function globalSetup() {
  console.log('🔧 Setting up test environment...');

  try {
    // Check if Docker is available
    try {
      execSync('docker --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Docker is not available. Please install Docker to run E2E tests.');
    }

    // Check if docker-compose is available
    try {
      execSync('docker compose version', { stdio: 'ignore' });
    } catch (error) {
      // Try legacy docker-compose
      try {
        execSync('docker-compose --version', { stdio: 'ignore' });
      } catch (legacyError) {
        throw new Error('docker-compose is not available. Please install docker-compose to run E2E tests.');
      }
    }

    // Stop any existing test containers
    console.log('🛑 Stopping any existing test containers...');
    try {
      execSync('docker compose -f docker-compose.test.yml down -v --remove-orphans', { 
        stdio: 'inherit',
        timeout: 30000 
      });
    } catch (error) {
      console.log('ℹ️  No existing containers to stop');
    }

    // Clean up any orphaned containers
    try {
      execSync('docker container prune -f', { stdio: 'ignore' });
    } catch (error) {
      // Ignore errors in cleanup
    }

    // Start the test database container
    console.log('🐳 Starting test database container...');
    execSync('docker compose -f docker-compose.test.yml up -d postgres-test', { 
      stdio: 'inherit',
      timeout: 60000 
    });

    // Wait for the database to be ready
    console.log('⏳ Waiting for database to be ready...');
    await waitForDatabase();

    console.log('✅ Test environment setup completed');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
}

/**
 * Wait for the database to be ready with exponential backoff
 */
async function waitForDatabase(maxRetries = 20, baseDelay = 1000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // First check if the container is running using simpler command
      try {
        const { stdout } = await execAsync('docker ps --filter "name=postgres-test-db" --format "{{.Status}}"');
        if (!stdout.trim() || !stdout.includes('Up')) {
          throw new Error(`Database container not running. Status: ${stdout.trim() || 'not found'}`);
        }
      } catch (containerError) {
        throw new Error(`Container check failed: ${containerError}`);
      }

      // Test the actual database connection
      await execAsync('docker compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U test_user -d test_db -h localhost', {
        timeout: 5000
      });

      console.log(`✅ Database is ready after ${attempt} attempts`);
      return;
    } catch (error) {
      const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), 8000);
      
      if (attempt === maxRetries) {
        // Try to get container logs for debugging
        try {
          const { stdout: logs } = await execAsync('docker compose -f docker-compose.test.yml logs postgres-test --tail 20');
          console.error('Database container logs:', logs);
        } catch (logError) {
          console.error('Could not retrieve container logs:', logError);
        }
        
        throw new Error(`Database failed to become ready after ${maxRetries} attempts. Last error: ${error}`);
      }

      console.log(`⏳ Database not ready (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export default globalSetup;