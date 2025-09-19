'use client';

import { useEffect } from 'react';
import { initializeGlobalErrorHandlers } from '@/lib/error-handling/global-handlers';
import ErrorBoundary from '@/components/error-boundary';

interface GlobalErrorHandlerProps {
  children: React.ReactNode;
}

export function GlobalErrorHandler({ children }: GlobalErrorHandlerProps) {
  useEffect(() => {
    // Initialize global error handlers on the client side
    initializeGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Enhanced error reporting for the root error boundary
        console.error('Root ErrorBoundary caught error:', error, errorInfo);
        
        // Report to monitoring service if available
        if (typeof window !== 'undefined') {
          fetch('/api/client-logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              level: 'error',
              message: error.message,
              error: error.message,
              stack: error.stack,
              context: {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                errorBoundary: 'root',
                componentStack: errorInfo.componentStack,
              },
              type: 'react-error-boundary',
            }),
          }).catch((reportError) => {
            console.error('Failed to report error boundary error:', reportError);
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}