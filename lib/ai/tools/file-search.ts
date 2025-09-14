import { openai } from '@ai-sdk/openai';
import type { StreamWriter } from '../types';

// OpenAI Vectorstore File Search tool wrapper
// Uses env `OPENAI_VECTORSTORE_ID` with a sensible default fallback.
export const fileSearch = ({
  dataStream,
}: {
  dataStream: StreamWriter;
}) => {
  // dataStream reserved for parity with other tools (future streaming updates)
  void dataStream;

  return openai.tools.fileSearch({
    vectorStoreIds: [
      process.env.OPENAI_VECTORSTORE_ID ||
        'vs_68c6a2b65df88191939f503958af019e',
    ],
    maxNumResults: 10,
    ranking: { ranker: 'auto' },
  });
};

