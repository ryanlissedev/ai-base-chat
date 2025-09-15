'use client';
import type { ProviderId } from '@/lib/models/models.generated';
import { getProviderIcon as getCustomProviderIcon } from './provider-icons';

export function getProviderIcon(provider: ProviderId, size = 16) {
  return getCustomProviderIcon(provider, size);
}
