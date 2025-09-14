import { describe, it, expect } from 'vitest';
import { getModelProviderOptions } from '@/lib/ai/providers';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/all-models';

describe('getModelProviderOptions - OpenAI file search', () => {
  it('includes file_search tool for OpenAI chat model', () => {
    const opts = getModelProviderOptions(DEFAULT_CHAT_MODEL) as any;
    expect(opts).toBeTruthy();
    expect('openai' in opts).toBe(true);
    expect(opts.openai?.tools?.file_search).toBeTruthy();
  });
});

