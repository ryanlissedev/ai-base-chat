#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const MODELS_DEV_URL = 'https://models.dev/api.json';
const ROOT = join(__dirname, '..');
const MODELS_GENERATED_TS = join(ROOT, 'lib', 'models', 'models.generated.ts');
const OUTPUT_TS = join(ROOT, 'lib', 'models', 'model-features.generated.ts');

const MODELS_DEV_RESPONSE_JSON = join(
  ROOT,
  'lib',
  'models',
  'models-dev-response.json',
);

type ModelsDevModalities = {
  input?: string[];
  output?: string[];
};

type ModelsDevModel = {
  id: string;
  knowledge?: string;
  reasoning?: boolean;
  tool_call?: boolean;
  modalities?: ModelsDevModalities;
  release_date: string;
};

type ModelsDevProvider = {
  models?: Record<string, ModelsDevModel>;
};

type ModelsDevResponse = Record<string, ModelsDevProvider>;

/**
 * Extracts the array of supported model ids from providers/models-generated.ts
 * by parsing the `export const models = [ ... ] as const;` section.
 */
function readSupportedModelIds(): string[] {
  const content = readFileSync(MODELS_GENERATED_TS, 'utf8');
  const startToken = 'export const models = [';
  const endToken = '] as const;';
  const startIdx = content.indexOf(startToken);
  const endIdx = content.indexOf(endToken, startIdx);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(
      'Could not locate models array in lib/models/models.generated.ts',
    );
  }
  const arraySlice = content.slice(startIdx + startToken.length, endIdx);
  // Create a JSON array string by wrapping and removing trailing comments if any
  const jsonLike = `[${arraySlice}]`;
  // Parse as JS by evaluating in a sandboxed Function. The array contains only string literals and commas/newlines.
  // eslint-disable-next-line no-new-func
  const parsed = Function(`return (${jsonLike});`)();
  if (!Array.isArray(parsed)) {
    throw new Error('Parsed models is not an array');
  }
  return parsed as string[];
}

/**
 * Fetch and flatten models.dev JSON into a map of id -> model meta
 */
async function fetchModelsDev(): Promise<{
  raw: ModelsDevResponse;
  byId: Record<string, ModelsDevModel>;
}> {
  const res = await fetch(MODELS_DEV_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${MODELS_DEV_URL}: ${res.status}`);
  }
  const data = (await res.json()) as ModelsDevResponse;
  const byId: Record<string, ModelsDevModel> = {};
  for (const providerKey of Object.keys(data)) {
    const provider = data[providerKey];
    const models = provider?.models ?? {};
    for (const id of Object.keys(models)) {
      const m = models[id] as ModelsDevModel;
      // Prefer canonical ids like "openai/gpt-5" etc. Some entries already include provider prefix in id.
      byId[m.id] = m;
    }
  }
  return { raw: data, byId };
}

function toBoolModal(
  modalities: ModelsDevModalities | undefined,
  kind: 'input' | 'output',
  value: string,
): boolean {
  const list = modalities?.[kind];
  return Array.isArray(list) ? list.includes(value) : false;
}

function formatKnowledgeDate(knowledge: unknown): string | null {
  if (!knowledge || typeof knowledge !== 'string') return null;
  // Accept formats: YYYY, YYYY-MM, YYYY-MM-DD
  if (/^\d{4}$/.test(knowledge)) return `new Date('${knowledge}-01-01')`;
  if (/^\d{4}-\d{2}$/.test(knowledge)) return `new Date('${knowledge}-01')`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(knowledge)) return `new Date('${knowledge}')`;
  // Some sources use YYYY-MM like '2025-01' or '2024-10'. Default to first day of month if ambiguous
  const ym = knowledge.slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(ym)) return `new Date('${ym}-01')`;
  return null;
}

function buildTS({
  supportedIds,
  modelsById,
}: {
  supportedIds: string[];
  modelsById: Record<string, ModelsDevModel>;
}): string {
  const lines = [];
  lines.push("import type { ModelId } from '@/lib/models/model-id';");
  lines.push("import type { ModelFeatures } from './model-features';");
  lines.push('');
  lines.push('export const generatedModelFeatures = {');

  for (const id of supportedIds) {
    const m = modelsById[id];
    if (!m) {
      // Skip if not in models.dev; leaving it out keeps it undefined at runtime
      continue;
    }
    const knowledgeExpr = formatKnowledgeDate(m.knowledge);
    const reasoning = !!m.reasoning;
    const toolCall = !!m.tool_call;
    const imageIn = toBoolModal(m.modalities, 'input', 'image');
    const textIn = toBoolModal(m.modalities, 'input', 'text');
    const pdfIn = toBoolModal(m.modalities, 'input', 'pdf');
    const audioIn = toBoolModal(m.modalities, 'input', 'audio');
    const videoIn = toBoolModal(m.modalities, 'input', 'video');
    const imageOut = toBoolModal(m.modalities, 'output', 'image');
    const textOut = toBoolModal(m.modalities, 'output', 'text');
    const audioOut = toBoolModal(m.modalities, 'output', 'audio');

    const entry = [];
    entry.push(`  '${id}': {`);
    entry.push(`    reasoning: ${reasoning},`);
    entry.push(`    toolCall: ${toolCall},`);
    entry.push(`    releaseDate: new Date('${m.release_date}'),`);
    if (knowledgeExpr) entry.push(`    knowledgeCutoff: ${knowledgeExpr},`);
    entry.push('    input: {');
    entry.push(`      image: ${imageIn},`);
    entry.push(`      text: ${textIn},`);
    entry.push(`      pdf: ${pdfIn},`);
    entry.push(`      audio: ${audioIn},`);
    entry.push(`      video: ${videoIn},`);
    entry.push('    },');
    entry.push('    output: {');
    entry.push(`      image: ${imageOut},`);
    entry.push(`      text: ${textOut},`);
    entry.push(`      audio: ${audioOut},`);
    entry.push('    },');
    entry.push('  },');
    lines.push(entry.join('\n'));
  }

  lines.push('} satisfies Partial<Record<ModelId, ModelFeatures>>;');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  try {
    console.log('Reading supported model ids...');
    const supportedIds = readSupportedModelIds();
    console.log(`Found ${supportedIds.length} supported ids`);

    console.log('Fetching models.dev catalog...');
    const { raw, byId: modelsById } = await fetchModelsDev();
    console.log(
      `Fetched ${Object.keys(modelsById).length} entries from models.dev`,
    );

    // Save raw models.dev response for reference/debugging
    writeFileSync(MODELS_DEV_RESPONSE_JSON, JSON.stringify(raw, null, 2));
    console.log('Saved models.dev response:', MODELS_DEV_RESPONSE_JSON);

    console.log('Building TypeScript file...');
    const ts = buildTS({ supportedIds, modelsById });
    writeFileSync(OUTPUT_TS, ts);
    console.log('Wrote', OUTPUT_TS);

    try {
      console.log('Formatting with biome...');
      execSync(`npx biome format --write "${OUTPUT_TS}"`, {
        cwd: ROOT,
        stdio: 'inherit',
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.warn('Warning: biome format failed:', err.message);
      } else {
        console.warn('Warning: biome format failed:', err);
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error generating model-features.ts:', err.message);
    } else {
      console.error('Error generating model-features.ts:', err);
    }
    process.exit(1);
  }
}

main();
