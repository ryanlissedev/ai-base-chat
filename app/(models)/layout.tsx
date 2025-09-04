import { ModelsHeader } from './models-header';
import { auth } from '../(auth)/auth';
import { SessionProvider } from 'next-auth/react';

const HEADER_HEIGHT = '2.75rem';

export default async function ModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
      <div
        className="h-dvh max-h-dvh grid grid-rows-[auto_1fr]"
        style={
          {
            '--header-height': HEADER_HEIGHT,
          } as React.CSSProperties
        }
      >
        <ModelsHeader />
        <div className="relative flex-1 min-h-0 ">{children}</div>
      </div>
    </SessionProvider>
  );
}
