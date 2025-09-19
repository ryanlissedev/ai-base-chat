const { chromium } = require('playwright');

async function testMultimodalInput() {
  console.log('🧪 Starting Playwright validation test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📍 Navigating to home page...');
    await page.goto('http://localhost:3000');
    
    console.log('⏱️ Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Looking for multimodal input...');
    await page.waitForSelector('[data-testid="multimodal-input"]', { 
      state: 'visible', 
      timeout: 30000 
    });
    
    console.log('✅ Found multimodal input!');
    
    const textInput = page.locator('[data-testid="multimodal-input"]').first();
    await textInput.waitFor({ state: 'visible' });
    await textInput.click();
    
    console.log('✏️ Typing test message...');
    await page.keyboard.press('Control+a');
    await page.keyboard.type('Test message');
    
    console.log('🔍 Looking for send button...');
    const sendButton = page.getByTestId('send-button');
    await sendButton.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('✅ Test PASSED - All elements found and interactions work!');
    
  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    
    // Debug information
    const url = page.url();
    const title = await page.title();
    console.log('🐛 Debug info:');
    console.log('   URL:', url);
    console.log('   Title:', title);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-screenshot.png' });
    console.log('📸 Screenshot saved as debug-screenshot.png');
    
  } finally {
    await browser.close();
  }
}

// Check if server is running first
(async () => {
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('🌐 Server is running, starting test...');
      await testMultimodalInput();
    } else {
      console.log('⚠️ Server returned error:', response.status);
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start it with: pnpm dev');
    console.log('   Error:', error.message);
  }
})();