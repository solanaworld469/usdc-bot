// 📊 MASTER PRICING AND HARDWARE PROPERTY UTILITIES
export const hardcodedRigs = [
  {
    id: 'rig_1',
    name: 'SOL Core',
    icon: '📦',
    priceUsdc: 0.15
  },
  {
    id: 'rig_2',
    name: 'SOL Flux',
    icon: '🌪️',
    priceUsdc: 1.00
  },
  {
    id: 'rig_3',
    name: 'Siberian Vapor',
    icon: '⚡',
    priceUsdc: 5.00
  },
  {
    id: 'rig_4',
    name: 'SOL Vector',
    icon: '🚀',
    priceUsdc: 10.00
  },
  {
    id: 'rig_5',
    name: 'Hyperion Cluster',
    icon: '💎',
    priceUsdc: 25.00
  },
  {
    id: 'rig_6',
    name: 'SOL Quantum',
    icon: '🌌',
    priceUsdc: 50.00
  }
];

/**
 * 📈 Extracts the specific tier percentage rate matrix directly from user criteria rules
 */
export function getRoiPercentage(leaseDays) {
  if (leaseDays === 30) return 60.76;
  if (leaseDays === 60) return 65.70;
  if (leaseDays === 90) return 70.06;
  return 0.00;
}