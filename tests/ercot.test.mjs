import { test } from 'node:test';
import assert from 'node:assert';
import { fetchERCOTPrices, getCheapestWindows, getMostExpensiveWindows, getPriceRange } from '../src/fetcher/ercot.mjs';

test('fetchERCOTPrices returns data', async () => {
  const data = await fetchERCOTPrices();
  
  assert.ok(data.prices.length > 0, 'should return price records');
  assert.ok(data.operDay, 'should have an operDay');
  assert.ok(data.fetchedAt, 'should have a fetchedAt timestamp');
  
  const first = data.prices[0];
  assert.ok(first.hub, 'should have a hub');
  assert.ok(typeof first.pricePerMwh === 'number', 'price should be a number');
  assert.ok(first.intervalEnd.match(/^\d{2}:\d{2}$/), 'intervalEnd should be HH:MM');
});

test('getCheapestWindows returns sorted results', async () => {
  const { prices } = await fetchERCOTPrices();
  const cheapest = getCheapestWindows(prices, 'LZ_HOUSTON', 3);
  
  assert.equal(cheapest.length, 3, 'should return 3 results');
  
  // Verify sorted ascending
  for (let i = 1; i < cheapest.length; i++) {
    assert.ok(cheapest[i].pricePerMwh >= cheapest[i - 1].pricePerMwh, 'should be ascending');
  }
});

test('getPriceRange returns min and max', async () => {
  const { prices } = await fetchERCOTPrices();
  const range = getPriceRange(prices, 'LZ_HOUSTON');
  
  assert.ok(range, 'should return a range');
  assert.ok(range.min <= range.max, 'min should be <= max');
  
  // Verify against actual data
  const hubPrices = prices.filter(p => p.hub === 'LZ_HOUSTON').map(p => p.pricePerMwh);
  assert.equal(range.min, Math.min(...hubPrices), 'min should match');
  assert.equal(range.max, Math.max(...hubPrices), 'max should match');
});

test('negative prices are preserved (valid ERCOT behavior)', async () => {
  const { prices } = await fetchERCOTPrices();
  const northPrices = prices.filter(p => p.hub === 'HB_NORTH');
  
  // ERCOT north zone can go negative during solar glut
  const hasNegative = northPrices.some(p => p.pricePerMwh < 0);
  if (hasNegative) {
    const cheapest = getCheapestWindows(prices, 'HB_NORTH', 1);
    assert.ok(cheapest[0].pricePerMwh < 0, 'cheapest should include negative prices');
  }
});
