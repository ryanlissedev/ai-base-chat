'use client';

import { Suspense } from 'react';
import { ModelComparisonCard } from '@/app/(models)/compare/model-comparison-card';
import { allModels } from '@/lib/ai/all-models';

function CompareFromSlugContent({ slug }: { slug: string[] }) {
  const leftId = slug.join('/');
  const leftModel = allModels.find((m) => m.id === leftId) || null;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Model Comparison
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ModelComparisonCard
          model={leftModel}
          onModelChange={() => {}}
          position={0}
        />
        <ModelComparisonCard
          model={null}
          onModelChange={() => {}}
          position={1}
        />
      </div>
    </div>
  );
}

export default async function CompareFromSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
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
      <CompareFromSlugContent slug={slug} />
    </Suspense>
  );
}
