'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModelComparisonCard } from '@/app/(models)/compare/model-comparison-card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { allModels } from '@/lib/ai/all-models';
import type { ModelDefinition } from '@/lib/ai/all-models';

function ComparePageContent() {
  const searchParams = useSearchParams();
  const [selectedModels, setSelectedModels] = useState<
    (ModelDefinition | null)[]
  >([null, null]);
  const isInitialized = useRef(false);

  useEffect(() => {
    const modelsParam = searchParams.get('models');
    if (modelsParam) {
      const modelIds = modelsParam.split(',');
      const models = modelIds.map(
        (id) => allModels.find((m) => m.id === id) || null,
      );
      setSelectedModels([models[0] || null, models[1] || null]);
    }
    isInitialized.current = true;
  }, [searchParams]);

  const handleModelChange = (position: number, modelId: string) => {
    const model = allModels.find((m) => m.id === modelId) || null;
    const newModels = [...selectedModels];
    newModels[position] = model;

    setSelectedModels(newModels);

    if (isInitialized.current) {
      const validModels = newModels.filter(
        (m) => m !== null,
      ) as ModelDefinition[];
      if (validModels.length > 0) {
        const modelIds = validModels.map((m) => m.id).join(',');
        const url = new URL(window.location.href);
        url.searchParams.set('models', modelIds);
        window.history.replaceState({}, '', url.toString());
      } else {
        const url = new URL(window.location.href);
        url.searchParams.delete('models');
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Model Comparison
        </h1>
        <Button className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ModelComparisonCard
          model={selectedModels[0]}
          onModelChange={(modelId) => handleModelChange(0, modelId)}
          position={0}
        />
        <ModelComparisonCard
          model={selectedModels[1]}
          onModelChange={(modelId) => handleModelChange(1, modelId)}
          position={1}
        />
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Model Comparison
            </h1>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
