/**
 * Supabase Edge Function: get-insights
 * Given a user's devices and today's prices, calculate optimal run windows.
 * 
 * Body:
 *   { hub: "LZ_HOUSTON", devices: [{ name, daily_kwh, flexible_hours }] }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { hub, devices } = await req.json();
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's prices
  const { data: prices, error } = await supabase
    .from('price_cache')
    .select('interval_end, price_per_mwh')
    .eq('hub', hub || 'LZ_HOUSTON')
    .eq('oper_day', today)
    .order('interval_end', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Convert interval_end to hour number
  const priceByHour = {};
  prices.forEach((p) => {
    const hour = parseInt(p.interval_end.split('T')[1].split(':')[0]);
    if (!priceByHour[hour]) priceByHour[hour] = [];
    priceByHour[hour].push(p.price_per_mwh);
  });

  // Average price per hour
  const avgPriceByHour = {};
  Object.keys(priceByHour).forEach((h) => {
    const vals = priceByHour[h];
    avgPriceByHour[h] = vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  // Find peak price for savings calculation
  const peakPrice = Math.max(...Object.values(avgPriceByHour));

  // For each device, find optimal window
  const insights = devices.map((device) => {
    const flexibleHours = device.flexible_hours || [];
    const validHours = flexibleHours
      .map((h) => ({ hour: h, avgPrice: avgPriceByHour[h] }))
      .filter((h) => h.avgPrice !== undefined)
      .sort((a, b) => a.avgPrice - b.avgPrice);

    if (!validHours.length) {
      return {
        device: device.name,
        status: 'no_data',
        message: 'No price data for flexible hours',
      };
    }

    const optimal = validHours[0];
    const peakHour = Object.entries(avgPriceByHour)
      .map(([h, p]) => ({ hour: parseInt(h), price: p }))
      .sort((a, b) => b.price - a.price)[0];

    const estimatedCostAtOptimal = (device.daily_kwh * optimal.avgPrice) / 1000;
    const estimatedCostAtPeak = (device.daily_kwh * peakPrice) / 1000;
    const monthlySavings = (estimatedCostAtPeak - estimatedCostAtOptimal) * 30;

    return {
      device: device.name,
      dailyKwh: device.daily_kwh,
      optimalWindow: {
        hour: optimal.hour,
        pricePerMwh: Math.round(optimal.avgPrice * 100) / 100,
      },
      peakWindow: {
        hour: peakHour.hour,
        pricePerMwh: Math.round(peakHour.price * 100) / 100,
      },
      estimatedDailyCostAtOptimal: Math.round(estimatedCostAtOptimal * 100) / 100,
      estimatedDailyCostAtPeak: Math.round(estimatedCostAtPeak * 100) / 100,
      monthlySavings: Math.round(monthlySavings * 100) / 100,
    };
  });

  return new Response(JSON.stringify({ hub, day: today, insights }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
