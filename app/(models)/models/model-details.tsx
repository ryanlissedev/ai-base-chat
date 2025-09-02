'use client';
import { cn } from '@/lib/utils';
import { ModelDetailsCard } from '@/app/(models)/compare/model-details-card';
import { allModels, getModelDefinition } from '@/lib/ai/all-models';
import type { ModelDefinition } from '@/lib/ai/all-models';
import { ModelSelectorBase } from '@/components/model-selector-base';
import type { ModelId } from '@/lib/models/model-id';
import { ChatButton } from '@/components/chat-button';

export function ModelDetails({
  className,
  modelDefinition,
  onModelChangeAction,
  enabledActions,
}: {
  className?: string;
  modelDefinition: ModelDefinition | null;
  onModelChangeAction: (nextId: string) => void;
  enabledActions?: {
    goToModel?: boolean;
    chat?: boolean;
    compare?: boolean;
  };
}) {
  return (
    <>
      <div
        className={cn(
          'mb-6 flex flex-col gap-4 w-full max-w-[450px]',
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <ModelSelectorBase
            models={allModels.map((m) => ({
              id: m.id as ModelId,
              definition: getModelDefinition(m.id as ModelId),
            }))}
            selectedModelId={modelDefinition?.id as ModelId | undefined}
            onModelChange={onModelChangeAction}
            className="grow border justify-start text-base bg-card"
            enableFilters
          />
          {enabledActions?.chat ? (
            <ChatButton
              modelId={modelDefinition?.id as ModelId | undefined}
              className="h-9 px-3 whitespace-nowrap"
              variant="default"
            >
              Chat
            </ChatButton>
          ) : null}
        </div>
        <ModelDetailsCard
          model={modelDefinition}
          enabledActions={enabledActions}
        />
      </div>
    </>
  );
}
