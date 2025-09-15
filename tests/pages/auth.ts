import { expect, type Page } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async register(email: string, password: string) {
    await this.page.goto('/register');
    await this.page.getByPlaceholder('user@acme.com').click();
    await this.page.getByPlaceholder('user@acme.com').fill(email);
    await this.page.getByLabel('Password').click();
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign Up' }).click();
  }

  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.getByPlaceholder('user@acme.com').click();
    await this.page.getByPlaceholder('user@acme.com').fill(email);
    await this.page.getByLabel('Password').click();
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async logout() {
    const sidebarToggleButton = this.page.getByTestId('sidebar-toggle-button');
    await sidebarToggleButton.click();

    const userNavButton = this.page.getByTestId('user-nav-button');
    await expect(userNavButton).toBeVisible();
    await userNavButton.click();

    const logoutButton = this.page.getByTestId('user-nav-item-logout');
    await logoutButton.click();
  }

  async isLoggedIn() {
    const sidebarToggleButton = this.page.getByTestId('sidebar-toggle-button');
    await sidebarToggleButton.click();

    const userEmail = this.page.getByTestId('user-email');
    const emailText = await userEmail.innerText();
    return emailText !== 'Guest';
  }

  async getUserEmail() {
    const sidebarToggleButton = this.page.getByTestId('sidebar-toggle-button');
    await sidebarToggleButton.click();

    const userEmail = this.page.getByTestId('user-email');
    return await userEmail.innerText();
  }

  async expectSuccessToast(message: string) {
    await expect(this.page.getByTestId('toast')).toContainText(message);
  }

  async expectErrorToast(message: string) {
    await expect(this.page.getByTestId('toast')).toContainText(message);
  }
}