import { expect, test } from './setup-combined';
import { ChatPage } from './pages/chat';
import { ArtifactPage } from './pages/artifact';

test.describe('artifacts activity', () => {
  let chatPage: ChatPage;
  let artifactPage: ArtifactPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    artifactPage = new ArtifactPage(page);

    await chatPage.createNewChat();
  });

  test('create a text artifact', async ({ page }) => {
    await chatPage.createNewChat();

    console.log('🔍 Starting artifact creation test...');
    
    await chatPage.sendUserMessage(
      'Help me write an essay about Silicon Valley',
    );
    console.log('✅ Message sent, waiting for generation...');
    
    await artifactPage.isGenerationComplete();
    console.log('✅ Generation complete, checking artifact visibility...');

    // Add debugging - check if artifact exists at all
    const artifactExists = await page.getByTestId('artifact').count();
    console.log(`🔍 Artifact elements found: ${artifactExists}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'artifact-test-debug.png', fullPage: true });
    
    expect(artifactPage.artifact).toBeVisible();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBe(
      'A document was created and is now visible to the user.',
    );

    await chatPage.hasChatIdInUrl();
  });

  test('toggle artifact visibility', async () => {
    await chatPage.createNewChat();

    await chatPage.sendUserMessage(
      'Help me write an essay about Silicon Valley',
    );
    await artifactPage.isGenerationComplete();

    expect(artifactPage.artifact).toBeVisible();

    const assistantMessage = await chatPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBe(
      'A document was created and is now visible to the user.',
    );

    await artifactPage.closeArtifact();
    await chatPage.isElementNotVisible('artifact');
  });

  test('send follow up message after generation', async () => {
    await chatPage.createNewChat();

    await chatPage.sendUserMessage(
      'Help me write an essay about Silicon Valley',
    );
    await artifactPage.isGenerationComplete();

    expect(artifactPage.artifact).toBeVisible();

    const assistantMessage = await artifactPage.getRecentAssistantMessage();
    expect(assistantMessage.content).toBe(
      'A document was created and is now visible to the user.',
    );

    await artifactPage.sendUserMessage('Thanks!');
    await artifactPage.isGenerationComplete();

    const secondAssistantMessage = await chatPage.getRecentAssistantMessage();
    expect(secondAssistantMessage.content).toBe("You're welcome!");
  });
});
