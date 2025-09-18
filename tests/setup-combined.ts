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
      const request = route.request();
      const body = await request.postDataJSON();
      
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
        
        // Create a streaming response similar to real API
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            // Split response into chunks to simulate streaming
            const chunks = mockResponse.split(' ');
            chunks.forEach((chunk, index) => {
              setTimeout(() => {
                if (index === chunks.length - 1) {
                  controller.enqueue(encoder.encode(`data: {"type":"text","text":"${chunk}"}\n\n`));
                  controller.enqueue(encoder.encode('data: {"type":"finish"}\n\n'));
                  controller.close();
                } else {
                  controller.enqueue(encoder.encode(`data: {"type":"text","text":"${chunk} "}\n\n`));
                }
              }, index * 10);
            });
          }
        });
        
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
          body: stream,
        });
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