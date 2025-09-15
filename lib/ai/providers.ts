import { extractReasoningMiddleware, wrapLanguageModel } from 'ai';

import { openai, type OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { getImageModelDefinition, getModelDefinition } from './all-models';
import { createGatewayProvider } from '@ai-sdk/gateway';
import type { ImageModelId, ModelId } from '../models/model-id';
import { getModelAndProvider } from '../models/utils';

const telemetryConfig = {
  telemetry: {
    isEnabled: true,
    functionId: 'get-language-model',
  },
};

export const getLanguageModel = (modelId: ModelId) => {
  const model = getModelDefinition(modelId);

  // Use AI Gateway with default baseURL and optional API key
  const gatewayProvider = createGatewayProvider({
    baseURL: process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1/ai',
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  const languageProvider = gatewayProvider(model.id);

  // Wrap with reasoning middleware if the model supports reasoning
  if (model.features?.reasoning && model.owned_by === 'xai') {
    console.log('Wrapping reasoning middleware for', model.id);
    return wrapLanguageModel({
      model: languageProvider,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  return languageProvider;
};

export const getImageModel = (modelId: ImageModelId) => {
  const model = getImageModelDefinition(modelId);
  const { model: modelIdShort, provider } = getModelAndProvider(modelId);

  if (model.owned_by === 'openai') {
    return openai.image(modelIdShort);
  }
  throw new Error(`Provider ${model.owned_by} not supported`);
};

// Note: Avoid creating model instances at module load to prevent
// build-time env key checks in serverless/SSR environments.

export const getModelProviderOptions = (
  providerModelId: ModelId,
):
  | {
      openai: OpenAIResponsesProviderOptions;
    }
  | {
      anthropic: AnthropicProviderOptions;
    }
  | {
      xai: Record<string, never>;
    }
  | {
      google: GoogleGenerativeAIProviderOptions;
    }
  | Record<string, never> => {
  const model = getModelDefinition(providerModelId);
  if (model.owned_by === 'openai') {
    if (model.features?.reasoning) {
      return {
        openai: {
          reasoningSummary: 'auto',
          ...(model.id === 'openai/gpt-5' ||
          model.id === 'openai/gpt-5-mini' ||
          model.id === 'openai/gpt-5-nano'
            ? { reasoningEffort: 'low' }
            : {}),
        } satisfies OpenAIResponsesProviderOptions,
      };
    } else {
      return { openai: {} };
    }
  } else if (model.owned_by === 'anthropic') {
    if (model.features?.reasoning) {
      return {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens: 4096,
          },
        } satisfies AnthropicProviderOptions,
      };
    } else {
      return { anthropic: {} };
    }
  } else if (model.owned_by === 'xai') {
    return {
      xai: {},
    };
  } else if (model.owned_by === 'google') {
    if (model.features?.reasoning) {
      return {
        google: {
          thinkingConfig: {
            thinkingBudget: 10000,
          },
        },
      };
    } else {
      return { google: {} };
    }
  } else {
    return {};
  }
};
