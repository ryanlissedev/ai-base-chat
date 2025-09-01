'use client';

import type { ComponentType, SVGProps } from 'react';
import {
  Brain,
  PlugZap,
  Type as TypeIcon,
  Image as ImageIcon,
  FileText,
  Mic,
} from 'lucide-react';

export type CapabilityKey =
  | 'text'
  | 'image'
  | 'pdf'
  | 'audio'
  | 'reasoning'
  | 'tools';

export type CapabilityEntry = {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const CAPABILITY_ICONS: Record<CapabilityKey, CapabilityEntry> = {
  text: { label: 'Text', Icon: TypeIcon },
  image: { label: 'Image', Icon: ImageIcon },
  pdf: { label: 'PDF', Icon: FileText },
  audio: { label: 'Audio', Icon: Mic },
  reasoning: { label: 'Reasoning', Icon: Brain },
  tools: { label: 'Tools', Icon: PlugZap },
};
