'use client';

import type { ComponentType, SVGProps } from 'react';
import {
  Keyboard,
  SquareArrowOutUpRight,
  Ruler,
  Gauge,
  Building2,
  DollarSign,
  Sparkles,
} from 'lucide-react';

export type CategoryKey =
  | 'inputModalities'
  | 'outputModalities'
  | 'contextLength'
  | 'maxTokens'
  | 'providers'
  | 'pricing'
  | 'features';

export type CategoryEntry = {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const MODEL_CATEGORIES: Record<CategoryKey, CategoryEntry> = {
  inputModalities: { label: 'Input Modalities', Icon: Keyboard },
  outputModalities: { label: 'Output Modalities', Icon: SquareArrowOutUpRight },
  contextLength: { label: 'Context Length', Icon: Ruler },
  maxTokens: { label: 'Max Output Tokens', Icon: Gauge },
  providers: { label: 'Providers', Icon: Building2 },
  pricing: { label: 'Pricing', Icon: DollarSign },
  features: { label: 'Features', Icon: Sparkles },
};
