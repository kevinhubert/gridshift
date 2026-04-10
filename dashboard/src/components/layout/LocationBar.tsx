import { useCallback, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HUB_OPTIONS } from '@/constants/hubs';

const ZONE_MAP: Record<string, string> = {
  '78701': 'LZ_HOUSTON',
  '78702': 'LZ_HOUSTON',
  '78703': 'LZ_HOUSTON',
  '78704': 'LZ_HOUSTON',
  '78705': 'LZ_HOUSTON',
  '78745': 'LZ_HOUSTON',
  '78748': 'LZ_HOUSTON',
  '78749': 'LZ_HOUSTON',
  '78660': 'LZ_HOUSTON',
  '78664': 'LZ_HOUSTON',
  '78681': 'LZ_HOUSTON',
  '77001': 'LZ_HOUSTON',
  '77002': 'LZ_HOUSTON',
  '77003': 'LZ_HOUSTON',
  '77004': 'LZ_HOUSTON',
  '77005': 'LZ_HOUSTON',
  '77006': 'LZ_HOUSTON',
  '75201': 'LZ_NORTH',
  '75202': 'LZ_NORTH',
  '75204': 'LZ_NORTH',
  '75205': 'LZ_NORTH',
  '76101': 'LZ_NORTH',
  '76102': 'LZ_NORTH',
  '78201': 'LZ_SOUTH',
  '78202': 'LZ_SOUTH',
  '78204': 'LZ_SOUTH',
  '78205': 'LZ_SOUTH',
  '78501': 'LZ_SOUTH',
  '79901': 'LZ_WEST',
  '79902': 'LZ_WEST',
  '79903': 'LZ_WEST',
};

/** Map ERCOT-style zone labels from zip lookup → hub values in `HUB_OPTIONS`. */
const ZONE_TO_APP_HUB: Record<string, string> = {
  LZ_HOUSTON: 'LZ_HOUSTON',
  LZ_NORTH: 'HB_NORTH',
  LZ_SOUTH: 'LZ_HOUSTON',
  LZ_WEST: 'LZ_HOUSTON',
};

function lookupZone(zip: string): string | null {
  return ZONE_MAP[zip] ?? null;
}

function zoneToAppHub(zone: string): string | null {
  const candidate = ZONE_TO_APP_HUB[zone] ?? zone;
  return HUB_OPTIONS.some((o) => o.value === candidate) ? candidate : null;
}

async function detectLocation(): Promise<{ zip: string; city: string; state: string } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );
          const data = (await res.json()) as {
            postcode?: string;
            city?: string;
            locality?: string;
            principalSubdivisionCode?: string;
          };
          resolve({
            zip: data.postcode || '',
            city: data.city || data.locality || '',
            state: data.principalSubdivisionCode?.replace('US-', '') || '',
          });
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 8000 },
    );
  });
}

interface LocationState {
  zip: string;
  city: string;
  state: string;
  zone: string;
}

const DEFAULT_LOCATION: LocationState = {
  zip: '78701',
  city: 'Austin',
  state: 'TX',
  zone: 'LZ_HOUSTON',
};

function loadStoredLocation(): LocationState {
  if (typeof window === 'undefined') return DEFAULT_LOCATION;
  try {
    const stored = localStorage.getItem('gs-location');
    if (stored) return JSON.parse(stored) as LocationState;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCATION;
}

export type LocationBarProps = {
  hub: string;
  onHubChange: (hub: string) => void;
};

export function LocationBar({ hub, onHubChange }: LocationBarProps) {
  const [location, setLocation] = useState<LocationState>(loadStoredLocation);
  const [open, setOpen] = useState(false);
  const [zipInput, setZipInput] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');

  const save = useCallback(
    (loc: LocationState, appHub: string) => {
      setLocation(loc);
      localStorage.setItem('gs-location', JSON.stringify(loc));
      onHubChange(appHub);
      setOpen(false);
      setError('');
      setZipInput('');
    },
    [onHubChange],
  );

  const handleZipSubmit = () => {
    const zip = zipInput.trim();
    if (!/^\d{5}$/.test(zip)) {
      setError('Enter a valid 5-digit Texas zip code');
      return;
    }
    const zone = lookupZone(zip);
    if (!zone) {
      setError('Zip not found — make sure it’s within the ERCOT service area');
      return;
    }
    const appHub = zoneToAppHub(zone);
    if (!appHub) {
      setError('That load zone isn’t available in this app yet — pick a hub from the dashboard.');
      return;
    }
    save({ zip, city: '', state: 'TX', zone }, appHub);
  };

  const handleDetect = async () => {
    setDetecting(true);
    setError('');
    const result = await detectLocation();
    setDetecting(false);
    if (!result || !result.zip) {
      setError('Couldn’t detect location — try entering your zip manually');
      return;
    }
    const zone = lookupZone(result.zip);
    if (!zone) {
      setError(`Zip ${result.zip} isn’t in the ERCOT service area`);
      return;
    }
    const appHub = zoneToAppHub(zone);
    if (!appHub) {
      setError('That load zone isn’t available in this app yet.');
      return;
    }
    save(
      { zip: result.zip, city: result.city, state: result.state, zone },
      appHub,
    );
  };

  const displayCity = location.city
    ? `${location.city}, ${location.state} ${location.zip}`
    : `${location.state} ${location.zip}`.trim() || 'Set your location';

  return (
    <>
      <div className="grid grid-cols-3 items-center py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ring/10 text-xs">
            ⚡
          </div>
          <span className="font-mono text-xs font-semibold tracking-wide text-ring">{hub}</span>
        </div>

        <div className="text-center text-sm font-medium text-foreground">{displayCity}</div>

        <div className="text-right">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-0 text-xs text-ring hover:bg-transparent hover:text-ring/80"
            onClick={() => setOpen(true)}
          >
            Change
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set your location</DialogTitle>
            <DialogDescription>
              Enter your zip code to find your ERCOT load zone, or let us detect it automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-2">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 78701"
                value={zipInput}
                onChange={(e) => {
                  setZipInput(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleZipSubmit()}
                maxLength={5}
                className="font-mono"
              />
              <Button type="button" onClick={handleZipSubmit}>
                Look up
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDetect}
              disabled={detecting}
              className="inline-flex w-full items-center justify-center gap-2"
            >
              <MapPin className="size-4 shrink-0" aria-hidden />
              {detecting ? 'Detecting…' : 'Use my location'}
            </Button>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              Current hub:{' '}
              <span className="font-mono font-semibold text-foreground">{hub}</span>
              {' · '}
              {displayCity}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
