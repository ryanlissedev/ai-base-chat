import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Mock the chat API with predictable responses
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
  },
});

export { expect };