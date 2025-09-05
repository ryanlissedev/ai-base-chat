import type { Metadata } from 'next';
import ComparePage from '../compare-page';

const pageTitle = 'Compare Models | Sparka AI';
const pageDescription =
  "Compare two models from Sparka's Vercel AI Gateway catalog side-by-side. Browse all providers and models, check capabilities, context windows, and pricing.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    'Sparka',
    'Vercel AI Gateway',
    'compare',
    'models',
    'LLM',
    'AI models',
    'providers',
  ],
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: '/compare',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
  },
  alternates: {
    canonical: '/compare',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <ComparePage />;
}
