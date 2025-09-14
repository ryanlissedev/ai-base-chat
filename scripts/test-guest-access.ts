#!/usr/bin/env tsx
/**
 * Test script to verify guest chat access functionality
 * Run with: npx tsx scripts/test-guest-access.ts
 */

import { ANONYMOUS_LIMITS } from '../lib/types/anonymous';
import { chatModels, getModelDefinition } from '../lib/ai/all-models';
import type { ModelId } from '../lib/models/model-id';

console.log('🧪 Testing Guest Access Configuration\n');
console.log('=' .repeat(60));

// 1. Check environment configuration
console.log('\n📋 Environment Configuration:');
console.log(`ANONYMOUS_MODELS: ${process.env.ANONYMOUS_MODELS || 'all (default)'}`);
console.log(`ANONYMOUS_CREDITS: ${process.env.ANONYMOUS_CREDITS || '10000 (default)'}`);
console.log(`ANONYMOUS_RPM: ${process.env.ANONYMOUS_RPM || '10000 (default)'}`);
console.log(`ANONYMOUS_RPMONTH: ${process.env.ANONYMOUS_RPMONTH || '10000 (default)'}`);

// 2. Check parsed limits
console.log('\n🔍 Parsed Anonymous Limits:');
console.log(`Credits: ${ANONYMOUS_LIMITS.CREDITS}`);
console.log(`Rate Limit (RPM): ${ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MINUTE}`);
console.log(`Rate Limit (Monthly): ${ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MONTH}`);
console.log(`Session Duration: ${ANONYMOUS_LIMITS.SESSION_DURATION}`);
console.log(`Available Tools: ${ANONYMOUS_LIMITS.AVAILABLE_TOOLS.length} tools`);

// 3. Model availability analysis
console.log('\n🤖 Model Availability:');
console.log(`Total chat models in catalog: ${chatModels.length}`);
console.log(`Models available for guests: ${ANONYMOUS_LIMITS.AVAILABLE_MODELS.length}`);

// 4. List available models with details
console.log('\n📝 Guest-Accessible Models:');
const envModels = (process.env.ANONYMOUS_MODELS || 'all').trim();
if (envModels.toLowerCase() === 'all') {
  console.log('✅ All models enabled for guests');
} else {
  console.log(`⚙️ Custom model list: ${envModels}`);
}

console.log('\nDetailed model list:');
const groupedModels: Record<string, ModelId[]> = {};
ANONYMOUS_LIMITS.AVAILABLE_MODELS.forEach((modelId) => {
  const def = getModelDefinition(modelId);
  if (def) {
    const provider = def.owned_by || 'unknown';
    if (!groupedModels[provider]) {
      groupedModels[provider] = [];
    }
    groupedModels[provider].push(modelId);
  }
});

Object.entries(groupedModels).forEach(([provider, models]) => {
  console.log(`\n  ${provider}:`);
  models.forEach((modelId) => {
    const def = getModelDefinition(modelId);
    console.log(`    - ${modelId} (${def?.name || 'Unknown'})`);
  });
});

// 5. Check for missing models (if custom list)
if (envModels.toLowerCase() !== 'all') {
  const requestedModels = envModels.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  const invalidModels = requestedModels.filter(
    (id) => !chatModels.find((m) => m.id === id)
  );
  
  if (invalidModels.length > 0) {
    console.log('\n⚠️ Invalid model IDs in ANONYMOUS_MODELS:');
    invalidModels.forEach((id) => console.log(`  - ${id}`));
  }
}

// 6. Test model validation logic
console.log('\n✅ Validation Tests:');
const testModels = ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'invalid/model'];
testModels.forEach((modelId) => {
  const isAllowed = ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(modelId as any);
  console.log(`  ${modelId}: ${isAllowed ? '✅ Allowed' : '❌ Blocked'}`);
});

// 7. Summary
console.log('\n' + '=' .repeat(60));
console.log('📊 Summary:');
if (ANONYMOUS_LIMITS.AVAILABLE_MODELS.length === 0) {
  console.log('❌ No models available for guests! Check ANONYMOUS_MODELS env var.');
} else if (ANONYMOUS_LIMITS.AVAILABLE_MODELS.length === chatModels.length) {
  console.log('✅ All chat models are available for guest users');
} else {
  console.log(`⚙️ ${ANONYMOUS_LIMITS.AVAILABLE_MODELS.length}/${chatModels.length} models available for guests`);
}

console.log('\n💡 Guest Access Features:');
console.log('  - No login required');
console.log('  - Model selection from environment');
console.log('  - Server-side API key management');
console.log('  - IP-based rate limiting');
console.log('  - Session-based credit system');
console.log('  - Tool access for enhanced functionality');

console.log('\n🔐 Security Notes:');
console.log('  - API keys remain server-side only');
console.log('  - Rate limits prevent abuse');
console.log('  - Credit system limits per-session usage');
console.log('  - Models can be restricted via ANONYMOUS_MODELS env var');

console.log('\n✨ Done!');