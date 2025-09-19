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
    
    // Wait for the page to fully load and the chat interface to be ready
    // Check if we got redirected to a 404 page or if the chat interface is loading
    await this.page.waitForLoadState('networkidle');
    
    // Wait for either the multimodal input to appear (success) or a specific error state
    try {
      await this.page.waitForSelector('[data-testid="multimodal-input"]', { 
        state: 'visible', 
        timeout: 30000 
      });
    } catch (error) {
      // If multimodal input doesn't appear, check if we're on the right page
      const url = this.page.url();
      const title = await this.page.title();
      throw new Error(`Chat interface not found. Current URL: ${url}, Title: ${title}`);
    }
  }

  public getCurrentURL(): string {
    return this.page.url();
  }

  async sendUserMessage(message: string) {
    // Wait for the multimodal input to be visible and stable
    await this.page.waitForSelector('[data-testid="multimodal-input"]', { state: 'visible' });
    
    // The multimodal input uses Lexical ContentEditable, so we target the contenteditable element directly
    const textInput = this.page.locator('[data-testid="multimodal-input"]').first();
    
    // Ensure the element is ready for interaction
    await textInput.waitFor({ state: 'visible' });
    await textInput.click();
    
    // For Lexical editor, we need to clear content and type using keyboard events
    // Clear existing content with Ctrl+A and then type
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.type(message);
    
    // Wait for the send button to be available and enabled
    const sendButton = this.page.getByTestId('send-button');
    await sendButton.waitFor({ state: 'visible', timeout: 10000 });
    await sendButton.waitFor({ state: 'attached', timeout: 5000 });
    
    // Wait for the button to be enabled (not disabled)
    await this.page.waitForFunction(() => {
      const btn = document.querySelector('[data-testid="send-button"]');
      return btn && !btn.hasAttribute('disabled') && !btn.classList.contains('disabled');
    }, { timeout: 10000 });
    
    // Click the send button
    await sendButton.click();
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
