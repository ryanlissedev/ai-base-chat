'use client';

import type { ComponentType, SVGProps } from 'react';
import {
  Brain,
  PlugZap,
  Type as TypeIcon,
  Image as ImageIcon,
  FileText,
  Mic,
  Volume2,
} from 'lucide-react';

export type CapabilityKey =
  | 'input.text'
  | 'input.image'
  | 'input.pdf'
  | 'input.audio'
  | 'output.text'
  | 'output.image'
  | 'output.audio'
  | 'reasoning'
  | 'tools';

export type CapabilityEntry = {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const CAPABILITY_ICONS: Record<CapabilityKey, CapabilityEntry> = {
  'input.text': { label: 'Text in', Icon: TypeIcon },
  'input.image': { label: 'Image in', Icon: ImageIcon },
  'input.pdf': { label: 'PDF in', Icon: FileText },
  'input.audio': { label: 'Audio in', Icon: Mic },
  'output.text': { label: 'Text out', Icon: TypeIcon },
  'output.image': { label: 'Image out', Icon: ImageIcon },
  'output.audio': { label: 'Audio out', Icon: Volume2 },
  reasoning: { label: 'Reasoning', Icon: Brain },
  tools: { label: 'Tools', Icon: PlugZap },
};
