'use client';

import { Container } from '@/components/container';
import { WideModelDetails } from '@/app/(models)/models/wide-model-details';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { allModels } from '@/lib/ai/all-models';
import type { ModelDefinition } from '@/lib/ai/all-models';

export default function SingleModelPage() {
  const params = useParams<{ provider: string; id: string }>();
  const [modelId, setModelId] = useState<string | null>(() => {
    if (!params?.provider || !params?.id) return null;
    return `${params.provider}/${params.id}`;
  });

  const model: ModelDefinition | null = useMemo(() => {
    if (!modelId) return null;
    return allModels.find((m) => m.id === modelId) || null;
  }, [modelId]);

  function handleModelChange(nextId: string) {
    setModelId(nextId);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/models/${nextId}`);
    }
  }

  return (
    <Container className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Model</h1>
      <WideModelDetails
        model={model}
        enabledActions={{
          goToModel: false,
          chat: true,
          compare: true,
        }}
      />
    </Container>
  );
}
