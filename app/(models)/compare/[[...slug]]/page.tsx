'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ModelComparisonCard } from '@/app/(models)/compare/model-comparison-card';
import { allModels } from '@/lib/ai/all-models';
import type { ModelDefinition } from '@/lib/ai/all-models';
import { ModelSelectorBase } from '@/components/model-selector-base';
import type { ModelId } from '@/lib/models/model-id';
import { getModelDefinition } from '@/lib/ai/all-models';

export default function ComparePage() {
  const params = useParams<{ slug?: string[] | string }>();
  const router = useRouter();

  const segments = useMemo(() => {
    const raw = params?.slug;
    if (!raw) return [] as string[];
    if (Array.isArray(raw)) return raw;
    return [raw];
  }, [params]);

  const [leftModel, rightModel] = useMemo(() => {
    const getModelById = (id: string): ModelDefinition | null =>
      allModels.find((m) => m.id === id) || null;

    const leftId =
      segments.length >= 2 ? `${segments[0]}/${segments[1]}` : null;
    const rightId =
      segments.length >= 4 ? `${segments[2]}/${segments[3]}` : null;

    return [
      leftId ? getModelById(leftId) : null,
      rightId ? getModelById(rightId) : null,
    ];
  }, [segments]);

  function updateUrl(leftId: string | null, rightId: string | null) {
    const parts: string[] = [];
    const pushId = (id: string) => {
      const [a, b] = id.split('/');
      if (a && b) {
        parts.push(a, b);
      }
    };
    if (leftId) pushId(leftId);
    if (rightId) pushId(rightId);
    const path = parts.length > 0 ? `/compare/${parts.join('/')}` : '/compare';
    router.replace(path);
  }

  function handleModelChange(position: number, modelId: string) {
    const currentLeftId = leftModel?.id ?? null;
    const currentRightId = rightModel?.id ?? null;

    if (position === 0) {
      updateUrl(modelId, currentRightId);
      return;
    }

    if (!currentLeftId) {
      // If no left selected yet, promote right selection to left
      updateUrl(modelId, null);
      return;
    }

    updateUrl(currentLeftId, modelId);
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="mb-3 text-2xl font-semibold text-foreground">
          Model Comparison
        </h1>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ModelSelectorBase
            models={allModels.map((m) => ({
              id: m.id as ModelId,
              definition: getModelDefinition(m.id as ModelId),
            }))}
            selectedModelId={leftModel?.id as ModelId | undefined}
            onModelChange={(id) => handleModelChange(0, id)}
            className="w-full"
            enableFilters
          />
          <ModelSelectorBase
            models={allModels.map((m) => ({
              id: m.id as ModelId,
              definition: getModelDefinition(m.id as ModelId),
            }))}
            selectedModelId={rightModel?.id as ModelId | undefined}
            onModelChange={(id) => handleModelChange(1, id)}
            className="w-full"
            enableFilters
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ModelComparisonCard
          model={leftModel}
          position={0}
          onModelChange={() => {}}
        />
        <ModelComparisonCard
          model={rightModel}
          position={1}
          onModelChange={() => {}}
        />
      </div>
    </div>
  );
}
