import type { ModelId } from '../models/model-id';
import type { ToolName } from '../ai/types';
import type { DBMessage } from '../db/schema';
import type { UIChat } from './uiChat';
import { chatModels } from '@/lib/ai/all-models';

export interface AnonymousSession {
  id: string;
  remainingCredits: number;
  createdAt: Date;
}

// Anonymous chat structure matching the DB chat structure
export interface AnonymousChat extends UIChat {}

// Anonymous message structure matching the DB message structure
export interface AnonymousMessage extends DBMessage {}

// Resolve available models for guests. If ANONYMOUS_MODELS is not set or is
// 'all', allow all chat-capable models. If it is a comma-separated list, only
// allow those present in our catalog.
const envAnonymousModels = (process.env.ANONYMOUS_MODELS || 'all').trim();
const ALL_CHAT_MODELS = chatModels.map((m) => m.id) as ModelId[];
const AVAILABLE_MODELS: readonly ModelId[] =
  envAnonymousModels.toLowerCase() === 'all'
    ? (ALL_CHAT_MODELS as readonly ModelId[])
    : ((envAnonymousModels
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .filter((id) => (ALL_CHAT_MODELS as ModelId[]).includes(id as ModelId)) as ModelId[]) as readonly ModelId[]);

export const ANONYMOUS_LIMITS = {
  // High defaults as requested; effectively no limits for guests by default.
  CREDITS: Number(process.env.ANONYMOUS_CREDITS ?? 10000),
  AVAILABLE_MODELS: AVAILABLE_MODELS,
  // Keep tools minimal by default; can be expanded server-side if desired.
  // To enable all tools for guests, set this to include every tool name.
  AVAILABLE_TOOLS: [
    'createDocument',
    'updateDocument',
    'retrieve',
    'webSearch',
    'stockChart',
    'codeInterpreter',
    'generateImage',
    'getWeather',
    'requestSuggestions',
    'readDocument',
    'deepResearch',
    'fileSearch',
  ] satisfies ToolName[],
  SESSION_DURATION: 2147483647, // Max session time
  // Very high rate-limit defaults (can be overridden via env)
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: Number(process.env.ANONYMOUS_RPM ?? 10000),
    REQUESTS_PER_MONTH: Number(process.env.ANONYMOUS_RPMONTH ?? 10000),
  },
} as const;
