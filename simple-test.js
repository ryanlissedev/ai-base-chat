const { chromium } = require('playwright');

async function simpleTest() {
  console.log('🚀 Starting simple test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Going to localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully!');
    console.log('📄 Page title:', await page.title());
    
    // Take a screenshot
    await page.screenshot({ path: 'homepage.png' });
    console.log('📸 Screenshot saved as homepage.png');
    
    // Wait a bit to see the page
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

simpleTest().catch(console.error);
