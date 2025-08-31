'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ModelDefinition } from '@/lib/ai/all-models';
import type { ProviderId } from '@/lib/models/models.generated';
import { getProviderIcon } from '@/components/get-provider-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  PlugZap,
  Type as TypeIcon,
  Image as ImageIcon,
  FileText,
  Mic,
  Volume2,
} from 'lucide-react';

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
  const isSelected = selectedModels.includes(model.id);
  const canAddMore = selectedModels.length < 2;
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

  const handleCompareClick = () => {
    if (onToggleCompare) {
      onToggleCompare(model.id);
    } else {
      // Default behavior - navigate to compare page
      const currentModels = selectedModels.length > 0 ? selectedModels : [];
      const newModels = isSelected
        ? currentModels.filter((id) => id !== model.id)
        : [...currentModels.slice(0, 1), model.id]; // Keep only first model and add new one

      if (newModels.length > 0) {
        window.location.href = `/compare?models=${newModels.join(',')}`;
      }
    }
  };

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
            <div className="transition-transform bg-muted rounded-lg p-1 group-hover:rotate-12">
              {getProviderIcon(provider, 24)}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-balance">
                {model.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <span>by {model.owned_by.toLowerCase()}</span>
                <span>•</span>
                <span>{model.context_window.toLocaleString()} context</span>
                <span>•</span>
                <span>{model.max_tokens.toLocaleString()} max out</span>
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
            <Button
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={handleCompareClick}
              disabled={!canAddMore && !isSelected}
              className="transition-all duration-200"
            >
              {isSelected ? 'Remove' : 'Compare'}
            </Button>
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
                    <ModalityIcon
                      enabled={model.features?.input?.text}
                      label="Text in"
                    >
                      <TypeIcon className="size-3.5" />
                    </ModalityIcon>
                    <ModalityIcon
                      enabled={model.features?.input?.image}
                      label="Image in"
                    >
                      <ImageIcon className="size-3.5" />
                    </ModalityIcon>
                    <ModalityIcon
                      enabled={model.features?.input?.pdf}
                      label="PDF in"
                    >
                      <FileText className="size-3.5" />
                    </ModalityIcon>
                    <ModalityIcon
                      enabled={model.features?.input?.audio}
                      label="Audio in"
                    >
                      <Mic className="size-3.5" />
                    </ModalityIcon>
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
                    <ModalityIcon
                      enabled={model.features?.output?.text}
                      label="Text out"
                    >
                      <TypeIcon className="size-3.5" />
                    </ModalityIcon>
                    <ModalityIcon
                      enabled={model.features?.output?.image}
                      label="Image out"
                    >
                      <ImageIcon className="size-3.5" />
                    </ModalityIcon>
                    <ModalityIcon
                      enabled={model.features?.output?.audio}
                      label="Audio out"
                    >
                      <Volume2 className="size-3.5" />
                    </ModalityIcon>
                  </div>
                </div>
              )}
              {(model.features?.reasoning || model.features?.toolCall) && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <div className="flex items-center gap-1.5">
                    {model.features?.reasoning && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Brain className="size-3" />
                        Reasoning
                      </Badge>
                    )}
                    {model.features?.toolCall && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <PlugZap className="size-3" />
                        Tools
                      </Badge>
                    )}
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
