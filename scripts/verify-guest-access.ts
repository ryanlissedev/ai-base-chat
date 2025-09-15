#!/usr/bin/env tsx
/**
 * Verification script for guest access functionality
 * Checks that all components work together correctly
 */

import { ANONYMOUS_LIMITS } from '../lib/types/anonymous';
import { chatModels } from '../lib/ai/all-models';
import type { ModelId } from '../lib/models/model-id';

// Color codes for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`${GREEN}✓${RESET} ${name}`);
    if (details) console.log(`  ${details}`);
    passed++;
  } else {
    console.log(`${RED}✗${RESET} ${name}`);
    if (details) console.log(`  ${RED}${details}${RESET}`);
    failed++;
  }
}

console.log('🔍 Verifying Guest Access Implementation\n');

// Test 1: Environment variables are parsed correctly
test(
  'Environment variables parsed',
  typeof ANONYMOUS_LIMITS.CREDITS === 'number' &&
    typeof ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MINUTE === 'number',
  `Credits: ${ANONYMOUS_LIMITS.CREDITS}, RPM: ${ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MINUTE}`,
);

// Test 2: Models are available for guests
test(
  'Guest models configured',
  Array.isArray(ANONYMOUS_LIMITS.AVAILABLE_MODELS) &&
    ANONYMOUS_LIMITS.AVAILABLE_MODELS.length > 0,
  `${ANONYMOUS_LIMITS.AVAILABLE_MODELS.length} models available`,
);

// Test 3: All guest models exist in catalog
const invalidModels = ANONYMOUS_LIMITS.AVAILABLE_MODELS.filter(
  (id) => !chatModels.find((m) => m.id === id),
);
test(
  'All guest models valid',
  invalidModels.length === 0,
  invalidModels.length > 0
    ? `Invalid models: ${invalidModels.join(', ')}`
    : 'All models exist in catalog',
);

// Test 4: Tools are configured for guests
test(
  'Guest tools configured',
  Array.isArray(ANONYMOUS_LIMITS.AVAILABLE_TOOLS) &&
    ANONYMOUS_LIMITS.AVAILABLE_TOOLS.length > 0,
  `${ANONYMOUS_LIMITS.AVAILABLE_TOOLS.length} tools available`,
);

// Test 5: Session duration is set
test(
  'Session duration configured',
  typeof ANONYMOUS_LIMITS.SESSION_DURATION === 'number' &&
    ANONYMOUS_LIMITS.SESSION_DURATION > 0,
  `Session duration: ${ANONYMOUS_LIMITS.SESSION_DURATION}ms`,
);

// Test 6: Rate limits are reasonable
test(
  'Rate limits configured',
  ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MINUTE > 0 &&
    ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MONTH > 0,
  `RPM: ${ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MINUTE}, Monthly: ${ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MONTH}`,
);

// Test 7: Test specific model access based on configuration
const envModels = process.env.ANONYMOUS_MODELS || 'all';
const testModels: ModelId[] = [
  'openai/gpt-4o' as ModelId,
  'anthropic/claude-3.5-sonnet' as ModelId,
  'google/gemini-2.5-pro' as ModelId,
];

// Only test model availability if in "all" mode
// In custom mode, we're testing that the restriction works
if (envModels.toLowerCase() === 'all') {
  testModels.forEach((modelId) => {
    const isAvailable = ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(modelId);
    const modelExists = chatModels.find((m) => m.id === modelId);

    if (modelExists) {
      test(
        `Model ${modelId} accessible`,
        isAvailable,
        isAvailable ? 'Available for guests' : 'Not available for guests',
      );
    }
  });
} else {
  // In custom mode, verify that only specified models are available
  const specifiedModels = envModels
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  specifiedModels.forEach((modelId) => {
    const isAvailable = ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(
      modelId as ModelId,
    );
    test(
      `Specified model ${modelId} accessible`,
      isAvailable,
      isAvailable ? 'Available for guests' : 'Not in catalog or invalid',
    );
  });
}

// Test 8: Environment-based configuration works
if (envModels.toLowerCase() === 'all') {
  test(
    'All models mode active',
    ANONYMOUS_LIMITS.AVAILABLE_MODELS.length === chatModels.length,
    `${ANONYMOUS_LIMITS.AVAILABLE_MODELS.length} of ${chatModels.length} models available`,
  );
} else {
  const requestedCount = envModels.split(',').filter((s) => s.trim()).length;
  test(
    'Custom model list active',
    ANONYMOUS_LIMITS.AVAILABLE_MODELS.length <= requestedCount,
    `${ANONYMOUS_LIMITS.AVAILABLE_MODELS.length} models from ${requestedCount} requested`,
  );
}

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(
  `${GREEN}Passed: ${passed}${RESET} | ${RED}Failed: ${failed}${RESET}`,
);

if (failed === 0) {
  console.log(
    `\n${GREEN}✅ All tests passed! Guest access is working correctly.${RESET}`,
  );
  process.exit(0);
} else {
  console.log(
    `\n${RED}❌ Some tests failed. Please check the configuration.${RESET}`,
  );
  process.exit(1);
}
