import type { MetadataRoute } from 'next';
import { allModels } from '@/lib/ai/all-models';

import { generateStaticParams as generateModelStaticParams } from '@/app/(models)/models/[provider]/[id]/page';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = `http://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? 'localhost:3000'}`;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/models`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const modelParams = await generateModelStaticParams();
    for (const { provider, id } of modelParams) {
      dynamicEntries.push({
        url: `${baseUrl}/models/${provider}/${id}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  } catch {
    // swallow errors from optional imports
    console.error('Error generating model static params');
  }

  try {
    // Generate compare URLs directly from allModels
    const sortedIds = [...allModels.map((m) => m.id)].sort((a, b) => a.localeCompare(b));
    
    // Add some single model comparison pages
    const popularModels = sortedIds.slice(0, 10);
    for (const id of popularModels) {
      const [provider, model] = id.split('/');
      if (provider && model) {
        dynamicEntries.push({
          url: `${baseUrl}/compare/${provider}/${model}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }
    }
    
    // Add a few popular model comparison pairs
    for (let i = 0; i < Math.min(5, popularModels.length); i++) {
      for (let j = i + 1; j < Math.min(5, popularModels.length); j++) {
        const [p1, m1] = popularModels[i].split('/');
        const [p2, m2] = popularModels[j].split('/');
        if (p1 && m1 && p2 && m2) {
          dynamicEntries.push({
            url: `${baseUrl}/compare/${p1}/${m1}/${p2}/${m2}`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.4,
          });
        }
      }
    }
  } catch {
    // swallow errors from optional imports
    console.error('Error generating compare static params');
  }

  // Deduplicate by URL (e.g., base /compare may appear twice)
  const dedup = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of [...staticEntries, ...dynamicEntries]) {
    dedup.set(entry.url, entry);
  }

  return Array.from(dedup.values());
}
