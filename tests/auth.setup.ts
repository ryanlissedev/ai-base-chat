import * as path from 'node:path';
import { expect, test as setup } from '@playwright/test';

const authFile = path.join(__dirname, '../playwright/.auth/session.json');

setup('authenticate', async ({ page }) => {
  // Navigate to home page to create an anonymous session
  await page.goto('/');

  // Wait for the page to load and establish anonymous session
  await expect(page.getByTestId('multimodal-input')).toBeVisible({
    timeout: 10000,
  });

  // Save the anonymous session state
  await page.context().storageState({ path: authFile });
});
