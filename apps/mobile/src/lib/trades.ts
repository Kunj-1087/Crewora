/** Trade-category presentation metadata (icon + label), shared across screens. */

import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Flame,
  Layers,
  Wind,
  Grid3x3,
  Home,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import type { TradeCategory } from '@crewora/shared';

interface TradeMeta {
  label: string;
  Icon: LucideIcon;
}

const TRADE_META: Record<TradeCategory, TradeMeta> = {
  plumber: { label: 'Plumber', Icon: Wrench },
  electrician: { label: 'Electrician', Icon: Zap },
  carpenter: { label: 'Carpenter', Icon: Hammer },
  painter: { label: 'Painter', Icon: Paintbrush },
  welder: { label: 'Welder', Icon: Flame },
  mason: { label: 'Mason', Icon: Layers },
  hvac: { label: 'HVAC', Icon: Wind },
  tiler: { label: 'Tiler', Icon: Grid3x3 },
  roofer: { label: 'Roofer', Icon: Home },
  other: { label: 'Other', Icon: HelpCircle },
};

export function tradeMeta(category?: string): TradeMeta {
  return TRADE_META[(category as TradeCategory) ?? 'other'] ?? TRADE_META.other;
}
