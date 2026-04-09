/**
 * ERCOT Real-Time Settlement Point Price Fetcher
 * Scrapes the public HTML page — no auth required.
 * Data refreshes every 15 minutes.
 */

import * as cheerio from 'cheerio';

const ERCOT_RT_SPP_URL = 'https://www.ercot.com/content/cdr/html/real_time_spp.html';

const HUBS = [
  'HB_BUSAVG',
  'HB_HOUSTON',
  'HB_HUBAVG',
  'HB_NORTH',
  'HB_PAN',
  'HB_SOUTH',
  'HB_WEST',
  'LZ_AEN',
  'LZ_CPS',
  'LZ_HOUSTON',
  'LZ_LCRA',
  'LZ_NORTH',
  'LZ_RAYBN',
  'LZ_SOUTH',
  'LZ_WEST',
];

/**
 * Parse "0430" → "04:30"
 */
function parseInterval(raw) {
  if (!raw || raw.length !== 4) return null;
  return `${raw.slice(0, 2)}:${raw.slice(2, 4)}`;
}

/**
 * Parse "04/08/2026" → "2026-04-08"
 */
function parseDate(raw) {
  const match = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[1]}-${match[2]}`;
}

/**
 * @typedef {Object} PriceRecord
 * @property {string} operDay
 * @property {string} intervalEnd  - "HH:MM"
 * @property {string} hub
 * @property {number} pricePerMwh
 * @property {string} fetchedAt   - ISO timestamp
 */

/**
 * Fetch + parse ERCOT real-time SPP data
 * @returns {{ prices: PriceRecord[], operDay: string|null, fetchedAt: string }}
 */
export async function fetchERCOTPrices() {
  const response = await fetch(ERCOT_RT_SPP_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GridShiftBot/1.0; +https://github.com/kevinhubert/gridshift)',
      'Accept': 'text/html',
    },
  });

  if (!response.ok) {
    throw new Error(`ERCOT fetch failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  /** @type {PriceRecord[]} */
  const prices = [];
  let operDay = null;
  let tableFound = false;

  $('table').each((_, table) => {
    if (tableFound) return false;

    const headers = $(table).find('tr:first-child th, tr:first-child td');
    const headerTexts = headers.map((_, h) => $(h).text().trim()).get();

    if (!headerTexts.includes('Oper Day') || !headerTexts.includes('Interval Ending')) {
      return;
    }

    tableFound = true;

    $(table).find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 3) return;

      const dayText = $(cells[0]).text().trim();
      const intervalText = $(cells[1]).text().trim();

      if (!dayText.match(/\d{2}\/\d{2}\/\d{4}/)) return;
      if (!intervalText.match(/^\d{4}$/)) return;

      const date = parseDate(dayText);
      const time = parseInterval(intervalText);
      if (!date || !time) return;

      if (!operDay) operDay = date;

      HUBS.forEach((hub, i) => {
        const cellIndex = i + 2;
        if (cellIndex >= cells.length) return;

        const priceRaw = $(cells[cellIndex]).text().trim();
        const price = parseFloat(priceRaw);

        if (!isNaN(price)) {
          prices.push({
            operDay: date,
            intervalEnd: time,
            hub,
            pricePerMwh: price,
            fetchedAt: new Date().toISOString(),
          });
        }
      });
    });
  });

  if (!tableFound) {
    throw new Error('Could not find ERCOT price table in page');
  }

  return { prices, operDay, fetchedAt: new Date().toISOString() };
}

/**
 * Get N cheapest windows for a given hub
 * @param {PriceRecord[]} prices
 * @param {string} hub
 * @param {number} count
 * @returns {PriceRecord[]}
 */
export function getCheapestWindows(prices, hub, count = 4) {
  return prices
    .filter((p) => p.hub === hub)
    .sort((a, b) => a.pricePerMwh - b.pricePerMwh)
    .slice(0, count);
}

/**
 * Get N most expensive windows for a given hub
 * @param {PriceRecord[]} prices
 * @param {string} hub
 * @param {number} count
 * @returns {PriceRecord[]}
 */
export function getMostExpensiveWindows(prices, hub, count = 4) {
  return prices
    .filter((p) => p.hub === hub)
    .sort((a, b) => b.pricePerMwh - a.pricePerMwh)
    .slice(0, count);
}

/**
 * Get a day's price range for a hub
 */
export function getPriceRange(prices, hub) {
  const hubPrices = prices.filter((p) => p.hub === hub);
  if (!hubPrices.length) return null;
  const vals = hubPrices.map((p) => p.pricePerMwh);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

// --- CLI demo ---
const { prices, operDay, fetchedAt } = await fetchERCOTPrices();

console.log(`\nERCOT Prices for ${operDay} (fetched ${fetchedAt})`);
console.log(`Total records: ${prices.length}\n`);

const demoHubs = ['LZ_HOUSTON', 'HB_HOUSTON', 'HB_NORTH', 'LZ_RAYBN'];
demoHubs.forEach((hub) => {
  const range = getPriceRange(prices, hub);
  if (range) {
    console.log(`${hub}: $${range.min.toFixed(2)} – $${range.max.toFixed(2)}/MWh  (spread: $${(range.max - range.min).toFixed(2)})`);
  }
});

console.log('\nCheapest windows for LZ_HOUSTON:');
getCheapestWindows(prices, 'LZ_HOUSTON', 5).forEach((p) => {
  console.log(`  ${p.intervalEnd} — $${p.pricePerMwh.toFixed(2)}/MWh`);
});
