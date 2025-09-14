import { describe, it, expect } from 'vitest';
import { fileSearch } from '@/lib/ai/tools/file-search';

// Minimal no-op dataStream stub matching the required type shape at runtime
const dataStream: any = { write: () => {} };

describe('fileSearch tool factory', () => {
  it('returns a valid tool instance', () => {
    const tool = fileSearch({ dataStream });
    expect(tool).toBeTruthy();
  });
});
