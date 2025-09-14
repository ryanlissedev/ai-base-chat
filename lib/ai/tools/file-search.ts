import { openai } from '@ai-sdk/openai';
import type { StreamWriter } from '../types';
import type { Session } from 'next-auth';

/**
 * File search tool using OpenAI's vectorstore
 * Searches through documents in the configured vectorstore for relevant information
 */
export function fileSearch({
  dataStream,
  session,
}: {
  dataStream: StreamWriter;
  session: Session;
}) {
  // Get vectorstore ID from environment with fallback to default
  const vectorStoreId = process.env.OPENAI_VECTORSTORE_ID || 'vs_68c6a2b65df88191939f503958af019e';
  
  return openai.tools.fileSearch({
    vectorStoreIds: [vectorStoreId],
    maxNumResults: 10,
    ranking: {
      ranker: 'auto',
    },
  });
}