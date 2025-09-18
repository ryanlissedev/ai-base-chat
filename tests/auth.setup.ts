import * as path from 'node:path';
import { expect, test as setup } from '@playwright/test';

const authFile = path.join(__dirname, '../playwright/.auth/session.json');

setup('authenticate', async ({ page }) => {
  // Navigate to home page to create an anonymous session
  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait for the page to fully load and establish anonymous session
  // The multimodal-input is in the ChatInputTextArea component
  await expect(page.getByTestId('multimodal-input')).toBeVisible({
    timeout: 15000,
  });

  // Ensure the input is actually interactive
  await expect(page.getByTestId('multimodal-input')).toBeEnabled();

  // Save the anonymous session state
  await page.context().storageState({ path: authFile });
});
