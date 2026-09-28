export const DEFAULT_HUB = 'LZ_HOUSTON';

/** ERCOT load zones collected by `cache-prices`; `label` is the plain-English area. */
export const HUB_OPTIONS = [
  { value: 'LZ_HOUSTON', label: 'Houston' },
  { value: 'LZ_NORTH', label: 'North (Dallas–Fort Worth)' },
  { value: 'LZ_SOUTH', label: 'South (Corpus Christi, Valley)' },
  { value: 'LZ_WEST', label: 'West (Midland, Abilene)' },
  { value: 'LZ_AEN', label: 'Austin Energy' },
  { value: 'LZ_CPS', label: 'CPS Energy (San Antonio)' },
  { value: 'LZ_LCRA', label: 'LCRA (Central Texas)' },
  { value: 'LZ_RAYBN', label: 'Rayburn Country' },
] as const;

export function isKnownHub(hub: string): boolean {
  return HUB_OPTIONS.some((o) => o.value === hub);
}
