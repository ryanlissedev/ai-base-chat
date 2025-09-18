import 'server-only'; // <-- ensure this file cannot be imported from the client
import {
  createTRPCOptionsProxy,
} from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
export function prefetch(queryOptions: any) {
  const queryClient = getQueryClient();
  // Suppress TypeScript for complex tRPC generic types
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    void queryClient.prefetchInfiniteQuery(queryOptions);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    void queryClient.prefetchQuery(queryOptions);
  }
}
