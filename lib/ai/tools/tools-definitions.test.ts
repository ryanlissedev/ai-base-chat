import { describe, it, expect } from 'vitest';
import { toolsDefinitions, allTools } from '@/lib/ai/tools/tools-definitions';

describe('toolsDefinitions - fileSearch', () => {
  it('includes fileSearch with cost 2', () => {
    expect(toolsDefinitions.fileSearch).toBeDefined();
    expect(toolsDefinitions.fileSearch.cost).toBe(2);
    expect(toolsDefinitions.fileSearch.name).toBe('fileSearch');
  });

  it('is present in allTools list', () => {
    expect(allTools.includes('fileSearch' as any)).toBe(true);
  });
});

