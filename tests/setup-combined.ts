import { test as base, expect } from '@playwright/test';
import { runTestMigration } from '../lib/db/migrate-test';

// Combined test setup with database isolation and API mocking
export const test = base.extend({
  page: async ({ page }, use) => {
    // 1. Database Setup - Initialize PostgreSQL test database
    const testDatabaseUrl = process.env.POSTGRES_URL || 'postgresql://test_user:test_password@localhost:5433/test_db';
    
    try {
      // The database container should already be running from globalSetup
      // but we still need to run migrations for test isolation
      await runTestMigration(testDatabaseUrl);
    } catch (error) {
      console.error('Database setup failed:', error);
      console.error('This usually means:');
      console.error('1. The test database container is not running');
      console.error('2. Database connection parameters are incorrect');
      console.error('3. Database migrations failed');
      console.error('Make sure to run the global setup or start the database manually with:');
      console.error('  docker compose -f docker-compose.test.yml up -d postgres-test');
      throw error; // Fail fast instead of continuing with broken database
    }

    // 2. API Mocking - Mock the chat API with predictable responses
    await page.route('**/api/chat', async (route) => {
      console.log('🎯 Chat API route intercepted:', route.request().url());
      console.log('🎯 Request method:', route.request().method());
      const request = route.request();
      
      // Only intercept POST requests
      if (request.method() !== 'POST') {
        await route.continue();
        return;
      }
      
      let body = null;
      try {
        body = await request.postDataJSON();
      } catch (error) {
        console.log('🎯 Failed to parse JSON body:', error);
      }
      console.log('🎯 Request body:', body);
      
      if (body?.messages) {
        const lastMessage = body.messages[body.messages.length - 1];
        const userContent = lastMessage?.content?.toLowerCase() || '';
        
        let mockResponse = '';
        
        // Mock responses based on user input
        if (userContent.includes('grass') && userContent.includes('green')) {
          mockResponse = "It's just green duh!";
        } else if (userContent.includes('sky') && userContent.includes('blue')) {
          mockResponse = "It's just blue duh!";
        } else if (userContent.includes('thanks') || userContent.includes('thank you')) {
          mockResponse = "You're welcome!";
        } else if (userContent.includes('advantages') && userContent.includes('next.js')) {
          mockResponse = "With Next.js, you can ship fast!";
        } else if (userContent.includes('painted') || userContent.includes('painting')) {
          mockResponse = "This painting is by Monet!";
        } else if (userContent.includes('weather') && userContent.includes('sf')) {
          mockResponse = "The current temperature in San Francisco is 17°C.";
        } else if (userContent.includes('essay') && userContent.includes('silicon valley')) {
          // Artifact creation response
          mockResponse = "A document was created and is now visible to the user.";
        } else {
          mockResponse = "I understand your question.";
        }
        
        console.log('🎯 Mock response will be:', mockResponse);
        
        // Create a simple streaming response body as a string
        // For tests, we simulate streaming by sending the complete response immediately
        const streamBody = `data: {"type":"text","text":"${mockResponse}"}\n\ndata: {"type":"finish"}\n\n`;
        
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
          body: streamBody,
        });
        console.log('🎯 Route fulfilled');
      } else {
        await route.continue();
      }
    });

    // Mock TRPC API for voting
    await page.route('**/api/trpc/**', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: { data: { success: true } } }),
      });
    });

    await use(page);

    // Cleanup after test (optional - commented out to keep for debugging)
    // if (fs.existsSync(testDbPath)) {
    //   fs.unlinkSync(testDbPath);
    // }
  },
});

export { expect };