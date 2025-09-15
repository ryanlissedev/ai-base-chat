const { chromium } = require('playwright');

async function testChatFlow() {
  console.log('🚀 Starting chat flow test...');

  const browser = await chromium.launch({
    headless: false, // Set to true if you don't want to see the browser
    slowMo: 1000, // Slow down actions by 1 second for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📱 Navigating to the app...');
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    console.log('🔍 Looking for chat input...');
    // Look for the chat input field
    const chatInput = page.locator('[data-testid="multimodal-input"]');
    await chatInput.waitFor({ timeout: 10000 });

    console.log('✍️ Sending a test message...');
    // Type a test message
    await chatInput.fill('Hello! Can you tell me a joke?');

    console.log('📤 Clicking send button...');
    // Click the send button
    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.click();

    console.log('⏳ Waiting for AI response...');
    // Wait for the AI response
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/chat') && response.status() === 200,
    );

    console.log('✅ Chat flow test completed successfully!');

    // Wait a bit to see the response
    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testChatFlow().catch(console.error);
