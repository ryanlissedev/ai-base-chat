

// Mock responses expected by the E2E tests
const TEST_RESPONSES: Record<string, string> = {
  // Default responses for grass questions
  'why is grass green': "It's just green duh!",
  'why is the sky blue': "It's just blue duh!",

  // Next.js suggestion response
  'what are the advantages of': 'With Next.js, you can ship fast!',

  // Image analysis response
  'who painted this': 'This painting is by Monet!',

  // Weather tool response
  "what's the weather in sf": 'The current temperature in San Francisco is 17°C.',

  // Default fallback
  default: 'Test response from mock provider',
};

export class TestLanguageModel {
  readonly specificationVersion = 'v1';
  readonly provider = 'test';
  readonly modelId = 'test-model';

  async doGenerate(options: any) {
    const messages = options.messages || [];
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content?.toLowerCase() || '';

    // Find matching response
    let response = TEST_RESPONSES.default;
    for (const [key, value] of Object.entries(TEST_RESPONSES)) {
      if (key !== 'default' && userContent.includes(key)) {
        response = value;
        break;
      }
    }

    // Simulate streaming response
    const chunks = response.split(' ');

    return {
      text: response,
      usage: {
        promptTokens: 10,
        completionTokens: response.length / 4,
      },
      finishReason: 'stop' as const,
      rawCall: { rawPrompt: null, rawSettings: {} },
      rawResponse: { headers: {} },
      response: {
        id: 'test-response-id',
        timestamp: new Date(),
        modelId: this.modelId,
      },
      providerMetadata: {},
      experimental_providerMetadata: {},
    };
  }

  async doStream(options: any) {
    const messages = options.messages || [];
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content?.toLowerCase() || '';

    // Find matching response
    let response = TEST_RESPONSES.default;
    for (const [key, value] of Object.entries(TEST_RESPONSES)) {
      if (key !== 'default' && userContent.includes(key)) {
        response = value;
        break;
      }
    }

    // Create async generator for streaming
    const streamGenerator = async function* () {
      const chunks = response.split(' ');

      for (let i = 0; i < chunks.length; i++) {
        const chunk = i === 0 ? chunks[i] : ` ${chunks[i]}`;
        yield {
          type: 'text-delta' as const,
          textDelta: chunk,
        };

        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      yield {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: {
          promptTokens: 10,
          completionTokens: response.length / 4,
        },
        providerMetadata: {},
        experimental_providerMetadata: {},
      };
    };

    return {
      stream: streamGenerator(),
      rawCall: { rawPrompt: null, rawSettings: {} },
      rawResponse: { headers: {} },
    };
  }
}

// Mock tool responses for specific tools
export const TEST_TOOL_RESPONSES: Record<string, any> = {
  webSearch: {
    results: [
      {
        title: 'Weather in San Francisco',
        content: 'Current temperature: 17°C',
        url: 'https://example.com/weather'
      }
    ]
  },

  generateImage: {
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    alt: 'Generated test image'
  },

  fileSearch: {
    results: [
      {
        title: 'Test Document',
        content: 'Test file search result',
        path: '/test/document.txt'
      }
    ]
  }
};

export function createTestLanguageModel() {
  return new TestLanguageModel();
}