#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

type ModelType = 'language' | 'embedding';

type Pricing = {
  input: string;
  output: string;
  input_cache_read?: string;
  input_cache_write?: string;
};

type ModelItem = {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  name: string;
  description: string;
  type: ModelType;
  context_window: number;
  max_tokens: number;
  pricing: Pricing;
  tags?: string[];
};

type ModelsResponse = {
  object: 'list';
  data: ModelItem[];
};

async function fetchAndConvertModels() {
  try {
    console.log('Fetching models from API...');

    // Fetch the JSON data from the API
    const response = await fetch('https://ai-gateway.vercel.sh/v1/models');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData: ModelsResponse = (await response.json()) as ModelsResponse;

    // Write the JSON file
    const jsonPath = join(
      __dirname,
      '../lib/models/ai-gateway-models-response.json',
    );
    writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log('Saved JSON file:', jsonPath);

    // Filter out embedding models
    const nonEmbeddingData: ModelItem[] = jsonData.data.filter(
      (model: ModelItem) => model.type !== 'embedding',
    );

    // Extract unique providers from owned_by property for non-embedding models
    const providers = [
      ...new Set(nonEmbeddingData.map((model: ModelItem) => model.owned_by)),
    ].sort();

    // Extract all model ids from non-embedding models
    const models = [
      ...new Set(nonEmbeddingData.map((model: ModelItem) => model.id)),
    ].sort();

    // Generate TypeScript content
    const outputPath = join(__dirname, '../lib/models/models.generated.ts');
    const tsContent = `// List of unique providers extracted from models data
export const providers = ${JSON.stringify(providers, null, 2)} as const;

export type ProviderId = (typeof providers)[number];

// List of all model ids extracted from models data
export const models = ${JSON.stringify(models, null, 2)} as const;

export type ModelId = (typeof models)[number];

export interface ModelData {
  id: ModelId;
  object: string;
  owned_by: ProviderId;
  name: string;
  description: string;
  type: 'language' | 'embedding';
  tags?: 'image-generation'[];
  context_window: number; // Max input tokens
  max_tokens: number; // Max output tokens
  pricing: {
    input: string; // Input price per token
    output: string; // Output price per token
    input_cache_read?: string; // Input cache read price per token
    input_cache_write?: string; // Input cache write price per token
  };
}

// Define the data with proper typing
export const modelsData: ModelData[] = ${JSON.stringify(
      nonEmbeddingData.map(({ created, ...model }) => model),
      null,
      2,
    )};
`;

    // Write the TypeScript file
    writeFileSync(outputPath, tsContent);
    console.log('Generated TypeScript file:', outputPath);

    // Format the generated TypeScript file with biome
    try {
      console.log('Formatting TypeScript file with biome...');
      execSync(`npx biome format --write "${outputPath}"`, {
        cwd: join(__dirname, '..'),
        stdio: 'inherit',
      });
      console.log('Successfully formatted TypeScript file');
    } catch (formatError: unknown) {
      if (formatError instanceof Error) {
        console.warn(
          'Warning: Failed to format with biome:',
          formatError.message,
        );
      } else {
        console.warn('Warning: Failed to format with biome:', formatError);
      }
    }

    // Also write the providers list to a separate JSON file
    const providersJsonPath = join(
      __dirname,
      '../lib/models/providers-list.json',
    );
    writeFileSync(providersJsonPath, JSON.stringify(providers, null, 2));
    console.log('Generated providers list:', providersJsonPath);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching or converting models:', error.message);
    } else {
      console.error('Error fetching or converting models:', error);
    }
    process.exit(1);
  }
}

fetchAndConvertModels();
