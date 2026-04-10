/**
 * Supabase Edge Function: cache-prices
 * Runs on a cron schedule (every 15 minutes)
 * Fetches latest ERCOT prices and stores them in the price_cache table.
 * 
 * Deploy with:
 *   supabase functions deploy cache-prices --no-verify-jwt
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ERCOT_RT_SPP_URL = 'https://www.ercot.com/content/cdr/html/real_time_spp.html';

const HUBS = [
  'HB_BUSAVG', 'HB_HOUSTON', 'HB_HUBAVG', 'HB_NORTH', 'HB_PAN', 'HB_SOUTH', 'HB_WEST',
  'LZ_AEN', 'LZ_CPS', 'LZ_HOUSTON', 'LZ_LCRA', 'LZ_NORTH', 'LZ_RAYBN', 'LZ_SOUTH', 'LZ_WEST',
];

function parseInterval(raw) {
  if (!raw || raw.length !== 4) return null;
  return `${raw.slice(0, 2)}:${raw.slice(2, 4)}`;
}

function parseDate(raw) {
  const match = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[1]}-${match[2]}`;
}

async function fetchERCOTPrices() {
  const response = await fetch(ERCOT_RT_SPP_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GridShiftBot/1.0)',
      'Accept': 'text/html',
    },
  });

  if (!response.ok) {
    throw new Error(`ERCOT fetch failed: ${response.status}`);
  }

  const html = await response.text();

  // Simple regex-based parsing (avoids cheerio in Deno)
  const records = [];
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>([\d\/]+)<\/td>\s*<td[^>]*>(\d{4})<\/td>([\s\S]*?)<\/tr>/g;
  
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const [, dayRaw, intervalRaw, cellsHtml] = match;
    const date = parseDate(dayRaw);
    const time = parseInterval(intervalRaw);
    if (!date || !time) continue;

    // Extract price values from remaining cells
    const priceRegex = /<td[^>]*>([^<]+)<\/td>/g;
    const prices = [];
    let priceMatch;
    while ((priceMatch = priceRegex.exec(cellsHtml)) !== null) {
      const val = parseFloat(priceMatch[1].trim());
      if (!isNaN(val)) prices.push(val);
    }

    HUBS.forEach((hub, i) => {
      if (prices[i] !== undefined) {
        records.push({
          hub,
          price_per_mwh: prices[i],
          interval_end: `${date}T${time}:00`,
          oper_day: date,
        });
      }
    });
  }

  return records;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const records = await fetchERCOTPrices();
    
    if (!records.length) {
      return new Response(JSON.stringify({ error: 'No records parsed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Batch insert
    const { error } = await supabase.from('price_cache').upsert(records, { onConflict: 'hub,interval_end' });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, count: records.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
