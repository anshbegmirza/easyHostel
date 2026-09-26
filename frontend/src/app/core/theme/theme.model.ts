import { ColorMode } from '../config/app-config.model';

/** Accent themes driven by backend THEME_PALETTE / APP_MODE. */
export type BrandPalette = 'purple' | 'green' | 'works4' | 'amber';

export const BRAND_PALETTES: {
  id: BrandPalette;
  label: string;
  envValue: string;
}[] = [
  { id: 'purple', label: 'Purple (test default)', envValue: 'purple' },
  { id: 'green', label: 'Green (prod default)', envValue: 'green' },
  { id: 'works4', label: 'Blue', envValue: 'works4' },
  { id: 'amber', label: 'Warm amber', envValue: 'amber' },
];

export function isBrandPalette(value: string | null | undefined): value is BrandPalette {
  return value === 'purple' || value === 'green' || value === 'works4' || value === 'amber';
}

export type { ColorMode };
