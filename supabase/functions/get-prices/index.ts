/**
 * Supabase Edge Function: get-prices
 * Returns today's price curve for a given hub.
 * 
 * Usage:
 *   GET /functions/v1/get-prices?hub=LZ_HOUSTON&day=2026-04-08
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  const url = new URL(req.url);
  const hub = url.searchParams.get('hub') || 'LZ_HOUSTON';
  const dayParam = url.searchParams.get('day');

  // Default to Chicago time (ERCOT operates in Central Time)
  const chicagoOffset = -6; // CST (UTC-6)
  const now = new Date();
  const chicagoDate = new Date(now.getTime() + chicagoOffset * 60 * 60 * 1000);
  const day = dayParam || chicagoDate.toISOString().split('T')[0];

  // Use service role key to bypass RLS on public price data
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // First try exact day match; if no results, get most recent data
  let { data, error } = await supabase
    .from('price_cache')
    .select('interval_end, price_per_mwh, hub')
    .eq('hub', hub)
    .eq('oper_day', day)
    .order('interval_end', { ascending: true });

  if ((!data || data.length === 0) && !dayParam) {
    // Fall back to most recent available day
    const { data: latest } = await supabase
      .from('price_cache')
      .select('interval_end, price_per_mwh, hub, oper_day')
      .eq('hub', hub)
      .order('oper_day', { ascending: false })
      .limit(1);

    if (latest && latest.length > 0) {
      const latestDay = latest[0].oper_day;
      const fallback = await supabase
        .from('price_cache')
        .select('interval_end, price_per_mwh, hub')
        .eq('hub', hub)
        .eq('oper_day', latestDay)
        .order('interval_end', { ascending: true });
      data = fallback.data;
    }
  }

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ hub, day, prices: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
