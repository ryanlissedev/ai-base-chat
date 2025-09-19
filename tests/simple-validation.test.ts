import { test, expect } from '@playwright/test';

test.describe('Basic Element Validation', () => {
  test('should find multimodal input element', async ({ page }) => {
    console.log('🧪 Starting simple validation...');
    
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Our main fix: multimodal input should be findable with proper selector
    console.log('🔍 Looking for multimodal input with updated selector...');
    
    try {
      // Wait for the multimodal input to be visible
      await page.waitForSelector('[data-testid="multimodal-input"]', { 
        state: 'visible', 
        timeout: 30000 
      });
      
      console.log('✅ Found multimodal input!');
      
      // Test our improved interaction method
      const textInput = page.locator('[data-testid="multimodal-input"]').first();
      await textInput.waitFor({ state: 'visible' });
      
      // This should work now with our fix
      await textInput.click();
      console.log('✅ Successfully clicked multimodal input!');
      
      // Test typing with keyboard events (our fix)
      await page.keyboard.press('Control+a');
      await page.keyboard.type('Hello test!');
      console.log('✅ Successfully typed in multimodal input!');
      
      // Verify send button appears
      const sendButton = page.getByTestId('send-button');
      await sendButton.waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ Send button found!');
      
      console.log('🎉 All basic validations PASSED!');
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      
      // Debug info
      const url = page.url();
      const title = await page.title();
      console.log('Debug - URL:', url);
      console.log('Debug - Title:', title);
      
      // Check what elements are actually present
      const allTestIds = await page.$$eval('[data-testid]', elements => 
        elements.map(el => el.getAttribute('data-testid'))
      );
      console.log('Debug - Available test IDs:', allTestIds);
      
      throw error;
    }
  });
});