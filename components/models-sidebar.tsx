'use client';
import { NewChatButton } from '@/components/new-chat-button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarTopRow } from '@/components/sidebar-top-row';
import { ModelFilters } from '@/app/(models)/models/model-filters';
import { useState } from 'react';
import type { FilterState } from '@/app/(models)/models/model-filters';

export function ModelsSidebar() {
  const { open, openMobile } = useSidebar();
  const [filters, setFilters] = useState<FilterState>({
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
  });
  return (
    <Sidebar
      collapsible="icon"
      className="group-data-[side=left]:border-r-0 grid grid-rows-[auto_1fr_auto] max-h-dvh"
    >
      <SidebarHeader className="shrink-0">
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <SidebarTopRow />
          </div>

          <NewChatButton />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <ScrollArea className="relative flex-1 overflow-y-auto">
        <SidebarContent className="max-w-(--sidebar-width) pr-2">
          {(open || openMobile) && (
            <ModelFilters filters={filters} onFiltersChange={setFilters} />
          )}
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}
