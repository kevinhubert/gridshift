// Shared types between frontend and backend

export interface PricePoint {
  intervalEnd: string; // "HH:MM"
  pricePerMwh: number;
}

export interface Device {
  id?: string;
  name: string;
  deviceType: DeviceType;
  dailyKwh: number;
  flexibleHours: number[]; // 0-23
}

export type DeviceType = 'ev' | 'pool_pump' | 'dishwasher' | 'laundry' | 'water_heater' | 'other';

export interface Insight {
  device: string;
  dailyKwh: number;
  optimalWindow: { hour: number; pricePerMwh: number };
  peakWindow: { hour: number; pricePerMwh: number };
  estimatedDailyCostAtOptimal: number;
  estimatedDailyCostAtPeak: number;
  monthlySavings: number;
}

export interface OptimizationResponse {
  hub: string;
  day: string;
  insights: Insight[];
}
