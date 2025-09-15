import { expect, test } from '../fixtures';
import { ChatPage } from '../pages/chat';

test.describe('Model Selection', () => {
  test('Select different models from selector', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    // Test selecting standard model
    await chatPage.chooseModelFromSelector('chat-model');
    expect(await chatPage.getSelectedModel()).toBe('Chat model');

    await chatPage.sendUserMessage('Hello from standard model');
    await chatPage.isGenerationComplete();

    // Test selecting reasoning model
    await chatPage.chooseModelFromSelector('chat-model-reasoning');
    expect(await chatPage.getSelectedModel()).toBe('Reasoning model');

    await chatPage.sendUserMessage('Hello from reasoning model');
    await chatPage.isGenerationComplete();
  });

  test('Model selection persists in conversation', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await chatPage.chooseModelFromSelector('chat-model-reasoning');
    const initialModel = await chatPage.getSelectedModel();

    await chatPage.sendUserMessage('First message');
    await chatPage.isGenerationComplete();

    await chatPage.sendUserMessage('Second message');
    await chatPage.isGenerationComplete();

    const currentModel = await chatPage.getSelectedModel();
    expect(currentModel).toBe(initialModel);
  });

  test('Model selection resets for new chat', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    // Select reasoning model
    await chatPage.chooseModelFromSelector('chat-model-reasoning');
    expect(await chatPage.getSelectedModel()).toBe('Reasoning model');

    // Create new chat
    await chatPage.createNewChat();

    // Should reset to default model
    const currentModel = await chatPage.getSelectedModel();
    expect(currentModel).toBe('Chat model');
  });

  test('Model selector shows all available models', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await adaContext.page.getByTestId('model-selector').click();

    const chatModel = adaContext.page.getByTestId('model-selector-item-chat-model');
    const reasoningModel = adaContext.page.getByTestId('model-selector-item-chat-model-reasoning');

    await expect(chatModel).toBeVisible();
    await expect(reasoningModel).toBeVisible();

    // Close selector
    await adaContext.page.keyboard.press('Escape');
  });

  test('Model selector closes after selection', async ({ adaContext }) => {
    const chatPage = new ChatPage(adaContext.page);
    await chatPage.createNewChat();

    await adaContext.page.getByTestId('model-selector').click();

    const modelList = adaContext.page.getByRole('listbox');
    await expect(modelList).toBeVisible();

    await adaContext.page.getByTestId('model-selector-item-chat-model').click();

    await expect(modelList).not.toBeVisible();
  });
});