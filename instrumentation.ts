import { registerOTel } from '@vercel/otel';
import { LangfuseExporter } from 'langfuse-vercel';
import { siteConfig } from '@/lib/config';

export function register() {
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
