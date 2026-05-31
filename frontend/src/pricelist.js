// 📊 MASTER PRICING AND HARDWARE PROPERTY UTILITIES
export const hardcodedRigs = [
  {
    id: 'rig_1',
    name: 'SOL Core',
    icon: '📦',
    priceUsdc: 20.00
  },
  {
    id: 'rig_2',
    name: 'SOL Flux',
    icon: '🌪️',
    priceUsdc: 50.00
  },
  {
    id: 'rig_3',
    name: 'Siberian Vapor',
    icon: '⚡',
    priceUsdc: 100.00
  },
  {
    id: 'rig_4',
    name: 'SOL Vector',
    icon: '🚀',
    priceUsdc: 200.00
  },
  {
    id: 'rig_5',
    name: 'Hyperion Cluster',
    icon: '💎',
    priceUsdc: 500.00
  },
  {
    id: 'rig_6',
    name: 'SOL Quantum',
    icon: '🌌',
    priceUsdc: 1000.00
  }
];

/**
 * 📈 Extracts the specific tier percentage rate matrix directly from user criteria rules
 */
export function getRoiPercentage(leaseDays) {
  if (leaseDays === 30) return 60.76;
  if (leaseDays === 60) return 63.70;
  if (leaseDays === 90) return 69.00; 
  return 0.00;
}