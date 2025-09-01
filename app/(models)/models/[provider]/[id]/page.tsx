'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ModelComparisonCard } from '@/app/(models)/compare/model-comparison-card';
import { allModels } from '@/lib/ai/all-models';
import type { ModelDefinition } from '@/lib/ai/all-models';
import { ModelSelectorBase } from '@/components/model-selector-base';
import type { ModelId } from '@/lib/models/model-id';
import { getModelDefinition } from '@/lib/ai/all-models';

export default function SingleModelPage() {
  const params = useParams<{ provider: string; id: string }>();
  const router = useRouter();

  const modelId = useMemo(() => {
    if (!params?.provider || !params?.id) return null as string | null;
    return `${params.provider}/${params.id}`;
  }, [params]);

  const model: ModelDefinition | null = useMemo(() => {
    if (!modelId) return null;
    return allModels.find((m) => m.id === modelId) || null;
  }, [modelId]);

  function handleModelChange(nextId: string) {
    // nextId is in the form "provider/model"
    router.replace(`/models/${nextId}`);
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="mb-3 text-2xl font-semibold text-foreground">Model</h1>
        <ModelSelectorBase
          models={allModels.map((m) => ({
            id: m.id as ModelId,
            definition: getModelDefinition(m.id as ModelId),
          }))}
          selectedModelId={model?.id as ModelId | undefined}
          onModelChange={handleModelChange}
          className="w-full"
          enableFilters
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        <ModelComparisonCard
          model={model}
          position={0}
          onModelChange={() => {}}
        />
      </div>
    </div>
  );
}
