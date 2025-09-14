import { describe, it, expect } from 'vitest';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';

describe('anonymous limits include fileSearch tool', () => {
  it('AVAILABLE_TOOLS contains fileSearch', () => {
    expect(ANONYMOUS_LIMITS.AVAILABLE_TOOLS).toContain('fileSearch' as any);
  });
});

