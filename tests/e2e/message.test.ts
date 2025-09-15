import { expect, test } from '../fixtures';
import { ChatPage } from '../pages/chat';

test.describe('Message Interactions', () => {
  test('Send and receive messages', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.sendUserMessage('What is 2 + 2?');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBeTruthy();
    expect(assistantMessage.content).toContain('4');
  });

  test('Edit user message', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.sendUserMessage('What is 2 + 2?');
    await chatPage.isGenerationComplete();

    const userMessage = await chatPage.getRecentUserMessage();
    await userMessage.edit('What is 3 + 3?');
    await chatPage.isGenerationComplete();

    const updatedUserMessage = await chatPage.getRecentUserMessage();
    expect(updatedUserMessage.content).toContain('What is 3 + 3?');

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toContain('6');
  });

  test('Stop message generation', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.sendUserMessage('Write a long story about space exploration');

    await chatPage.isElementVisible('stop-button');
    await chatPage.stopButton.click();

    await expect(chatPage.stopButton).not.toBeVisible();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test('Send message with suggestion', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.sendUserMessageFromSuggestion();
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBeTruthy();
  });

  test('Vote on messages', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.sendUserMessage('Hello!');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();

    await assistantMessage.upvote();
    await chatPage.isVoteComplete();

    await assistantMessage.downvote();
    await chatPage.isVoteComplete();
  });

  test('Handle multiline messages', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    const multilineMessage = `Line 1
Line 2
Line 3`;

    await chatPage.sendUserMessage(multilineMessage);
    await chatPage.isGenerationComplete();

    const userMessage = await chatPage.getRecentUserMessage();
    expect(userMessage.content).toContain('Line 1');
    expect(userMessage.content).toContain('Line 2');
    expect(userMessage.content).toContain('Line 3');
  });

  test('Send message with image attachment', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.addImageAttachment();
    await chatPage.sendUserMessage('What is in this image?');
    await chatPage.isGenerationComplete();

    const userMessage = await chatPage.getRecentUserMessage();
    expect(userMessage.attachments.length).toBeGreaterThan(0);

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBeTruthy();
  });

  test('Handle empty messages', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.multimodalInput.click();
    await chatPage.multimodalInput.fill('');

    await expect(chatPage.sendButton).toBeDisabled();
  });

  test('Message persistence across navigation', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.sendUserMessage('Remember this message');
    await chatPage.isGenerationComplete();

    const chatUrl = chatPage.getCurrentURL();

    await adaContext.page.goto('/');
    await adaContext.page.goto(chatUrl);

    const userMessage = await chatPage.getRecentUserMessage();
    expect(userMessage.content).toContain('Remember this message');

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBeTruthy();
  });
});

test.describe('Reasoning Model Tests', () => {
  test('Display reasoning toggle for reasoning models', async ({ curieContext }) => {
    const chatPage = new ChatPage(curieContext.page);
    await chatPage.createNewChat();

    await chatPage.sendUserMessage('Solve: 5x + 3 = 18');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.reasoning).toBeTruthy();

    await assistantMessage.toggleReasoningVisibility();
    await curieContext.page.waitForTimeout(500);

    const isReasoningVisible = await curieContext.page
      .getByTestId('message-reasoning')
      .isVisible();
    expect(isReasoningVisible).toBe(false);
  });

  test('No reasoning toggle for non-reasoning models', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();
    await chatPage.chooseModelFromSelector('chat-model');

    await chatPage.sendUserMessage('Hello!');
    await chatPage.isGenerationComplete();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.reasoning).toBeNull();

    const reasoningToggle = adaContext.page.getByTestId('message-reasoning-toggle');
    await expect(reasoningToggle).not.toBeVisible();
  });
});