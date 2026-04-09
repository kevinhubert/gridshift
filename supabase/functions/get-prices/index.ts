/**
 * Supabase Edge Function: get-prices
 * Returns today's price curve for a given hub.
 * 
 * Usage:
 *   GET /functions/v1/get-prices?hub=LZ_HOUSTON&day=2026-04-08
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const url = new URL(req.url);
  const hub = url.searchParams.get('hub') || 'LZ_HOUSTON';
  const day = url.searchParams.get('day') || new Date().toISOString().split('T')[0];

  // Use service role key to bypass RLS on public price data
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data, error } = await supabase
    .from('price_cache')
    .select('interval_end, price_per_mwh, hub')
    .eq('hub', hub)
    .eq('oper_day', day)
    .order('interval_end', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ hub, day, prices: data }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
