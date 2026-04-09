/**
 * Shared TypeScript types for GridShift
 */

export type DeviceType = 'ev' | 'pool_pump' | 'dishwasher' | 'laundry' | 'water_heater' | 'other';

export interface Profile {
  id: string; // links to auth.users
  utility_provider: string | null;
  base_monthly_kwh: number | null;
  created_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  name: string;            // "Pool Pump", "EV Charger"
  device_type: DeviceType;
  daily_kwh: number;        // typical daily energy use
  flexible_hours: number[]; // e.g. [0,1,2,3,4] for midnight–4am
  created_at: string;
}

export interface PriceRecord {
  operDay: string;        // "2026-04-08"
  intervalEnd: string;     // "04:30"
  hub: string;             // "LZ_HOUSTON", "HB_NORTH", etc.
  pricePerMwh: number;
  fetchedAt: string;       // ISO
}

export interface PriceWindow {
  startHour: number;       // 0–23
  endHour: number;
  avgPricePerMwh: number;
  totalKwh: number;
  estimatedCost: number;   // $
  estimatedSavings: number; // $ vs peak
}

export interface OptimizationInsight {
  deviceName: string;
  currentSchedule: { hour: number };
  recommendedSchedule: PriceWindow;
  monthlySavings: number;
}
