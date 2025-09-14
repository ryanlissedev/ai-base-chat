import { describe, it, expect } from 'vitest';
import { toolNameSchema, frontendToolsSchema } from '@/lib/ai/types';

describe('schemas include fileSearch', () => {
  it('toolNameSchema includes fileSearch', () => {
    const options = toolNameSchema.options;
    expect(options.includes('fileSearch' as any)).toBe(true);
  });

  it('frontendToolsSchema includes fileSearch', () => {
    const options = frontendToolsSchema.options;
    expect(options.includes('fileSearch' as any)).toBe(true);
  });
});

