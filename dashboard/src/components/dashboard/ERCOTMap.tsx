import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { geoMercator } from 'd3-geo';
import { Choropleth } from '@nivo/geo';
import type { ChoroplethBoundFeature } from '@nivo/geo';
import type { Feature, FeatureCollection } from 'geojson';
import { captureAnalytics } from '@/lib/analytics';
import type { PricePoint } from '@/types';
import { HUB_OPTIONS, type HubOption } from '@/constants/hubs';
import { arcgisZoneToHub, featureZoneKey, hubToArcgisZone } from '@/constants/ercot-zones';

const ARCGIS_QUERY_URL =
  'https://services3.arcgis.com/fwwoCWVtaahwlvxO/ArcGIS/rest/services/' +
  'ERCOT_Load_Zones/FeatureServer/7/query' +
  '?where=1%3D1&outFields=ZONE_NAME,NAME&outSR=4326&f=geojson' +
  '&maxAllowableOffset=0.005';

const CACHE_KEY = 'gs-ercot-geojson-v2';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const MAP_HEIGHT_PX = 320;

export type ERCOTMapProps = {
  displayPrices: PricePoint[];
  hub: string;
  onHubChange?: (hub: string) => void;
};

function getPriceColor(price: number): string {
  if (price < 30) return '#34d399';
  if (price < 60) return '#fbbf24';
  if (price < 100) return '#f97316';
  return '#ef4444';
}

function getPriceLabel(price: number): string {
  if (price < 30) return 'Cheap';
  if (price < 60) return 'Moderate';
  if (price < 100) return 'Elevated';
  return 'Peak';
}

function MapTooltip({ feature }: { feature: ChoroplethBoundFeature }) {
  const hasValue = feature.value != null && !Number.isNaN(feature.value);
  return (
    <div className="max-w-[220px] rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {feature.label}
      </div>
      {hasValue ? (
        <>
          <div
            className="mt-0.5 font-mono text-lg font-bold tabular-nums"
            style={{ color: getPriceColor(feature.value) }}
          >
            ${Number(feature.value).toFixed(2)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/MWh</span>
          </div>
          <div
            className="mt-0.5 text-[11px] font-medium"
            style={{ color: getPriceColor(feature.value) }}
          >
            {getPriceLabel(feature.value)}
          </div>
        </>
      ) : (
        <>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-muted-foreground">—</div>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Avg $/MWh is only loaded for your <span className="font-medium text-foreground/80">selected</span>{' '}
            hub. Pick this zone (or a hub pill) to load its prices.
          </p>
        </>
      )}
    </div>
  );
}

export default function ERCOTMap({ displayPrices, hub, onHubChange }: ERCOTMapProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const mapBoxRef = useRef<HTMLDivElement>(null);
  const [mapWidth, setMapWidth] = useState(400);

  /** After paint: map box often reports width 0 under flex/lazy until layout commits. */
  useLayoutEffect(() => {
    if (loading || error) return;
    const el = mapBoxRef.current;
    if (!el) return;

    const measure = () => {
      let w = Math.floor(el.getBoundingClientRect().width);
      if (w < 160) {
        const p = el.parentElement;
        if (p) w = Math.floor(p.getBoundingClientRect().width);
      }
      if (w < 160 && typeof window !== 'undefined') {
        w = Math.min(720, Math.floor(window.innerWidth - 64));
      }
      setMapWidth(Math.max(260, w));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, error, geoData]);

  useEffect(() => {
    let cancelled = false;

    async function fetchZones() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached) as { data: FeatureCollection; ts: number };
          if (Date.now() - ts < CACHE_TTL_MS) {
            if (!cancelled) {
              setGeoData(data);
              setLoading(false);
            }
            return;
          }
        }

        const res = await fetch(ARCGIS_QUERY_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as FeatureCollection;

        if (!data.features?.length) throw new Error('Empty response');

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
        } catch {
          /* quota */
        }

        if (!cancelled) {
          setGeoData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('ERCOTMap fetch error:', err);
        if (!cancelled) {
          setError('Failed to load zone boundaries');
          setLoading(false);
        }
      }
    }

    fetchZones();
    return () => {
      cancelled = true;
    };
  }, []);

  const avgPrice = useMemo(() => {
    if (!displayPrices.length) return 0;
    return displayPrices.reduce((s, p) => s + p.pricePerMwh, 0) / displayPrices.length;
  }, [displayPrices]);

  const activeArcgisZone = hubToArcgisZone(hub);

  const priceMap = useMemo(() => {
    const m = new Map<string, number>();
    if (avgPrice > 0) m.set(activeArcgisZone, avgPrice);
    return m;
  }, [activeArcgisZone, avgPrice]);

  const nivoFeatures = useMemo(() => {
    if (!geoData?.features?.length) return [];
    const out: Feature[] = [];
    for (const f of geoData.features) {
      const key = featureZoneKey(f);
      if (!key) continue;
      out.push({ ...f, id: key });
    }
    return out;
  }, [geoData]);

  const choroplethData = useMemo(() => {
    if (avgPrice <= 0) return [];
    return [{ id: activeArcgisZone, value: avgPrice }];
  }, [avgPrice, activeArcgisZone]);

  /** Nivo expects scale + normalized translate; d3 fitExtent matches geometry to our pixel box. */
  const projection = useMemo(() => {
    const w = mapWidth;
    const h = MAP_HEIGHT_PX;
    const pad = 10;
    if (nivoFeatures.length === 0 || w < 80 || h < 80) {
      return {
        projectionType: 'mercator' as const,
        projectionScale: 900,
        projectionTranslation: [0.5, 0.5] as [number, number],
        projectionRotation: [0, 0, 0] as [number, number, number],
      };
    }
    const collection: FeatureCollection = { type: 'FeatureCollection', features: nivoFeatures };
    const proj = geoMercator();
    try {
      proj.fitExtent(
        [
          [pad, pad],
          [w - pad, h - pad],
        ],
        collection as object,
      );
    } catch {
      return {
        projectionType: 'mercator' as const,
        projectionScale: 900,
        projectionTranslation: [0.5, 0.5] as [number, number],
        projectionRotation: [0, 0, 0] as [number, number, number],
      };
    }
    const [tx, ty] = proj.translate();
    const scale = proj.scale();
    return {
      projectionType: 'mercator' as const,
      projectionScale: scale,
      projectionTranslation: [tx / w, ty / h] as [number, number],
      projectionRotation: [0, 0, 0] as [number, number, number],
    };
  }, [mapWidth, nivoFeatures]);

  const hoveredPrice = hoveredZone ? priceMap.get(hoveredZone) : undefined;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-ring border-t-transparent" />
          Loading ERCOT zone boundaries…
        </div>
      </div>
    );
  }

  if (error || !geoData || nivoFeatures.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md">
        <p className="text-sm text-destructive">{error || 'No zone data'}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 shadow-lg backdrop-blur-md">
      <div
        className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full blur-[40px]"
        style={{ background: 'rgba(43,127,212,0.1)' }}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            ERCOT load zones
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground/50">
            Official boundaries (ArcGIS) · avg $/MWh for your selected hub today
          </p>
          <p className="mt-1 max-w-xl text-[10px] leading-snug text-muted-foreground/40">
            Map numbers match the hub selected below; other zones stay unpriced until you switch—no fake
            multi-zone data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(['Cheap', 'Moderate', 'Elevated', 'Peak'] as const).map((label) => {
            const colors: Record<string, string> = {
              Cheap: '#34d399',
              Moderate: '#fbbf24',
              Elevated: '#f97316',
              Peak: '#ef4444',
            };
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[label] }} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative w-full">
        {/* Explicit block size: ResponsiveChoropleth often measures 0×0 inside flex/card layouts */}
        <div
          ref={mapBoxRef}
          className="relative w-full min-w-0 rounded-lg bg-muted/20"
          style={{ height: MAP_HEIGHT_PX, minHeight: MAP_HEIGHT_PX }}
        >
          <Choropleth
            width={mapWidth}
            height={MAP_HEIGHT_PX}
            features={nivoFeatures}
            data={choroplethData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              domain={[0, 120]}
              colors={['#34d399', '#fbbf24', '#f97316', '#ef4444']}
              unknownColor="rgba(120,120,130,0.35)"
              borderColor={
                ((f: ChoroplethBoundFeature) =>
                  f.label === activeArcgisZone
                    ? getPriceColor(avgPrice || 0)
                    : 'rgba(255,255,255,0.14)') as never
              }
              borderWidth={(f) => (f.label === activeArcgisZone ? 2 : 0.6)}
              enableGraticule={false}
              {...projection}
              isInteractive
              tooltip={MapTooltip}
              onMouseEnter={(feat) => setHoveredZone(feat.label)}
              onMouseMove={(feat) => setHoveredZone(feat.label)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={(feat, _e) => {
                const zone = feat.label;
                const hubTarget = arcgisZoneToHub(zone);
                if (!hubTarget || !onHubChange) return;
                onHubChange(hubTarget);
                captureAnalytics('ercot_map_zone_click', { zone, hub: hubTarget });
              }}
              theme={{
                background: 'transparent',
                tooltip: { container: { background: 'transparent', boxShadow: 'none', padding: 0 } },
              }}
            />
        </div>

        {hoveredZone && (
          <div className="pointer-events-none absolute top-2 right-2 min-w-[168px] max-w-[200px] rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-md">
            <div className="mb-1 flex items-center gap-2">
              {hoveredPrice != null && (
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: getPriceColor(hoveredPrice) }}
                />
              )}
              <span className="text-[10px] font-semibold tracking-wide text-foreground uppercase">
                {hoveredZone}
              </span>
            </div>
            {hoveredPrice != null ? (
              <>
                <div
                  className="font-mono text-xl font-bold tabular-nums"
                  style={{ color: getPriceColor(hoveredPrice) }}
                >
                  ${hoveredPrice.toFixed(2)}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">/MWh</span>
                </div>
                <div
                  className="text-[10px] font-semibold"
                  style={{ color: getPriceColor(hoveredPrice) }}
                >
                  {getPriceLabel(hoveredPrice)}
                </div>
              </>
            ) : (
              <>
                <div className="font-mono text-xl font-bold tabular-nums text-muted-foreground">—</div>
                <p className="mt-0.5 text-[9px] leading-snug text-muted-foreground">
                  Not your selected hub—switch with a pill or click this zone.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {HUB_OPTIONS.map((opt: HubOption) => {
          const isActive = hub === opt.value;
          const z = hubToArcgisZone(opt.value);
          const showPrice = isActive && avgPrice > 0;
          return (
            <button
              key={opt.value}
              type="button"
              className={`rounded-lg px-3 py-2 text-center transition-all ${
                isActive
                  ? 'border border-ring/30 bg-ring/5'
                  : 'border border-transparent bg-muted/30 hover:bg-muted/50'
              }`}
              onMouseEnter={() => setHoveredZone(z)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={() => {
                onHubChange?.(opt.value);
                captureAnalytics('ercot_map_hub_pill', { hub: opt.value });
              }}
            >
              <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                {opt.pillLabel}
              </div>
              <div
                className="mt-0.5 font-mono text-sm font-bold"
                style={{
                  color: showPrice ? getPriceColor(avgPrice) : 'var(--muted-foreground)',
                }}
              >
                {showPrice ? `$${avgPrice.toFixed(0)}` : '—'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
