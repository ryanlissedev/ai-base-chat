'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatButton } from '@/components/chat-button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, MessageSquare, Check, X, Minus } from 'lucide-react';
import type { ModelDefinition } from '@/lib/ai/all-models';
import type { ProviderId } from '@/lib/models/models.generated';
import { getProviderIcon } from '@/components/get-provider-icon';
import { MODEL_CAPABILITIES } from '@/lib/models/model-capabilities';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import type React from 'react';
import { formatNumberCompact } from '../../../lib/utils/format-number-compact';
import { MODEL_CATEGORIES } from '@/lib/models/model-categories';

interface ModelComparisonCardProps {
  model: ModelDefinition | null;
  onModelChange: (modelId: string) => void;
  position: number;
  isLoading?: boolean;
}

const ModalityIcon = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div
        className={`size-6 rounded-md grid place-items-center border text-foreground/80 bg-muted`}
        aria-label={label}
      >
        {children}
      </div>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const CapabilityIcon = ({
  label,
  Icon,
}: {
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) => (
  <ModalityIcon label={label}>
    <Icon className="size-3.5" />
  </ModalityIcon>
);

const NotAvailableIcon = () => {
  return (
    <div
      className={`size-6 grid place-items-center text-foreground/80`}
      aria-label="Not available"
    >
      <Minus className="h-4 w-4" />
    </div>
  );
};

const Section = ({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>{title}</span>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

export function ModelComparisonCard({
  model,
  isLoading,
}: ModelComparisonCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full animate-pulse">
        <CardHeader>
          <Skeleton className="h-10 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!model) {
    return (
      <Card className="h-full border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="text-lg font-semibold tracking-tight">
            No model selected
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">Use the selector above to choose a model.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const provider = model.owned_by as ProviderId;
  const contextCompact = formatNumberCompact(model.context_window);

  return (
    <Card className="group h-full hover:shadow-lg transition-all duration-200 hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Created by</span>
          <div className="flex items-center gap-2 text-sm font-medium">
            {getProviderIcon(provider, 18)}
            <span className="capitalize">{provider}</span>
          </div>
        </div>
        <Separator className="my-2" />
        <p className="text-sm text-muted-foreground text-pretty leading-relaxed mt-2">
          {model.description}
        </p>
        <Separator className="mt-3" />
      </CardHeader>

      <CardContent className="gap-4 flex flex-col">
        <TooltipProvider>
          <div className="flex flex-col gap-4">
            <Section
              title={MODEL_CATEGORIES.limits.label}
              Icon={MODEL_CATEGORIES.limits.Icon}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Context Length
                </span>
                <span className="text-sm font-medium">{contextCompact}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Max Output Tokens
                </span>
                <span className="text-sm font-medium">
                  {model.max_tokens
                    ? formatNumberCompact(Number(model.max_tokens))
                    : '--'}
                </span>
              </div>
            </Section>
            <Separator />

            <Section
              title={MODEL_CATEGORIES.pricing.label}
              Icon={MODEL_CATEGORIES.pricing.Icon}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pricing (Input)
                </span>
                <span className="text-sm font-medium">
                  $
                  {(Number.parseFloat(model.pricing.input) * 1_000_000).toFixed(
                    2,
                  )}
                  /M tokens
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pricing (Output)
                </span>
                <span className="text-sm font-medium">
                  $
                  {(
                    Number.parseFloat(model.pricing.output) * 1_000_000
                  ).toFixed(2)}
                  /M tokens
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Caching</span>
                {model.pricing.input_cache_read ||
                model.pricing.input_cache_write ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            </Section>
            <Separator />

            <Section
              title={MODEL_CATEGORIES.inputModalities.label}
              Icon={MODEL_CATEGORIES.inputModalities.Icon}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {MODEL_CAPABILITIES.text.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {model.features?.input?.text ? (
                    (() => {
                      const { Icon, label } = MODEL_CAPABILITIES.text;
                      return (
                        <CapabilityIcon label={`${label} in`} Icon={Icon} />
                      );
                    })()
                  ) : (
                    <NotAvailableIcon />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {MODEL_CAPABILITIES.image.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {model.features?.input?.image ? (
                    (() => {
                      const { Icon, label } = MODEL_CAPABILITIES.image;
                      return (
                        <CapabilityIcon label={`${label} in`} Icon={Icon} />
                      );
                    })()
                  ) : (
                    <NotAvailableIcon />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {MODEL_CAPABILITIES.pdf.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {model.features?.input?.pdf ? (
                    (() => {
                      const { Icon, label } = MODEL_CAPABILITIES.pdf;
                      return (
                        <CapabilityIcon label={`${label} in`} Icon={Icon} />
                      );
                    })()
                  ) : (
                    <NotAvailableIcon />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {MODEL_CAPABILITIES.audio.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {model.features?.input?.audio ? (
                    (() => {
                      const { Icon, label } = MODEL_CAPABILITIES.audio;
                      return (
                        <CapabilityIcon label={`${label} in`} Icon={Icon} />
                      );
                    })()
                  ) : (
                    <NotAvailableIcon />
                  )}
                </div>
              </div>
            </Section>
            <Separator />

            <Section
              title={MODEL_CATEGORIES.outputModalities.label}
              Icon={MODEL_CATEGORIES.outputModalities.Icon}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {MODEL_CAPABILITIES.text.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {model.features?.output?.text ? (
                    (() => {
                      const { Icon, label } = MODEL_CAPABILITIES.text;
                      return (
                        <CapabilityIcon label={`${label} out`} Icon={Icon} />
                      );
                    })()
                  ) : (
                    <NotAvailableIcon />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Image</span>
                <div className="flex items-center gap-1.5">
                  {model.features?.output?.image ? (
                    (() => {
                      const { Icon, label } = MODEL_CAPABILITIES.image;
                      return (
                        <CapabilityIcon label={`${label} out`} Icon={Icon} />
                      );
                    })()
                  ) : (
                    <NotAvailableIcon />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {MODEL_CAPABILITIES.audio.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {model.features?.output?.audio ? (
                    (() => {
                      const { Icon, label } = MODEL_CAPABILITIES.audio;
                      return (
                        <CapabilityIcon label={`${label} out`} Icon={Icon} />
                      );
                    })()
                  ) : (
                    <NotAvailableIcon />
                  )}
                </div>
              </div>
            </Section>
            <Separator />

            <Section
              title={MODEL_CATEGORIES.features.label}
              Icon={MODEL_CATEGORIES.features.Icon}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {MODEL_CAPABILITIES.reasoning.label}
                </span>
                {model.features?.reasoning ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.reasoning;
                    return <CapabilityIcon label={label} Icon={Icon} />;
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {MODEL_CAPABILITIES.tools.label}
                </span>
                {model.features?.toolCall ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.tools;
                    return <CapabilityIcon label={label} Icon={Icon} />;
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {MODEL_CAPABILITIES.temperature.label}
                </span>
                {model.features?.fixedTemperature === undefined ? (
                  (() => {
                    const { Icon, label } = MODEL_CAPABILITIES.temperature;
                    return <CapabilityIcon label={label} Icon={Icon} />;
                  })()
                ) : (
                  <NotAvailableIcon />
                )}
              </div>
            </Section>
          </div>
        </TooltipProvider>

        {/* Bottom actions */}
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full bg-transparent hover:bg-accent transition-colors"
            asChild
          >
            <Link href={`/models/${model.id}`}>
              <span>Go to model</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <div className="mt-2">
            <ChatButton className="w-full gap-2" modelId={model.id}>
              <MessageSquare className="h-4 w-4" />
              Chat
            </ChatButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
