'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { providers } from '@/lib/models/models.generated';
import { cn } from '@/lib/utils';

export type FilterState = {
  inputModalities: string[];
  outputModalities: string[];
  contextLength: [number, number];
  inputPricing: [number, number];
  outputPricing: [number, number];
  maxTokens: [number, number];
  providers: string[];
  features: {
    reasoning?: boolean;
    toolCall?: boolean;
    temperatureControl?: boolean; // true => supports adjustable temperature
  };
  // legacy fields kept for compatibility
  series: string[];
  categories: string[];
  supportedParameters: string[];
};

const defaultFilters: FilterState = {
  inputModalities: [],
  outputModalities: [],
  contextLength: [1000, 1000000],
  inputPricing: [0, 0.00002],
  outputPricing: [0, 0.00002],
  maxTokens: [0, 300000],
  providers: [],
  features: { reasoning: false, toolCall: false, temperatureControl: false },
  series: [],
  categories: [],
  supportedParameters: [],
};

export function ModelFilters({
  filters,
  onFiltersChange,
  className,
}: {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}) {
  const [openSections, setOpenSections] = useState({
    inputModalities: true,
    outputModalities: true,
    contextLength: true,
    pricing: true,
    providers: true,
    features: true,
    maxTokens: true,
    supportedParameters: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleModalityChange = (
    modality: string,
    type: 'input' | 'output',
    checked: boolean,
  ) => {
    const key = type === 'input' ? 'inputModalities' : 'outputModalities';
    const current = filters[key];
    const updated = checked
      ? [...current, modality]
      : current.filter((m) => m !== modality);

    onFiltersChange({ ...filters, [key]: updated });
  };

  const resetFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters =
    filters.inputModalities.length > 0 ||
    filters.outputModalities.length > 0 ||
    filters.providers.length > 0 ||
    filters.features.reasoning === true ||
    filters.features.toolCall === true ||
    filters.features.temperatureControl === true ||
    filters.contextLength[0] !== defaultFilters.contextLength[0] ||
    filters.contextLength[1] !== defaultFilters.contextLength[1] ||
    filters.maxTokens[0] !== defaultFilters.maxTokens[0] ||
    filters.maxTokens[1] !== defaultFilters.maxTokens[1] ||
    filters.inputPricing[0] !== defaultFilters.inputPricing[0] ||
    filters.inputPricing[1] !== defaultFilters.inputPricing[1] ||
    filters.outputPricing[0] !== defaultFilters.outputPricing[0] ||
    filters.outputPricing[1] !== defaultFilters.outputPricing[1];

  return (
    <div className={cn('w-full h-full p-4', className)}>
      <div className="sticky top-4 space-y-4 pr-2">
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="w-full gap-2 bg-transparent"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </Button>
        )}

        <Collapsible
          open={openSections.inputModalities}
          onOpenChange={() => toggleSection('inputModalities')}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary transition-colors border-b">
            Input Modalities
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.inputModalities ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pb-2 space-y-2">
            {['text', 'image', 'audio', 'pdf', 'video'].map((modality) => (
              <div key={modality} className="flex items-center space-x-2">
                <Checkbox
                  id={`input-${modality}`}
                  checked={filters.inputModalities.includes(modality)}
                  onCheckedChange={(checked) =>
                    handleModalityChange(modality, 'input', !!checked)
                  }
                />
                <label
                  htmlFor={`input-${modality}`}
                  className="text-sm capitalize cursor-pointer"
                >
                  {modality}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={openSections.outputModalities}
          onOpenChange={() => toggleSection('outputModalities')}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary transition-colors border-b">
            Output Modalities
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.outputModalities ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pb-2 space-y-2">
            {['text', 'image', 'audio'].map((modality) => (
              <div key={modality} className="flex items-center space-x-2">
                <Checkbox
                  id={`output-${modality}`}
                  checked={filters.outputModalities.includes(modality)}
                  onCheckedChange={(checked) =>
                    handleModalityChange(modality, 'output', !!checked)
                  }
                />
                <label
                  htmlFor={`output-${modality}`}
                  className="text-sm capitalize cursor-pointer"
                >
                  {modality}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={openSections.contextLength}
          onOpenChange={() => toggleSection('contextLength')}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary transition-colors border-b">
            Context Length
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.contextLength ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pb-2">
            <div className="space-y-2">
              <Slider
                value={filters.contextLength}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    contextLength: value as [number, number],
                  })
                }
                max={1000000}
                min={1000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{(filters.contextLength[0] / 1000).toFixed(0)}K</span>
                <span>{(filters.contextLength[1] / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={openSections.maxTokens}
          onOpenChange={() => toggleSection('maxTokens')}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary transition-colors border-b">
            Max Output Tokens
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.maxTokens ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pb-2">
            <div className="space-y-2">
              <Slider
                value={filters.maxTokens}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    maxTokens: value as [number, number],
                  })
                }
                max={300000}
                min={0}
                step={512}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{filters.maxTokens[0].toLocaleString()}</span>
                <span>{filters.maxTokens[1].toLocaleString()}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={openSections.providers}
          onOpenChange={() => toggleSection('providers')}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary transition-colors border-b">
            Providers
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.providers ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pb-2 space-y-2">
            {providers.map((provider) => (
              <div key={provider} className="flex items-center space-x-2">
                <Checkbox
                  id={`provider-${provider}`}
                  checked={filters.providers.includes(provider)}
                  onCheckedChange={(checked) => {
                    const updated = checked
                      ? [...filters.providers, provider]
                      : filters.providers.filter((p) => p !== provider);
                    onFiltersChange({ ...filters, providers: updated });
                  }}
                />
                <label
                  htmlFor={`provider-${provider}`}
                  className="text-sm capitalize cursor-pointer"
                >
                  {provider}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={openSections.pricing}
          onOpenChange={() => toggleSection('pricing')}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary transition-colors border-b">
            Pricing (per token)
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.pricing ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pb-2 space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Input price</div>
              <Slider
                value={filters.inputPricing}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    inputPricing: value as [number, number],
                  })
                }
                max={0.00002}
                min={0}
                step={0.00000001}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{filters.inputPricing[0].toFixed(8)}</span>
                <span>{filters.inputPricing[1].toFixed(8)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Output price</div>
              <Slider
                value={filters.outputPricing}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    outputPricing: value as [number, number],
                  })
                }
                max={0.00002}
                min={0}
                step={0.00000001}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{filters.outputPricing[0].toFixed(8)}</span>
                <span>{filters.outputPricing[1].toFixed(8)}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={openSections.features}
          onOpenChange={() => toggleSection('features')}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary transition-colors border-b">
            Features
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${openSections.features ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pb-2 space-y-2">
            {[
              { key: 'reasoning', label: 'Reasoning' },
              { key: 'toolCall', label: 'Tools' },
              { key: 'temperatureControl', label: 'Temperature control' },
            ].map((f) => (
              <div key={f.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${f.key}`}
                  checked={
                    !!filters.features[
                      f.key as 'reasoning' | 'toolCall' | 'temperatureControl'
                    ]
                  }
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...filters,
                      features: {
                        ...filters.features,
                        [f.key]: !!checked,
                      },
                    })
                  }
                />
                <label
                  htmlFor={`feature-${f.key}`}
                  className="text-sm cursor-pointer"
                >
                  {f.label}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
