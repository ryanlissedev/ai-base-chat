import * as fs from 'node:fs';
import * as path from 'node:path';
import { legacyChatModels } from '../../lib/ai/legacy-models';
import { expect, type Page } from '@playwright/test';

export class ChatPage {
  constructor(private page: Page) {}

  public get sendButton() {
    return this.page.getByTestId('send-button');
  }

  public get stopButton() {
    return this.page.getByTestId('stop-button');
  }

  public get multimodalInput() {
    return this.page.getByTestId('multimodal-input');
  }

  async createNewChat() {
    await this.page.goto('/');
  }

  public getCurrentURL(): string {
    return this.page.url();
  }

  async sendUserMessage(message: string) {
    // Find the actual textarea/input inside the multimodal input
    const textInput = this.page.locator('[data-testid="multimodal-input"]').locator('textarea, [contenteditable="true"]').first();
    await textInput.click();
    await textInput.fill(message);
    
    // Wait for the button to exist (either send-button or stop-button)
    // and be enabled (status = 'ready', not disabled)
    await this.page.waitForFunction(() => {
      const sendButton = document.querySelector('[data-testid="send-button"]');
      const stopButton = document.querySelector('[data-testid="stop-button"]');
      
      // Check if send button exists and is enabled
      if (sendButton) {
        return !sendButton.hasAttribute('disabled');
      }
      
      // If only stop button exists, the AI is generating - wait for send button
      return false;
    }, { timeout: 10000 });
    
    // Click the send button (should exist and be enabled now)
    await this.sendButton.click();
  }

  async isGenerationComplete() {
    // Wait for the API call to start
    await this.page.waitForResponse((response) =>
      response.url().includes('/api/chat'),
    );
    
    // Wait for assistant message to appear and the send button to be enabled again
    await this.page.waitForSelector('[data-testid="message-assistant"]', {
      timeout: 15000,
      state: 'visible'
    });
    
    // Wait for generation to complete (send button becomes enabled)
    await this.page.waitForFunction(() => {
      const sendButton = document.querySelector('[data-testid="send-button"]');
      const stopButton = document.querySelector('[data-testid="stop-button"]');
      
      // Generation is complete when send button exists and is enabled
      if (sendButton) {
        return !sendButton.hasAttribute('disabled');
      }
      
      // If only stop button exists, generation is still in progress
      return false;
    }, { timeout: 15000 });
  }

  async isVoteComplete() {
    const response = await this.page.waitForResponse((response) =>
      response.url().includes('/api/trpc'),
    );

    await response.finished();
  }

  async hasChatIdInUrl() {
    await expect(this.page).toHaveURL(
      /\/chat\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  }

  async sendUserMessageFromSuggestion() {
    await this.page
      .getByRole('button', { name: 'What are the advantages of' })
      .click();
  }

  async isElementVisible(elementId: string) {
    await expect(this.page.getByTestId(elementId)).toBeVisible();
  }

  async isElementNotVisible(elementId: string) {
    await expect(this.page.getByTestId(elementId)).not.toBeVisible();
  }

  async addImageAttachment() {
    this.page.on('filechooser', async (fileChooser) => {
      const filePath = path.join(
        process.cwd(),
        'public',
        'images',
        'mouth of the seine, monet.jpg',
      );
      const imageBuffer = fs.readFileSync(filePath);

      await fileChooser.setFiles({
        name: 'mouth of the seine, monet.jpg',
        mimeType: 'image/jpeg',
        buffer: imageBuffer,
      });
    });

    await this.page.getByTestId('attachments-button').click();
  }

  public async getSelectedModel() {
    const modelId = await this.page.getByTestId('model-selector').innerText();
    return modelId;
  }

  public async chooseModelFromSelector(chatModelId: string) {
    const chatModel = legacyChatModels.find(
      (chatModel) => chatModel.id === chatModelId,
    );

    if (!chatModel) {
      throw new Error(`Model with id ${chatModelId} not found`);
    }

    await this.page.getByTestId('model-selector').click();
    await this.page.getByTestId(`model-selector-item-${chatModelId}`).click();
    expect(await this.getSelectedModel()).toBe(chatModel.name);
  }

  async getRecentAssistantMessage() {
    // Wait for assistant messages to appear
    await this.page.waitForSelector('[data-testid="message-assistant"]', {
      timeout: 10000,
      state: 'visible'
    });
    
    const messageElements = await this.page
      .getByTestId('message-assistant')
      .all();
    
    if (messageElements.length === 0) {
      throw new Error('No assistant messages found');
    }
    
    const lastMessageElement = messageElements[messageElements.length - 1];

    const content = await lastMessageElement
      .getByTestId('message-content')
      .innerText()
      .catch(() => null);

    const reasoningElement = await lastMessageElement
      .getByTestId('message-reasoning')
      .isVisible()
      .then(async (visible) =>
        visible
          ? await lastMessageElement
              .getByTestId('message-reasoning')
              .innerText()
          : null,
      )
      .catch(() => null);

    return {
      element: lastMessageElement,
      content,
      reasoning: reasoningElement,
      async toggleReasoningVisibility() {
        await lastMessageElement
          .getByTestId('message-reasoning-toggle')
          .click();
      },
      async upvote() {
        await lastMessageElement.getByTestId('message-upvote').click();
      },
      async downvote() {
        await lastMessageElement.getByTestId('message-downvote').click();
      },
    };
  }

  async getRecentUserMessage() {
    // Wait for user messages to appear
    await this.page.waitForSelector('[data-testid="message-user"]', {
      timeout: 10000,
      state: 'visible'
    });
    
    const messageElements = await this.page.getByTestId('message-user').all();
    
    if (messageElements.length === 0) {
      throw new Error('No user messages found');
    }
    
    const lastMessageElement = messageElements[messageElements.length - 1];

    const content = await lastMessageElement.innerText();

    const hasAttachments = await lastMessageElement
      .getByTestId('message-attachments')
      .isVisible()
      .catch(() => false);

    const attachments = hasAttachments
      ? await lastMessageElement.getByTestId('message-attachments').all()
      : [];

    const page = this.page;

    return {
      element: lastMessageElement,
      content,
      attachments,
      async edit(newMessage: string) {
        await page.getByTestId('message-edit-button').click();
        await page.getByTestId('message-editor').fill(newMessage);
        await page.getByTestId('message-editor-send-button').click();
        await expect(
          page.getByTestId('message-editor-send-button'),
        ).not.toBeVisible();
      },
    };
  }
}
