/**
 * ERCOT fetcher — runs on a 15-minute interval
 * Stores latest prices to a local JSON file for debugging/backup.
 * In production, this logic runs inside a Supabase Edge Function.
 */

import { fetchERCOTPrices, getPriceRange, getCheapestWindows } from './ercot.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = './data';
const POLL_INTERVAL_MS = 15 * 60 * 1000;

async function poll() {
  try {
    const data = await fetchERCOTPrices();
    const timestamp = new Date().toISOString();

    // Save raw data
    mkdirSync(DATA_DIR, { recursive: true });
    const filename = join(DATA_DIR, `prices-${data.operDay}.json`);
    writeFileSync(filename, JSON.stringify(data, null, 2));

    // Quick summary
    const range = getPriceRange(data.prices, 'LZ_HOUSTON');
    console.log(`[${timestamp}] ${data.prices.length} records | LZ_HOUSTON: $${range?.min.toFixed(2)}–$${range?.max.toFixed(2)}/MWh | saved to ${filename}`);

    return data;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
  }
}

console.log(`GridShift fetcher starting. Polling every ${POLL_INTERVAL_MS / 1000 / 60} minutes.\n`);
await poll(); // run once immediately

setInterval(poll, POLL_INTERVAL_MS);
