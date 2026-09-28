-- price_cache was created without the unique (hub, interval_end) constraint that
-- schema.sql declares, so rows were double-inserted and cache-prices' upsert
-- (onConflict: 'hub,interval_end') has failed every run since 2026-04-09 with
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification".

begin;

-- Keep the earliest row per interval.
delete from public.price_cache a
  using public.price_cache b
  where a.hub = b.hub
    and a.interval_end = b.interval_end
    and a.id > b.id;

alter table public.price_cache
  add constraint price_cache_hub_interval_end_key unique (hub, interval_end);

commit;
