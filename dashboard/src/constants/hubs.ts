export const DEMO_HUB = 'LZ_HOUSTON';

/** `pillLabel`: short text for tight UI (avoid truncating `label`). */
export const HUB_OPTIONS = [
  { value: 'LZ_HOUSTON', label: 'LZ_HOUSTON (Austin)', pillLabel: 'Houston (Austin)' },
  { value: 'HB_HOUSTON', label: 'HB_HOUSTON', pillLabel: 'Houston HUB' },
  { value: 'HB_NORTH', label: 'HB_NORTH', pillLabel: 'North' },
  { value: 'LZ_RAYBN', label: 'LZ_RAYBN', pillLabel: 'Rayburn' },
] as const;

export type HubOption = (typeof HUB_OPTIONS)[number];
