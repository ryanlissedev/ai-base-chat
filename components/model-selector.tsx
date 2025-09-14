'use client';

import { useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { chatModels, getModelDefinition } from '@/lib/ai/all-models';
import type { ModelId } from '@/lib/models/model-id';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';
import {
  ModelSelectorBase,
  type ModelSelectorBaseItem,
} from '@/components/model-selector-base';

export function PureModelSelector({
  selectedModelId,
  className,
  onModelChangeAction,
}: {
  selectedModelId: ModelId;
  onModelChangeAction?: (modelId: ModelId) => void;
  className?: string;
}) {
  const { data: session } = useSession();
  const isAnonymous = !session?.user;

  const models: Array<ModelSelectorBaseItem> = useMemo(() => {
    return chatModels.map((m) => {
      const def = getModelDefinition(m.id);
      const disabled =
        isAnonymous && !ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(m.id as any);
      return { id: m.id, definition: def, disabled };
    });
  }, [isAnonymous]);

  return (
    <ModelSelectorBase
      className={cn('w-fit md:px-2', className)}
      models={models}
      selectedModelId={selectedModelId}
      onModelChange={onModelChangeAction}
      enableFilters
    />
  );
}

export const ModelSelector = memo(PureModelSelector, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.className === nextProps.className &&
    prevProps.onModelChangeAction === nextProps.onModelChangeAction
  );
});
