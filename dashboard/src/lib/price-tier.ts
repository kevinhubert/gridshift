export type PriceTier = 'cheap' | 'moderate' | 'elevated' | 'peak';

export function getPriceTier(price: number): PriceTier {
  if (price < 30) return 'cheap';
  if (price < 60) return 'moderate';
  if (price < 100) return 'elevated';
  return 'peak';
}

export function getTierDisplayLabel(tier: PriceTier): string {
  const labels: Record<PriceTier, string> = {
    cheap: 'Cheap',
    moderate: 'Moderate',
    elevated: 'Elevated',
    peak: 'Peak',
  };
  return labels[tier];
}
