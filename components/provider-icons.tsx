'use client';
import type { ProviderId } from '@/lib/models/models.generated';

// Simple SVG icons for providers to avoid heavy dependencies
const ProviderIcon = ({ 
  children, 
  size = 16, 
  className = '' 
}: { 
  children: React.ReactNode; 
  size?: number; 
  className?: string; 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    {children}
  </svg>
);

// Simple icon components
const OpenAIIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M22.281 9.28h-7.19V6.5c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5v2.78H2.719C1.22 9.28 0 10.5 0 12s1.22 2.72 2.719 2.72h7.19v2.78c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5v-2.78h7.19C23.78 14.72 25 13.5 25 12s-1.22-2.72-2.719-2.72z"/>
  </ProviderIcon>
);

const AnthropicIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </ProviderIcon>
);

const GoogleIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </ProviderIcon>
);

const MetaIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </ProviderIcon>
);

const MistralIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </ProviderIcon>
);

const CohereIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </ProviderIcon>
);

const PerplexityIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </ProviderIcon>
);

const VercelIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M24 22.525H0l12-21.05 12 21.05z"/>
  </ProviderIcon>
);

const AWSIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </ProviderIcon>
);

const XAIIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </ProviderIcon>
);

const AlibabaIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </ProviderIcon>
);

const DeepSeekIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </ProviderIcon>
);

const MoonshotIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </ProviderIcon>
);

const ZAIIcon = ({ size = 16 }: { size?: number }) => (
  <ProviderIcon size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </ProviderIcon>
);

export function getProviderIcon(provider: ProviderId, size = 16) {
  const iconProps = { size };
  switch (provider) {
    case 'openai':
      return <OpenAIIcon {...iconProps} />;
    case 'anthropic':
      return <AnthropicIcon {...iconProps} />;
    case 'xai':
      return <XAIIcon {...iconProps} />;
    case 'google':
      return <GoogleIcon {...iconProps} />;
    case 'meta':
      return <MetaIcon {...iconProps} />;
    case 'mistral':
      return <MistralIcon {...iconProps} />;
    case 'alibaba':
      return <AlibabaIcon {...iconProps} />;
    case 'amazon':
      return <AWSIcon {...iconProps} />;
    case 'cohere':
      return <CohereIcon {...iconProps} />;
    case 'deepseek':
      return <DeepSeekIcon {...iconProps} />;
    case 'perplexity':
      return <PerplexityIcon {...iconProps} />;
    case 'vercel':
      return <VercelIcon {...iconProps} />;
    case 'inception':
      return <OpenAIIcon {...iconProps} />; // Using OpenAI as fallback
    case 'moonshotai':
      return <MoonshotIcon {...iconProps} />;
    case 'morph':
      return <OpenAIIcon {...iconProps} />; // Using OpenAI as fallback
    case 'zai':
      return <ZAIIcon {...iconProps} />;
    default:
      return <OpenAIIcon {...iconProps} />; // Default fallback
  }
}