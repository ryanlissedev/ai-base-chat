import { registerOTel } from '@vercel/otel';
import { LangfuseExporter } from 'langfuse-vercel';
import { siteConfig } from '@/lib/config';
import { setupServerErrorHandlers } from '@/lib/error-handling/global-handlers';

export function register() {
  // Initialize server-side error handlers only in Node.js runtime (not Edge Runtime)
  if (typeof process !== 'undefined' && process.versions?.node) {
    setupServerErrorHandlers();
  }

  try {
    registerOTel({
      serviceName: siteConfig.appPrefix,
      traceExporter: new LangfuseExporter(),
    });
  } catch (error) {
    // Gracefully handle instrumentation errors during development
    console.warn(
      'Instrumentation failed to initialize:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}
