import { test, expect } from './setup-combined';

test.describe('debug chat', () => {
  test('debug message sending', async ({ page }) => {
    // Navigate to home
    await page.goto('/');
    
    // Wait for input to be ready
    await expect(page.getByTestId('multimodal-input')).toBeVisible();
    
    // Send a simple message
    await page.getByTestId('multimodal-input').click();
    await page.getByTestId('multimodal-input').fill('Why is grass green?');
    await page.getByTestId('send-button').click();
    
    // Wait for any response and debug what we get
    await page.waitForTimeout(5000);
    
    // Check what messages exist
    const userMessages = await page.getByTestId('message-user').count();
    const assistantMessages = await page.getByTestId('message-assistant').count();
    
    console.log('User messages:', userMessages);
    console.log('Assistant messages:', assistantMessages);
    
    // Check if any elements exist with message content
    const allMessages = await page.locator('[data-testid*="message"]').count();
    console.log('Total message elements:', allMessages);
    
    // Debug page content
    const pageContent = await page.content();
    const hasGreenResponse = pageContent.includes("It's just green duh!");
    console.log('Page contains expected response:', hasGreenResponse);
    
    // Just verify we have at least a user message
    expect(userMessages).toBeGreaterThan(0);
  });
});