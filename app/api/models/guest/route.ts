import { NextResponse } from 'next/server';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';
import { chatModels, getModelDefinition } from '@/lib/ai/all-models';

export async function GET() {
  const envModels = process.env.ANONYMOUS_MODELS || 'all';
  const availableModels = ANONYMOUS_LIMITS.AVAILABLE_MODELS.map((id) => {
    const def = getModelDefinition(id);
    return {
      id,
      name: def?.name,
      provider: def?.owned_by,
      description: def?.description,
    };
  });

  return NextResponse.json({
    config: {
      ANONYMOUS_MODELS: envModels,
      ANONYMOUS_CREDITS: ANONYMOUS_LIMITS.CREDITS,
      ANONYMOUS_RPM: ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MINUTE,
      ANONYMOUS_RPMONTH: ANONYMOUS_LIMITS.RATE_LIMIT.REQUESTS_PER_MONTH,
    },
    totalChatModels: chatModels.length,
    availableForGuests: availableModels.length,
    models: availableModels,
  });
}
