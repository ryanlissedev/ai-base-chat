import { describe, it, expect, beforeEach } from 'vitest';
import { fileSearch } from './file-search';
import type { StreamWriter } from '../types';
import type { Session } from 'next-auth';

describe('fileSearch', () => {
  let mockDataStream: StreamWriter;
  let mockSession: Session;

  beforeEach(() => {
    mockDataStream = {} as StreamWriter;
    mockSession = {
      user: { id: 'test-user' },
      expires: 'never',
    } as Session;
  });

  it('should create a file search tool with proper AI SDK tool interface', () => {
    const tool = fileSearch({ dataStream: mockDataStream, session: mockSession });

    expect(tool).toHaveProperty('description');
    expect(tool).toHaveProperty('inputSchema');
    expect(tool).toHaveProperty('execute');
    expect(tool.description).toBe('Search through documents in the knowledge base for relevant information');
  });

  it('should have input schema defined', () => {
    const tool = fileSearch({ dataStream: mockDataStream, session: mockSession });
    expect(tool).toHaveProperty('inputSchema');
  });

  it('should execute search and return results', async () => {
    const tool = fileSearch({ dataStream: mockDataStream, session: mockSession });
    const result: any = await (tool.execute as any)({ query: 'test query' }, {});
    expect(result).toHaveProperty('results');
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results[0]).toHaveProperty('content');
    expect(result.results[0]).toHaveProperty('metadata');
    expect(result.results[0].content).toContain('test query');
  });

  it('should use environment variable for vectorstore ID', async () => {
    const originalEnv = process.env.OPENAI_VECTORSTORE_ID;
    process.env.OPENAI_VECTORSTORE_ID = 'vs_custom_test_id';

    const tool = fileSearch({ dataStream: mockDataStream, session: mockSession });
    const result: any = await (tool.execute as any)({ query: 'test' }, {});
    
    expect(result.results[0].metadata.vectorStoreId).toBe('vs_custom_test_id');

    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.OPENAI_VECTORSTORE_ID = originalEnv;
    } else {
      process.env.OPENAI_VECTORSTORE_ID = undefined;
    }
  });

  it('should use default vectorstore ID when environment variable is not set', async () => {
    const originalEnv = process.env.OPENAI_VECTORSTORE_ID;
    delete process.env.OPENAI_VECTORSTORE_ID;

    const tool = fileSearch({ dataStream: mockDataStream, session: mockSession });
    const result: any = await (tool.execute as any)({ query: 'test' }, {});
    
    expect(result.results[0].metadata.vectorStoreId).toBe('vs_68c6a2b65df88191939f503958af019e');

    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.OPENAI_VECTORSTORE_ID = originalEnv;
    }
  });
});
