'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ModelDefinition } from '@/lib/ai/all-models';

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
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-balance">
              {model.owned_by}: {model.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span>by {model.owned_by.toLowerCase()}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                {model.context_window.toLocaleString()} context
              </span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">
                $
                {(Number.parseFloat(model.pricing.input) * 1_000_000).toFixed(
                  2,
                )}
                /M input
              </span>
              <span className="hidden lg:inline">•</span>
              <span className="hidden lg:inline">
                $
                {(Number.parseFloat(model.pricing.output) * 1_000_000).toFixed(
                  2,
                )}
                /M output
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground shrink-0 ml-4">
            <div className="font-medium">
              {Math.floor(model.context_window / 1000)}K
            </div>
            <div className="text-xs">tokens</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 text-pretty leading-relaxed">
          {model.description}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {model.features?.reasoning && (
              <Badge variant="secondary" className="text-xs shrink-0">
                reasoning
              </Badge>
            )}
            {model.features?.toolCall && (
              <Badge variant="secondary" className="text-xs shrink-0">
                tools
              </Badge>
            )}
            {model.features?.input?.image && (
              <Badge variant="outline" className="text-xs shrink-0">
                image-in
              </Badge>
            )}
            {model.features?.input?.pdf && (
              <Badge variant="outline" className="text-xs shrink-0">
                pdf-in
              </Badge>
            )}
            {model.features?.output?.image && (
              <Badge variant="outline" className="text-xs shrink-0">
                image-out
              </Badge>
            )}
          </div>
          <Button
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={handleCompareClick}
            disabled={!canAddMore && !isSelected}
            className="shrink-0 transition-all duration-200"
          >
            {isSelected ? 'Remove' : 'Compare'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
