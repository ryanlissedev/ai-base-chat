'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompareButton } from '@/components/compare-button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ModelDefinition } from '@/lib/ai/all-models';
import type { ProviderId } from '@/lib/models/models.generated';
import { getProviderIcon } from '@/components/get-provider-icon';
import { CAPABILITY_ICONS } from '@/components/capability-icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModelCardProps {
  model: ModelDefinition;
  selectedModels?: string[];
  onToggleCompare?: (modelId: string) => void;
  isLoading?: boolean;
}

export function ModelCard({
  model,
  selectedModels = [],
  onToggleCompare,
  isLoading,
}: ModelCardProps) {
  const formatCompact = (value: number): string => {
    if (value < 1000) return value.toString();
    if (value < 1_000_000) return `${Math.round(value / 1_000)}K`;
    if (value < 1_000_000_000) return `${Math.round(value / 1_000_000)}M`;
    return `${Math.round(value / 1_000_000_000)}B`;
  };

  const isSelected = false;
  const canAddMore = true;
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
    enabled,
    label,
    children,
  }: {
    enabled: boolean | undefined;
    label: string;
    children: React.ReactNode;
  }) =>
    enabled ? (
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
    ) : null;

  const CapabilityIcon = ({
    enabled,
    capability,
    direction,
  }: {
    enabled: boolean | undefined;
    capability: 'text' | 'image' | 'pdf' | 'audio';
    direction: 'in' | 'out';
  }) => {
    const { Icon, label } = CAPABILITY_ICONS[capability];
    const computedLabel = `${label} ${direction === 'in' ? 'in' : 'out'}`;
    return (
      <ModalityIcon enabled={enabled} label={computedLabel}>
        <Icon className="size-3.5" />
      </ModalityIcon>
    );
  };

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
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="bg-muted rounded-lg p-1">
              {getProviderIcon(provider, 24)}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-balance">
                {model.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <span>by {model.owned_by.toLowerCase()}</span>
                <span>•</span>
                <span>{formatCompact(model.context_window)} context</span>
                <span>•</span>
                <span>{formatCompact(model.max_tokens)} max out</span>
                <span>•</span>
                <span>
                  $
                  {(Number.parseFloat(model.pricing.input) * 1_000_000).toFixed(
                    2,
                  )}
                  /M input
                </span>
                <span>•</span>
                <span>
                  $
                  {(
                    Number.parseFloat(model.pricing.output) * 1_000_000
                  ).toFixed(2)}
                  /M output
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <CompareButton
              modelId={model.id}
              variant="outline"
              size="sm"
              className="transition-all duration-200"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 text-pretty leading-relaxed">
          {model.description}
        </p>
        <TooltipProvider>
          <div className="flex items-center justify-start gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {hasInput && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Input</span>
                  <div className="flex items-center gap-1.5">
                    <CapabilityIcon
                      enabled={model.features?.input?.text}
                      capability="text"
                      direction="in"
                    />
                    <CapabilityIcon
                      enabled={model.features?.input?.image}
                      capability="image"
                      direction="in"
                    />
                    <CapabilityIcon
                      enabled={model.features?.input?.pdf}
                      capability="pdf"
                      direction="in"
                    />
                    <CapabilityIcon
                      enabled={model.features?.input?.audio}
                      capability="audio"
                      direction="in"
                    />
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
                    <CapabilityIcon
                      enabled={model.features?.output?.text}
                      capability="text"
                      direction="out"
                    />
                    <CapabilityIcon
                      enabled={model.features?.output?.image}
                      capability="image"
                      direction="out"
                    />
                    <CapabilityIcon
                      enabled={model.features?.output?.audio}
                      capability="audio"
                      direction="out"
                    />
                  </div>
                </div>
              )}
              {(model.features?.reasoning || model.features?.toolCall) && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <div className="flex items-center gap-1.5">
                    {model.features?.reasoning &&
                      (() => {
                        const { Icon, label } = CAPABILITY_ICONS.reasoning;
                        return (
                          <Badge
                            variant="secondary"
                            className="text-[10px] gap-1"
                          >
                            <Icon className="size-3" />
                            {label}
                          </Badge>
                        );
                      })()}
                    {model.features?.toolCall &&
                      (() => {
                        const { Icon, label } = CAPABILITY_ICONS.tools;
                        return (
                          <Badge
                            variant="secondary"
                            className="text-[10px] gap-1"
                          >
                            <Icon className="size-3" />
                            {label}
                          </Badge>
                        );
                      })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
