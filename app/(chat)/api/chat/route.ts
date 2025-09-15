import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  streamText,
  stepCountIs,
} from 'ai';
import { replaceFilePartUrlByBinaryDataInMessages } from '@/lib/utils/download-assets';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  getChatById,
  saveChat,
  getUserById,
  saveMessage,
  updateMessage,
  getMessageById,
} from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { getTools } from '@/lib/ai/tools/tools';
import { toolsDefinitions, allTools } from '@/lib/ai/tools/tools-definitions';
import type { ToolName, ChatMessage } from '@/lib/ai/types';
import type { NextRequest } from 'next/server';
import {
  filterAffordableTools,
  getBaseModelCostByModelId,
} from '@/lib/credits/credits-utils';
import { getLanguageModel, getModelProviderOptions } from '@/lib/ai/providers';
import type { CreditReservation } from '@/lib/credits/credit-reservation';
import { getModelDefinition, type ModelDefinition } from '@/lib/ai/all-models';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';

import { after } from 'next/server';
import {
  getAnonymousSession,
  createAnonymousSession,
  setAnonymousSession,
} from '@/lib/anonymous-session-server';
import type { AnonymousSession } from '@/lib/types/anonymous';
import { ANONYMOUS_LIMITS } from '@/lib/types/anonymous';
import { markdownJoinerTransform } from '@/lib/ai/markdown-joiner-transform';
import { checkAnonymousRateLimit, getClientIP } from '@/lib/utils/rate-limit';
import type { ModelId } from '@/lib/models/model-id';
import { calculateMessagesTokens } from '@/lib/ai/token-utils';
import { ChatSDKError } from '@/lib/ai/errors';
import { addExplicitToolRequestToMessages } from './addExplicitToolRequestToMessages';
import { MAX_INPUT_TOKENS } from '@/lib/limits/tokens';
import { getRecentGeneratedImage } from './getRecentGeneratedImage';
import { getCreditReservation } from './getCreditReservation';
import { filterReasoningParts } from './filterReasoningParts';
import { getThreadUpToMessageId } from './getThreadUpToMessageId';
import { createModuleLogger } from '@/lib/logger';

// Create shared Redis clients for resumable stream and cleanup
let redisPublisher: any = null;
let redisSubscriber: any = null;

if (process.env.REDIS_URL) {
  (async () => {
    const redis = await import('redis');
    redisPublisher = redis.createClient({ url: process.env.REDIS_URL });
    redisSubscriber = redis.createClient({ url: process.env.REDIS_URL });
    await Promise.all([redisPublisher.connect(), redisSubscriber.connect()]);
  })();
}

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
        keyPrefix: 'sparka-ai:resumable-stream',
        ...(redisPublisher && redisSubscriber
          ? {
              publisher: redisPublisher,
              subscriber: redisSubscriber,
            }
          : {}),
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export function getRedisSubscriber() {
  return redisSubscriber;
}

export function getRedisPublisher() {
  return redisPublisher;
}

export async function POST(request: NextRequest) {
  const log = createModuleLogger('api:chat');
  try {
    const {
      id: chatId,
      message: userMessage,
      prevMessages: anonymousPreviousMessages,
    }: {
      id: string;
      message: ChatMessage;
      prevMessages: ChatMessage[];
    } = await request.json();

    if (!userMessage) {
      log.warn('No user message found');
      return new Response('No user message found', { status: 400 });
    }

    // Extract selectedModel from user message metadata
    const selectedModelId = userMessage.metadata?.selectedModel as ModelId;

    if (!selectedModelId) {
      log.warn('No selectedModel in user message metadata');
      return new Response('No selectedModel in user message metadata', {
        status: 400,
      });
    }

    const session = await auth();

    const userId = session?.user?.id || null;
    const isAnonymous = userId === null;
    let anonymousSession: AnonymousSession | null = null;

    // Check for anonymous users

    if (userId) {
      // TODO: Consider if checking if user exists is really needed
      const user = await getUserById({ userId });
      if (!user) {
        log.warn('User not found');
        return new Response('User not found', { status: 404 });
      }
    } else {
      // Apply rate limiting for anonymous users
      const clientIP = getClientIP(request);
      const rateLimitResult = await checkAnonymousRateLimit(
        clientIP,
        redisPublisher,
      );

      if (!rateLimitResult.success) {
        log.warn({ clientIP }, 'Rate limit exceeded');
        return new Response(
          JSON.stringify({
            error: rateLimitResult.error,
            type: 'RATE_LIMIT_EXCEEDED',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...(rateLimitResult.headers || {}),
            },
          },
        );
      }

      anonymousSession = await getAnonymousSession();
      if (!anonymousSession) {
        anonymousSession = await createAnonymousSession();
      }

      // Check message limits
      if (anonymousSession.remainingCredits <= 0) {
        log.info('Anonymous message limit reached');
        return new Response(
          JSON.stringify({
            error: `Guest limit reached (${ANONYMOUS_LIMITS.CREDITS} messages).`,
            type: 'ANONYMOUS_LIMIT_EXCEEDED',
            maxMessages: ANONYMOUS_LIMITS.CREDITS,
          }),
          {
            status: 402,
            headers: {
              'Content-Type': 'application/json',
              ...(rateLimitResult.headers || {}),
            },
          },
        );
      }

      // Validate model for anonymous users
      if (!ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(selectedModelId as any)) {
        log.warn('Model not available for anonymous users');
        return new Response(
          JSON.stringify({
            error: 'Model not available for anonymous users',
            availableModels: ANONYMOUS_LIMITS.AVAILABLE_MODELS,
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...(rateLimitResult.headers || {}),
            },
          },
        );
      }
    }

    // Extract selectedTool from user message metadata
    const selectedTool = userMessage.metadata.selectedTool || null;
    log.debug({ selectedTool }, 'selectedTool');
    let modelDefinition: ModelDefinition;
    try {
      modelDefinition = getModelDefinition(selectedModelId);
    } catch (error) {
      log.warn('Model not found');
      return new Response('Model not found', { status: 404 });
    }
    // Skip database operations for anonymous users
    if (!isAnonymous) {
      const chat = await getChatById({ id: chatId });

      if (chat && chat.userId !== userId) {
        log.warn('Unauthorized - chat ownership mismatch');
        return new Response('Unauthorized', { status: 401 });
      }

      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });

        await saveChat({ id: chatId, userId, title });
      } else {
        if (chat.userId !== userId) {
          log.warn('Unauthorized - chat ownership mismatch');
          return new Response('Unauthorized', { status: 401 });
        }
      }

      const [exsistentMessage] = await getMessageById({ id: userMessage.id });

      if (exsistentMessage && exsistentMessage.chatId !== chatId) {
        log.warn('Unauthorized - message chatId mismatch');
        return new Response('Unauthorized', { status: 401 });
      }

      if (!exsistentMessage) {
        // If the message does not exist, save it
        await saveMessage({
          _message: {
            id: userMessage.id,
            chatId: chatId,
            role: userMessage.role,
            lastContext: undefined,
            parts: userMessage.parts,
            attachments: [],
            createdAt: new Date(),
            annotations: [],
            isPartial: false,
            parentMessageId: userMessage.metadata?.parentMessageId || null,
            selectedModel: selectedModelId,
            selectedTool: selectedTool,
          },
        });
      }
    }

    let explicitlyRequestedTools: ToolName[] | null = null;
    if (selectedTool === 'deepResearch')
      explicitlyRequestedTools = ['deepResearch'];
    // else if (selectedTool === 'reason') explicitlyRequestedTool = 'reasonSearch';
    else if (selectedTool === 'webSearch')
      explicitlyRequestedTools = ['webSearch'];
    else if (selectedTool === 'generateImage')
      explicitlyRequestedTools = ['generateImage'];
    else if (selectedTool === 'createDocument')
      explicitlyRequestedTools = ['createDocument', 'updateDocument'];
    else if (selectedTool === 'fileSearch')
      explicitlyRequestedTools = ['fileSearch'];

    const baseModelCost = getBaseModelCostByModelId(selectedModelId);

    let reservation: CreditReservation | null = null;

    if (!isAnonymous) {
      const { reservation: res, error: creditError } =
        await getCreditReservation(userId, baseModelCost);

      if (creditError) {
        console.log(
          'RESPONSE > POST /api/chat: Credit reservation error:',
          creditError,
        );
        return new Response(creditError, {
          status: 402,
        });
      }

      reservation = res;
    } else if (anonymousSession) {
      // Increment message count and update session
      anonymousSession.remainingCredits -= baseModelCost;
      await setAnonymousSession(anonymousSession);
    }

    let activeTools: ToolName[] = filterAffordableTools(
      isAnonymous ? ANONYMOUS_LIMITS.AVAILABLE_TOOLS : allTools,
      isAnonymous
        ? ANONYMOUS_LIMITS.CREDITS
        : reservation
          ? reservation.budget - baseModelCost
          : 0,
    );

    // Disable all tools for models with unspecified features
    if (!modelDefinition.features) {
      activeTools = [];
    } else {
      // Let's not allow deepResearch if the model support reasoning (it's expensive and slow)
      if (
        modelDefinition.features.reasoning &&
        activeTools.some((tool: ToolName) => tool === 'deepResearch')
      ) {
        activeTools = activeTools.filter(
          (tool: ToolName) => tool !== 'deepResearch',
        );
      }

      // Always include fileSearch if it's affordable (it's only 2 credits)
      if (
        !activeTools.includes('fileSearch') &&
        (isAnonymous
          ? ANONYMOUS_LIMITS.CREDITS >= 2
          : reservation
            ? reservation.budget - baseModelCost >= 2
            : false)
      ) {
        activeTools.push('fileSearch');
      }
    }

    if (
      explicitlyRequestedTools &&
      explicitlyRequestedTools.length > 0 &&
      !activeTools.some((tool: ToolName) =>
        explicitlyRequestedTools.includes(tool),
      )
    ) {
      log.warn(
        { explicitlyRequestedTools },
        'Insufficient budget for requested tool',
      );
      return new Response(
        `Insufficient budget for requested tool: ${explicitlyRequestedTools}.`,
        {
          status: 402,
        },
      );
    } else if (
      explicitlyRequestedTools &&
      explicitlyRequestedTools.length > 0
    ) {
      log.debug(
        { explicitlyRequestedTools },
        'Setting explicitly requested tools',
      );
      activeTools = explicitlyRequestedTools;
    }

    // Validate input token limit (50k tokens for user message)
    const totalTokens = calculateMessagesTokens(
      convertToModelMessages([userMessage]),
    );

    if (totalTokens > MAX_INPUT_TOKENS) {
      log.warn({ totalTokens, MAX_INPUT_TOKENS }, 'Token limit exceeded');
      const error = new ChatSDKError(
        'input_too_long:chat',
        `Message too long: ${totalTokens} tokens (max: ${MAX_INPUT_TOKENS})`,
      );
      return error.toResponse();
    }

    const messageThreadToParent = isAnonymous
      ? anonymousPreviousMessages
      : await getThreadUpToMessageId(
          chatId,
          userMessage.metadata.parentMessageId,
        );

    const messages = [...messageThreadToParent, userMessage].slice(-5);

    // Process conversation history
    const lastGeneratedImage = getRecentGeneratedImage(messages);
    addExplicitToolRequestToMessages(
      messages,
      activeTools,
      explicitlyRequestedTools,
    );

    // Filter out reasoning parts to ensure compatibility between different models
    const messagesWithoutReasoning = filterReasoningParts(messages.slice(-5));

    // TODO: Do something smarter by truncating the context to a numer of tokens (maybe even based on setting)
    const modelMessages = convertToModelMessages(messagesWithoutReasoning);

    // TODO: remove this when the gateway provider supports URLs
    const contextForLLM =
      await replaceFilePartUrlByBinaryDataInMessages(modelMessages);
    log.debug({ activeTools }, 'active tools');

    // Create AbortController with 55s timeout for credit cleanup
    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      if (reservation) {
        await reservation.cleanup();
      }
      abortController.abort();
    }, 290000); // 290 seconds

    // Ensure cleanup on any unhandled errors
    try {
      const messageId = generateUUID();
      const streamId = generateUUID();

      // Record this new stream so we can resume later - use Redis for all users
      if (redisPublisher) {
        const keyPrefix = isAnonymous
          ? `sparka-ai:anonymous-stream:${chatId}:${streamId}`
          : `sparka-ai:stream:${chatId}:${streamId}`;

        await redisPublisher.setEx(
          keyPrefix,
          600, // 10 minutes TTL
          JSON.stringify({ chatId, streamId, createdAt: Date.now() }),
        );
      }

      if (!isAnonymous) {
        // Save placeholder assistant message immediately (needed for document creation)
        await saveMessage({
          _message: {
            id: messageId,
            chatId: chatId,
            role: 'assistant',
            lastContext: undefined,
            parts: [], // Empty placeholder
            attachments: [],
            createdAt: new Date(),
            annotations: [],
            isPartial: true,
            parentMessageId: userMessage.id,
            selectedModel: selectedModelId,
            selectedTool: null,
          },
        });
      }

      // Build the data stream that will emit tokens
      const stream = createUIMessageStream<ChatMessage>({
        execute: ({ writer: dataStream }) => {
          const result = streamText({
            model: getLanguageModel(selectedModelId),
            system: systemPrompt(),
            messages: contextForLLM,
            stopWhen: [
              stepCountIs(5),
              ({ steps }) => {
                return steps.some((step) => {
                  const toolResults = step.content;
                  // Don't stop if the tool result is a clarifying question
                  return toolResults.some(
                    (toolResult) =>
                      toolResult.type === 'tool-result' &&
                      toolResult.toolName === 'deepResearch' &&
                      (toolResult.output as any).format === 'report',
                  );
                });
              },
            ],

            activeTools: activeTools,
            experimental_transform: markdownJoinerTransform(),
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'chat-response',
            },
            tools: getTools({
              dataStream,
              session: {
                user: {
                  id: userId || undefined,
                },
                expires: 'noop',
              },
              contextForLLM: contextForLLM,
              messageId,
              selectedModel: selectedModelId,
              attachments: userMessage.parts.filter(
                (part) => part.type === 'file',
              ),
              lastGeneratedImage,
            }),
            onError: (error) => {
              log.error({ error }, 'streamText error');
            },
            abortSignal: abortController.signal, // Pass abort signal to streamText
            ...(modelDefinition.features?.fixedTemperature
              ? {
                  temperature: modelDefinition.features.fixedTemperature,
                }
              : {}),

            providerOptions: getModelProviderOptions(selectedModelId),
          });

          result.consumeStream();

          const initialMetadata = {
            createdAt: new Date(),
            parentMessageId: userMessage.id,
            isPartial: false,
            selectedModel: selectedModelId,
          };

          dataStream.merge(
            result.toUIMessageStream({
              sendReasoning: true,
              messageMetadata: ({ part }) => {
                // send custom information to the client on start:
                if (part.type === 'start') {
                  return initialMetadata;
                }

                // when the message is finished, send additional information:
                if (part.type === 'finish') {
                  return {
                    ...initialMetadata,
                    isPartial: false,
                    usage: part.totalUsage,
                  };
                }
              },
            }),
          );
        },
        generateId: () => messageId,
        onFinish: async ({ messages, isContinuation, responseMessage }) => {
          // Clear timeout since we finished successfully
          clearTimeout(timeoutId);

          if (userId) {
            const actualCost =
              baseModelCost +
              messages
                .flatMap((message) => message.parts)
                .reduce((acc, toolResult) => {
                  if (!toolResult.type.startsWith('tool-')) {
                    return acc;
                  }

                  const toolDef =
                    toolsDefinitions[
                      toolResult.type.replace('tool-', '') as ToolName
                    ];

                  if (!toolDef) {
                    return acc;
                  }

                  return acc + toolDef.cost;
                }, 0);
            const assistantMessage = responseMessage; // TODO: Fix this in ai sdk v5 - responseMessage is not a UIMessage
            try {
              // TODO: Validate if this is correct ai sdk v5
              const assistantMessage = messages.at(-1);

              if (!assistantMessage) {
                throw new Error('No assistant message found!');
              }

              if (!isAnonymous) {
                await updateMessage({
                  _message: {
                    id: assistantMessage.id,
                    chatId: chatId,
                    role: assistantMessage.role ?? '',
                    parts: assistantMessage.parts ?? [],
                    lastContext: responseMessage.metadata.usage,
                    attachments: [],
                    createdAt: new Date(),
                    annotations: [],
                    isPartial: false,
                    parentMessageId: userMessage.id,
                    selectedModel: selectedModelId,
                    selectedTool: null,
                  },
                });
              }

              // Finalize credit usage: deduct actual cost, release reservation
              if (reservation) {
                await reservation.finalize(actualCost);
              }
            } catch (error) {
              log.error({ error }, 'Failed to save chat or finalize credits');
              // Still release the reservation on error
              if (reservation) {
                await reservation.cleanup();
              }
            }
          }
        },

        onError: (error) => {
          // Clear timeout on error
          clearTimeout(timeoutId);
          log.error({ error }, 'onError');
          // Release reserved credits on error (fire and forget)
          if (reservation) {
            reservation.cleanup();
          }
          if (anonymousSession) {
            anonymousSession.remainingCredits += baseModelCost;
            setAnonymousSession(anonymousSession);
          }
          return 'Oops, an error occured!';
        },
      });

      after(async () => {
        // Cleanup to happen after the POST response is sent
        // Set TTL on Redis keys to auto-expire after 10 minutes
        if (redisPublisher) {
          try {
            const keyPattern = `sparka-ai:resumable-stream:rs:sentinel:${streamId}*`;
            const keys = await redisPublisher.keys(keyPattern);
            if (keys.length > 0) {
              // Set 5 minute expiration on all stream-related keys
              await Promise.all(
                keys.map((key: string) => redisPublisher.expire(key, 300)),
              );
            }
          } catch (error) {
            log.error({ error }, 'Failed to set TTL on stream keys');
          }
        }

        try {
          // Clean up stream info from Redis for all users
          if (redisPublisher) {
            const keyPrefix = isAnonymous
              ? `sparka-ai:anonymous-stream:${chatId}:${streamId}`
              : `sparka-ai:stream:${chatId}:${streamId}`;

            await redisPublisher.expire(keyPrefix, 300);
          }
        } catch (cleanupError) {
          log.error({ cleanupError }, 'Failed to cleanup stream record');
        }
      });

      const streamContext = getStreamContext();

      if (streamContext) {
        log.debug('Returning resumable stream');
        return new Response(
          await streamContext.resumableStream(streamId, () =>
            stream.pipeThrough(new JsonToSseTransformStream()),
          ),
        );
      } else {
        return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
      }
    } catch (error) {
      clearTimeout(timeoutId);
      log.error({ error }, 'error found in try block');
      if (reservation) {
        await reservation.cleanup();
      }
      if (anonymousSession) {
        anonymousSession.remainingCredits += baseModelCost;
        setAnonymousSession(anonymousSession);
      }
      throw error;
    }
  } catch (error) {
    log.error({ error }, 'RESPONSE > POST /api/chat error');
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

// DELETE moved to tRPC chat.deleteChat mutation
