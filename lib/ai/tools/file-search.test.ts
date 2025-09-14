import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileSearch } from './file-search';
import type { StreamWriter } from '../types';
import type { Session } from 'next-auth';

// Mock the OpenAI SDK
vi.mock('@ai-sdk/openai', () => ({
  openai: {
    tools: {
      fileSearch: vi.fn(),
    },
  },
}));

describe('fileSearch', () => {
  let mockDataStream: StreamWriter;
  let mockSession: Session;

  beforeEach(() => {
    mockDataStream = {} as StreamWriter;
    mockSession = {
      user: { id: 'test-user' },
      expires: 'never',
    } as Session;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should create a file search tool with default vectorstore ID', async () => {
    const { openai } = await import('@ai-sdk/openai');
    
    fileSearch({ dataStream: mockDataStream, session: mockSession });

    expect(openai.tools.fileSearch).toHaveBeenCalledWith({
      vectorStoreIds: ['vs_68c6a2b65df88191939f503958af019e'],
      maxNumResults: 10,
      ranking: {
        ranker: 'auto',
      },
    });
  });

  it('should use environment variable for vectorstore ID when available', async () => {
    const originalEnv = process.env.OPENAI_VECTORSTORE_ID;
    process.env.OPENAI_VECTORSTORE_ID = 'vs_custom_test_id';

    const { openai } = await import('@ai-sdk/openai');
    
    fileSearch({ dataStream: mockDataStream, session: mockSession });

    expect(openai.tools.fileSearch).toHaveBeenCalledWith({
      vectorStoreIds: ['vs_custom_test_id'],
      maxNumResults: 10,
      ranking: {
        ranker: 'auto',
      },
    });

    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.OPENAI_VECTORSTORE_ID = originalEnv;
    } else {
      delete process.env.OPENAI_VECTORSTORE_ID;
    }
  });

  it('should accept dataStream and session parameters', () => {
    expect(() => {
      fileSearch({ dataStream: mockDataStream, session: mockSession });
    }).not.toThrow();
  });

  it('should return the result of openai.tools.fileSearch', async () => {
    const { openai } = await import('@ai-sdk/openai');
    const mockTool = { name: 'file_search', description: 'Test tool' };
    (openai.tools.fileSearch as any).mockReturnValue(mockTool);

    const result = fileSearch({ dataStream: mockDataStream, session: mockSession });

    expect(result).toBe(mockTool);
  });
});