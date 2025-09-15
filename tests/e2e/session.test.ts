import { expect, test } from '../fixtures';
import { AuthPage } from '../pages/auth';
import { generateRandomTestUser } from '../helpers';
import { ChatPage } from '../pages/chat';

test.describe.serial('Guest Session', () => {
  test('Authenticate as guest user when a new session is loaded', async ({
    page,
  }) => {
    const response = await page.goto('/');

    if (!response) {
      throw new Error('Failed to load page');
    }

    let request = response.request();

    const chain = [];

    while (request) {
      chain.unshift(request.url());
      request = request.redirectedFrom();
    }

    expect(chain).toEqual([
      'http://localhost:3000/',
      'http://localhost:3000/api/auth/guest?redirectUrl=http%3A%2F%2Flocalhost%3A3000%2F',
      'http://localhost:3000/',
    ]);
  });

  test('Log out is not available for guest users', async ({ page }) => {
    await page.goto('/');

    const sidebarToggleButton = page.getByTestId('sidebar-toggle-button');
    await sidebarToggleButton.click();

    const userNavButton = page.getByTestId('user-nav-button');
    await expect(userNavButton).toBeVisible();

    await userNavButton.click();
    const userNavMenu = page.getByTestId('user-nav-menu');
    await expect(userNavMenu).toBeVisible();

    const authMenuItem = page.getByTestId('user-nav-item-auth');
    await expect(authMenuItem).toContainText('Login to your account');
  });

  test('Do not authenticate as guest user when an existing non-guest session is active', async ({
    adaContext,
  }) => {
    const response = await adaContext.page.goto('/');

    if (!response) {
      throw new Error('Failed to load page');
    }

    let request = response.request();

    const chain = [];

    while (request) {
      chain.unshift(request.url());
      request = request.redirectedFrom();
    }

    expect(chain).toEqual(['http://localhost:3000/']);
  });

  test('Allow navigating to /login as guest user', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('Allow navigating to /register as guest user', async ({ page }) => {
    await page.goto('/register');
    await page.waitForURL('/register');
    await expect(page).toHaveURL('/register');
  });

  test('Do not show email in user menu for guest user', async ({ page }) => {
    await page.goto('/');

    const sidebarToggleButton = page.getByTestId('sidebar-toggle-button');
    await sidebarToggleButton.click();

    const userEmail = page.getByTestId('user-email');
    await expect(userEmail).toContainText('Guest');
  });
});

test.describe.serial('Login and Registration', () => {
  let authPage: AuthPage;

  const testUser = generateRandomTestUser();

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test('Register a new user', async ({ page }) => {
    await authPage.register(testUser.email, testUser.password);
    await authPage.expectSuccessToast('Account created successfully!');
    await expect(page).toHaveURL('/');
  });

  test('Login with existing user', async ({ page }) => {
    await authPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL('/');

    const isLoggedIn = await authPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test('Show error on invalid credentials', async ({ page }) => {
    await authPage.login('invalid@email.com', 'wrongpassword');
    await authPage.expectErrorToast('Invalid credentials');
  });

  test('Logout successfully', async ({ page }) => {
    await authPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL('/');

    await authPage.logout();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Authenticated Session', () => {
  test('Preserve session across page reloads', async ({ adaContext }) => {
    await adaContext.page.goto('/');

    const authPage = new AuthPage(adaContext.page);
    const emailBefore = await authPage.getUserEmail();

    await adaContext.page.reload();

    const emailAfter = await authPage.getUserEmail();
    expect(emailBefore).toEqual(emailAfter);
    expect(emailBefore).not.toEqual('Guest');
  });

  test('Create new chat and verify URL changes', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.sendUserMessage('Hello, world!');
    await chatPage.isGenerationComplete();

    await chatPage.hasChatIdInUrl();
  });

  test('Maintain separate sessions for different users', async ({
    adaContext,
    babbageContext,
  }) => {
    const authPageAda = new AuthPage(adaContext.page);
    const authPageBabbage = new AuthPage(babbageContext.page);

    await adaContext.page.goto('/');
    await babbageContext.page.goto('/');

    const emailAda = await authPageAda.getUserEmail();
    const emailBabbage = await authPageBabbage.getUserEmail();

    expect(emailAda).not.toEqual(emailBabbage);
    expect(emailAda).not.toEqual('Guest');
    expect(emailBabbage).not.toEqual('Guest');
  });
});