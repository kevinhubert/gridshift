import type { Feature } from 'geojson';
import { HUB_OPTIONS } from '@/constants/hubs';

/**
 * ERCOT load-zone layer often leaves `ZONE_NAME` null and only sets `NAME`
 * (e.g. "Houston", "North") — map those to the LZ_* keys the app uses.
 */
const LOAD_ZONE_DISPLAY_NAME_TO_KEY: Record<string, string> = {
  Houston: 'LZ_HOUSTON',
  North: 'LZ_NORTH',
  South: 'LZ_SOUTH',
  West: 'LZ_WEST',
};

/**
 * Stable zone id for a feature from ArcGIS GeoJSON (`ZONE_NAME` or `NAME`).
 */
export function featureZoneKey(feature: Feature): string | null {
  const p = feature.properties as Record<string, unknown> | null | undefined;
  if (!p) return null;
  const zn = p.ZONE_NAME;
  if (typeof zn === 'string' && zn.length > 0) return zn;
  const displayName = p.NAME;
  if (typeof displayName === 'string') {
    const mapped = LOAD_ZONE_DISPLAY_NAME_TO_KEY[displayName];
    if (mapped) return mapped;
  }
  return null;
}

/**
 * Map app hub values → polygon id on the 4-zone ArcGIS layer (Houston, North, South, West).
 * Rayburn (`LZ_RAYBN`) has no separate polygon — use **South** for map fill / click (approximate).
 */
const HUB_TO_ARCGIS: Record<string, string> = {
  LZ_HOUSTON: 'LZ_HOUSTON',
  HB_HOUSTON: 'LZ_HOUSTON',
  HB_NORTH: 'LZ_NORTH',
  LZ_RAYBN: 'LZ_SOUTH',
};

/** Polygon id → app hub for map clicks (must cover every tappable zone we care about). */
const ARCGIS_TO_HUB: Partial<Record<string, string>> = {
  LZ_HOUSTON: 'LZ_HOUSTON',
  LZ_NORTH: 'HB_NORTH',
  LZ_SOUTH: 'LZ_RAYBN',
};

export function hubToArcgisZone(hub: string): string {
  return HUB_TO_ARCGIS[hub] ?? hub;
}

/** Resolve a polygon ZONE_NAME to an app hub we can select; null if unsupported. */
export function arcgisZoneToHub(zoneName: string): string | null {
  const direct = ARCGIS_TO_HUB[zoneName];
  if (direct) return direct;
  if (HUB_OPTIONS.some((o) => o.value === zoneName)) return zoneName;
  return null;
}
