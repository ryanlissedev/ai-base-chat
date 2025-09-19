import { test, expect } from '@playwright/test';

test.describe('Element Validation', () => {
  test('multimodal input should be findable and interactive', async ({ page }) => {
    console.log('🧪 Starting validation test...');
    
    // Navigate to home page
    console.log('📍 Navigating to home page...');
    await page.goto('/');
    
    // Wait for page to load completely
    console.log('⏱️ Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    
    // Look for multimodal input
    console.log('🔍 Looking for multimodal input...');
    await page.waitForSelector('[data-testid="multimodal-input"]', { 
      state: 'visible', 
      timeout: 30000 
    });
    
    console.log('✅ Found multimodal input!');
    
    // Test interaction
    const textInput = page.locator('[data-testid="multimodal-input"]').first();
    await textInput.waitFor({ state: 'visible' });
    await textInput.click();
    
    console.log('✏️ Typing test message...');
    await page.keyboard.press('Control+a');
    await page.keyboard.type('Test message for validation');
    
    // Look for send button
    console.log('🔍 Looking for send button...');
    const sendButton = page.getByTestId('send-button');
    await sendButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Check that button becomes enabled after typing
    await page.waitForFunction(() => {
      const btn = document.querySelector('[data-testid="send-button"]');
      return btn && !btn.hasAttribute('disabled') && !btn.classList.contains('disabled');
    }, { timeout: 10000 });
    
    console.log('✅ All validation checks PASSED!');
    
    // Verify the text was actually entered
    const inputValue = await textInput.textContent();
    expect(inputValue).toContain('Test message');
    
    // Verify send button is clickable
    await expect(sendButton).toBeEnabled();
    
    console.log('🎉 Validation test completed successfully!');
  });
});