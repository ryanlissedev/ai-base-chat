'use client';

import {
  startTransition,
  useMemo,
  useOptimistic,
  useState,
  memo,
  type ComponentProps,
  useCallback,
} from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem as UICommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getEnabledFeatures } from '@/lib/features-config';
import { ChevronUpIcon, FilterIcon } from 'lucide-react';
import type { ModelId } from '@/lib/models/model-id';
import type { ProviderId } from '@/lib/models/models.generated';
import type { ModelDefinition } from '@/lib/ai/all-models';
import { getProviderIcon } from './get-provider-icon';

type FeatureFilter = Record<string, boolean>;

const enabledFeatures = getEnabledFeatures();
const initialFilters = enabledFeatures.reduce<FeatureFilter>((acc, feature) => {
  acc[feature.key] = false;
  return acc;
}, {});

function getFeatureIcons(modelDefinition: ModelDefinition) {
  const features = modelDefinition.features;
  if (!features) return [] as JSX.Element[];

  const icons: JSX.Element[] = [];

  const enabled = getEnabledFeatures();
  const featureIconMap = [
    {
      key: 'reasoning',
      condition: features.reasoning,
      config: enabled.find((f) => f.key === 'reasoning'),
    },
    {
      key: 'functionCalling',
      condition: features.toolCall,
      config: enabled.find((f) => f.key === 'functionCalling'),
    },
    {
      key: 'imageInput',
      condition: features.input?.image,
      config: enabled.find((f) => f.key === 'imageInput'),
    },
    {
      key: 'pdfInput',
      condition: features.input?.pdf,
      config: enabled.find((f) => f.key === 'pdfInput'),
    },
  ];

  featureIconMap.forEach(({ condition, config }) => {
    if (condition && config) {
      const IconComponent = config.icon;
      icons.push(
        <div
          key={config.key}
          className="flex items-center"
          title={config.description}
        >
          <IconComponent className="w-3 h-3 text-muted-foreground" />
        </div>,
      );
    }
  });

  return icons;
}

function PureCommandItem({
  id,
  definition,
  disabled,
  isSelected,
  onSelectModel,
}: {
  id: ModelId;
  definition: ModelDefinition;
  disabled?: boolean;
  isSelected: boolean;
  onSelectModel: (id: ModelId) => void;
}) {
  const provider = definition.owned_by as ProviderId;
  const featureIcons = useMemo(() => getFeatureIcons(definition), [definition]);
  const searchValue = useMemo(
    () => `${definition.name} ${definition.owned_by}`.toLowerCase(),
    [definition],
  );

  return (
    <UICommandItem
      value={searchValue}
      onSelect={() => {
        if (disabled) return;
        onSelectModel(id);
      }}
      className={cn(
        'flex items-center justify-between px-3 py-1.5 cursor-pointer transition-all h-9',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="shrink-0">{getProviderIcon(provider)}</div>
        <span className="font-medium text-sm truncate">{definition.name}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {featureIcons.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">{featureIcons}</div>
        )}
      </div>
    </UICommandItem>
  );
}

const CommandItem = memo(
  PureCommandItem,
  (prevProps, nextProps) =>
    prevProps.id === nextProps.id &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.definition === nextProps.definition,
);
function PureModelSelectorPopoverContent({
  enableFilters,
  filterOpen,
  onFilterOpenChange,
  activeFilterCount,
  clearFilters,
  featureFilters,
  onUpdateFeatureFilters,
  topContent,
  filteredModels,
  optimisticModelId,
  onSelectModel,
  commandItemComponent: CommandItemComponent,
}: {
  enableFilters: boolean;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  activeFilterCount: number;
  clearFilters: () => void;
  featureFilters: FeatureFilter;
  onUpdateFeatureFilters: (
    updater: (prev: FeatureFilter) => FeatureFilter,
  ) => void;
  topContent?: React.ReactNode;
  filteredModels: Array<{
    id: ModelId;
    definition: ModelDefinition;
    disabled?: boolean;
  }>;
  optimisticModelId?: ModelId;
  onSelectModel: (id: ModelId) => void;
  commandItemComponent: (props: {
    id: ModelId;
    definition: ModelDefinition;
    disabled?: boolean;
    isSelected: boolean;
    onSelectModel: (id: ModelId) => void;
  }) => React.ReactNode;
}) {
  const enabledFeatures = getEnabledFeatures();

  return (
    <Command>
      <div className="flex items-center border-b">
        <CommandInput
          placeholder="Search models..."
          className="px-3"
          containerClassName="w-full border-0 h-11"
        />
        {enableFilters && (
          <Popover open={filterOpen} onOpenChange={onFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'mr-3 h-8 w-8 p-0 relative',
                  activeFilterCount > 0 && 'text-primary',
                )}
              >
                <FilterIcon className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 text-xs min-w-[16px] h-4 flex items-center justify-center p-0"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <div className="p-4">
                <div className="mb-3 h-7 flex items-center justify-between">
                  <div className="text-sm font-medium">Filter by Tools</div>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs h-6"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {enabledFeatures.map((feature) => {
                    const IconComponent = feature.icon;
                    return (
                      <div
                        key={feature.key}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={feature.key}
                          checked={featureFilters[feature.key] || false}
                          onCheckedChange={(checked) =>
                            onUpdateFeatureFilters((prev) => ({
                              ...prev,
                              [feature.key]: Boolean(checked),
                            }))
                          }
                        />
                        <Label
                          htmlFor={feature.key}
                          className="text-sm flex items-center gap-1.5"
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          {feature.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {topContent}
      <CommandList
        className="max-h[400px] max-h-[400px]"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <CommandEmpty>No model found.</CommandEmpty>
        <CommandGroup>
          <ScrollArea className="*:data-radix-scroll-area-viewport:max-h-[350px]">
            {filteredModels.map((item) => {
              const { id, definition, disabled } = item;
              const isSelected = id === optimisticModelId;
              return (
                <CommandItemComponent
                  key={id}
                  id={id}
                  definition={definition}
                  disabled={disabled}
                  isSelected={isSelected}
                  onSelectModel={onSelectModel}
                />
              );
            })}
          </ScrollArea>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export const ModelSelectorPopoverContent = memo(
  PureModelSelectorPopoverContent,
);

export type ModelSelectorBaseItem = {
  id: ModelId;
  definition: ModelDefinition;
  disabled?: boolean;
};

export function PureModelSelectorBase({
  models,
  selectedModelId,
  onModelChange,
  className,
  placeholder,
  topContent,
  enableFilters = true,
  initialChevronDirection = 'up',
}: {
  models: Array<ModelSelectorBaseItem>;
  selectedModelId?: ModelId;
  onModelChange?: (modelId: ModelId) => void;
  placeholder?: string;
  topContent?: React.ReactNode;
  enableFilters?: boolean;
  initialChevronDirection?: 'up' | 'down';
} & ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const [featureFilters, setFeatureFilters] =
    useState<FeatureFilter>(initialFilters);

  const filteredModels = useMemo(() => {
    const hasActiveFilters =
      enableFilters && Object.values(featureFilters).some(Boolean);
    if (!hasActiveFilters) return models;
    return models.filter((item) => {
      const features = item.definition?.features;
      if (!features) return false;
      return Object.entries(featureFilters).every(([key, isActive]) => {
        if (!isActive) return true;
        switch (key) {
          case 'reasoning':
            return features.reasoning;
          case 'functionCalling':
            return features.toolCall;
          case 'imageInput':
            return features.input.image;
          case 'pdfInput':
            return features.input.pdf;
          case 'audioInput':
            return features.input.audio;
          case 'imageOutput':
            return features.output.image;
          case 'audioOutput':
            return features.output.audio;
          default:
            return true;
        }
      });
    });
  }, [models, featureFilters, enableFilters]);

  const selectedItem = useMemo(
    () => models.find((m) => m.id === optimisticModelId),
    [models, optimisticModelId],
  );

  const selectedProviderIcon = useMemo(() => {
    if (!selectedItem) return null;
    const provider = selectedItem.definition.owned_by as ProviderId;
    return getProviderIcon(provider);
  }, [selectedItem]);

  const activeFilterCount = useMemo(
    () => Object.values(featureFilters).filter(Boolean).length,
    [featureFilters],
  );

  const clearFilters = () => setFeatureFilters(initialFilters);

  const selectModel = useCallback(
    (id: ModelId) => {
      startTransition(() => {
        setOptimisticModelId(id);
        onModelChange?.(id);
        setOpen(false);
      });
    },
    [onModelChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="model-selector"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn('md:px-2 gap-2 flex justify-between', className)}
        >
          <div className="flex items-center gap-2">
            {selectedProviderIcon && (
              <div className="shrink-0">{selectedProviderIcon}</div>
            )}
            <p className="truncate">
              {selectedItem?.definition.name || placeholder || 'Select model'}
            </p>
          </div>
          <ChevronUpIcon
            className={cn(
              'h-4 w-4 shrink-0 opacity-50 transition-transform',
              (initialChevronDirection === 'up') === open && 'rotate-180',
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        {open ? (
          <ModelSelectorPopoverContent
            enableFilters={enableFilters}
            filterOpen={filterOpen}
            onFilterOpenChange={setFilterOpen}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            featureFilters={featureFilters}
            onUpdateFeatureFilters={setFeatureFilters}
            topContent={topContent}
            filteredModels={filteredModels}
            optimisticModelId={optimisticModelId}
            onSelectModel={selectModel}
            commandItemComponent={CommandItem}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export const ModelSelectorBase = memo(
  PureModelSelectorBase,
  (prevProps, nextProps) => {
    return (
      prevProps.selectedModelId === nextProps.selectedModelId &&
      prevProps.className === nextProps.className &&
      prevProps.onModelChange === nextProps.onModelChange &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.models === nextProps.models &&
      prevProps.enableFilters === nextProps.enableFilters
    );
  },
);
