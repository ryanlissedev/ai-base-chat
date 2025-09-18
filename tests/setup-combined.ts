import { test as base, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Combined test setup with database isolation and API mocking
export const test = base.extend({
  page: async ({ page }, use) => {
    // 1. Database Setup - Clean database before each test
    const testDbPath = path.join(process.cwd(), 'test.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize fresh test database
    try {
      execSync('DATABASE_URL=file:./test.db npx tsx lib/db/migrate.ts', {
        stdio: 'ignore',
        env: { ...process.env, DATABASE_URL: 'file:./test.db' }
      });
    } catch (error) {
      console.warn('Database setup failed, continuing with existing database:', error);
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
        
        // Create a simple streaming response that completes immediately
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            console.log('🎯 Stream started, sending response');
            // Send the complete response immediately
            controller.enqueue(encoder.encode(`data: {"type":"text","text":"${mockResponse}"}\n\n`));
            controller.enqueue(encoder.encode('data: {"type":"finish"}\n\n'));
            controller.close();
            console.log('🎯 Stream completed');
          }
        });
        
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
          body: stream,
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