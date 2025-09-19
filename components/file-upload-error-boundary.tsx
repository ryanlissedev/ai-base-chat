'use client';

import React from 'react';
import ErrorBoundary from '@/components/error-boundary';
import { AlertTriangle, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function FileUploadErrorFallback({ error, resetError }: FileUploadErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-red-900">
        File Upload Failed
      </h3>
      <p className="mb-4 text-sm text-red-700">
        We encountered an error while uploading your file. Please try again.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-4 text-xs text-red-600">
          <summary className="cursor-pointer">Error Details</summary>
          <pre className="mt-2 text-left whitespace-pre-wrap">
            {error.message}
            {error.stack}
          </pre>
        </details>
      )}
      <div className="flex gap-2">
        <Button onClick={resetError} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={() => window.location.reload()}
          variant="outline" 
          size="sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    </div>
  );
}

interface FileUploadErrorBoundaryProps {
  children: React.ReactNode;
}

export function FileUploadErrorBoundary({ children }: FileUploadErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={FileUploadErrorFallback}
      onError={(error, errorInfo) => {
        console.error('File upload error boundary:', error, errorInfo);
        
        // Report to monitoring service
        if (typeof window !== 'undefined') {
          fetch('/api/client-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              level: 'error',
              message: error.message,
              error: error.message,
              stack: error.stack,
              context: {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                errorBoundary: 'file-upload',
                componentStack: errorInfo.componentStack,
              },
              type: 'file-upload-error',
            }),
          }).catch(() => {});
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}