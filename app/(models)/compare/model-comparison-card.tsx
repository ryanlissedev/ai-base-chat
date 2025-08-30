'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, ExternalLink } from 'lucide-react';
import type { ModelDefinition } from '@/lib/ai/all-models';
import { allModels } from '@/lib/ai/all-models';

interface ModelComparisonCardProps {
  model: ModelDefinition | null;
  onModelChange: (modelId: string) => void;
  position: number;
  isLoading?: boolean;
}

export function ModelComparisonCard({
  model,
  onModelChange,
  position,
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
          <Select onValueChange={onModelChange}>
            <SelectTrigger className="border-dashed">
              <SelectValue placeholder="Select a model to compare" />
            </SelectTrigger>
            <SelectContent>
              {allModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.owned_by}: {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">Choose a model to start comparing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Select value={model.id} onValueChange={onModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.owned_by}: {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Author */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Author</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {model.owned_by.toLowerCase()}
            </Badge>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Context Length */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Context Length</span>
          <span className="text-sm font-medium">
            {(model.context_window / 1000).toFixed(0)}K
          </span>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-3 text-pretty leading-relaxed">
            {model.description}
          </p>
        </div>

        {/* Provider */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Provider</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {model.owned_by}
            </Badge>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Pricing</h4>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Input</span>
            <span className="text-sm font-medium">
              ${(Number.parseFloat(model.pricing.input) * 1_000_000).toFixed(2)}
              /M tokens
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Output</span>
            <span className="text-sm font-medium">
              $
              {(Number.parseFloat(model.pricing.output) * 1_000_000).toFixed(2)}
              /M tokens
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Images</span>
            <span className="text-sm font-medium">{'--'}</span>
          </div>
        </div>

        {/* Endpoint Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Endpoint Features</h4>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Input Modalities
            </span>
            <span className="text-sm font-medium">
              {[
                model.features?.input?.text ? 'text' : null,
                model.features?.input?.image ? 'image' : null,
                model.features?.input?.pdf ? 'pdf' : null,
                model.features?.input?.audio ? 'audio' : null,
              ]
                .filter(Boolean)
                .join(', ') || '--'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Output Modalities
            </span>
            <span className="text-sm font-medium">
              {[
                model.features?.output?.text ? 'text' : null,
                model.features?.output?.image ? 'image' : null,
                model.features?.output?.audio ? 'audio' : null,
              ]
                .filter(Boolean)
                .join(', ') || '--'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Quantization</span>
            <span className="text-sm font-medium">--</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Max Tokens (input + output)
            </span>
            <span className="text-sm font-medium">
              {(model.context_window / 1000).toFixed(0)}K
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Max Output Tokens
            </span>
            <span className="text-sm font-medium">
              {model.max_tokens ? `${model.max_tokens}` : '--'}
            </span>
          </div>
        </div>

        {/* Capabilities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tool use</span>
            {model.features?.toolCall ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Reasoning</span>
            {model.features?.reasoning ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
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
        </div>

        {/* Go to model button */}
        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full bg-transparent hover:bg-accent transition-colors"
            asChild
          >
            <Link href={`/model/${model.id}`}>
              <span>Go to model</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
