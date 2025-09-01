'use client';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { CompareButton } from '@/components/compare-button';
import { ChatButton } from '@/components/chat-button';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { ComponentType, SVGProps } from 'react';
import { formatNumberCompact } from '../../../lib/utils/format-number-compact';

interface ModelCardProps {
  model: ModelDefinition;
  isLoading?: boolean;
}
export function ModelCard({ model, isLoading }: ModelCardProps) {
  const provider = model.owned_by as ProviderId;

  const hasInput = Boolean(
    model.features?.input?.text ||
      model.features?.input?.image ||
      model.features?.input?.pdf ||
      model.features?.input?.audio,
  );
  const hasOutput = Boolean(
    model.features?.output?.text ||
      model.features?.output?.image ||
      model.features?.output?.audio,
  );

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
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
  }) => (
    <ModalityIcon label={label}>
      <Icon className="size-3.5" />
    </ModalityIcon>
  );

  // onToggleCompare no-op now; kept for compatibility

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-12 w-full mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer gap-4">
      <CardHeader className="">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 flex-1">
            <div className="bg-muted rounded-lg size-10 grid place-items-center">
              {getProviderIcon(provider, 28)}
            </div>
            <div className="">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-balance">
                {model.name}
              </h3>
              <span className="text-sm text-muted-foreground">
                by {model.owned_by.toLowerCase()}
              </span>
            </div>
          </div>
          <div className="shrink-0 hidden sm:flex items-center gap-2">
            <ChatButton
              modelId={model.id}
              className="transition-all duration-200"
            />
            <CompareButton
              modelId={model.id}
              variant="outline"
              size="sm"
              className="transition-all duration-200"
            />
          </div>
        </div>
        {/* Secondary info row below the header line */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <span>{formatNumberCompact(model.context_window)} context</span>
          <span>•</span>
          <span>{formatNumberCompact(model.max_tokens)} max out</span>
          <span>•</span>
          <span>
            ${(Number.parseFloat(model.pricing.input) * 1_000_000).toFixed(2)}
            /M input
          </span>
          <span>•</span>
          <span>
            ${(Number.parseFloat(model.pricing.output) * 1_000_000).toFixed(2)}
            /M output
          </span>
        </div>
      </CardHeader>
      <CardContent className="gap-3 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-2 text-pretty leading-relaxed">
          {model.description}
        </p>
        <TooltipProvider>
          <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-3 sm:gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {hasInput && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Input</span>
                  <div className="flex items-center gap-1.5">
                    {model.features?.input?.text &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.text;
                        return (
                          <CapabilityIcon label={`${label} in`} Icon={Icon} />
                        );
                      })()}
                    {model.features?.input?.image &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.image;
                        return (
                          <CapabilityIcon label={`${label} in`} Icon={Icon} />
                        );
                      })()}
                    {model.features?.input?.pdf &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.pdf;
                        return (
                          <CapabilityIcon label={`${label} in`} Icon={Icon} />
                        );
                      })()}
                    {model.features?.input?.audio &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.audio;
                        return (
                          <CapabilityIcon label={`${label} in`} Icon={Icon} />
                        );
                      })()}
                  </div>
                </div>
              )}
              {hasInput && hasOutput && (
                <span className="text-muted-foreground/40">/</span>
              )}
              {hasOutput && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Output</span>
                  <div className="flex items-center gap-1.5">
                    {model.features?.output?.text &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.text;
                        return (
                          <CapabilityIcon label={`${label} out`} Icon={Icon} />
                        );
                      })()}
                    {model.features?.output?.image &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.image;
                        return (
                          <CapabilityIcon label={`${label} out`} Icon={Icon} />
                        );
                      })()}
                    {model.features?.output?.audio &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.audio;
                        return (
                          <CapabilityIcon label={`${label} out`} Icon={Icon} />
                        );
                      })()}
                  </div>
                </div>
              )}
            </div>

            {(model.features?.reasoning ||
              model.features?.toolCall ||
              model.features?.fixedTemperature === undefined) && (
              <>
                <span className="hidden sm:inline text-muted-foreground/40">
                  /
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Features
                  </span>
                  <div className="flex items-center gap-1.5">
                    {model.features?.reasoning &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.reasoning;
                        return <CapabilityIcon label={label} Icon={Icon} />;
                      })()}
                    {model.features?.toolCall &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.tools;
                        return <CapabilityIcon label={label} Icon={Icon} />;
                      })()}
                    {model.features?.fixedTemperature === undefined &&
                      (() => {
                        const { Icon, label } = MODEL_CAPABILITIES.temperature;
                        return (
                          <CapabilityIcon label={`${label}`} Icon={Icon} />
                        );
                      })()}
                  </div>
                </div>
              </>
            )}
          </div>
        </TooltipProvider>
      </CardContent>
      <CardFooter className="sm:hidden pt-0">
        <div className="w-full flex items-center justify-end gap-2">
          <ChatButton
            modelId={model.id}
            className="transition-all duration-200 grow"
          />
          <CompareButton
            modelId={model.id}
            variant="outline"
            size="sm"
            className="transition-all duration-200 grow"
          />
        </div>
      </CardFooter>
    </Card>
  );
}
