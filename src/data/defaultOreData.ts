export interface EquipmentCost {
  level: number;
  blue: number;
  purple: number;
  gold?: number;
}

export interface OreTotals {
  blue: number;
  purple: number;
  gold: number;
}

// Common Equipment: Level 1 to 18 (Blue & Purple only)
export const COMMON_EQUIPMENT_DATA: EquipmentCost[] = [
  { level: 1, blue: 0, purple: 0 },
  { level: 2, blue: 120, purple: 0 },
  { level: 3, blue: 240, purple: 20 },
  { level: 4, blue: 400, purple: 0 },
  { level: 5, blue: 600, purple: 0 },
  { level: 6, blue: 840, purple: 100 },
  { level: 7, blue: 1120, purple: 0 },
  { level: 8, blue: 1440, purple: 0 },
  { level: 9, blue: 1800, purple: 200 },
  { level: 10, blue: 1900, purple: 0 },
  { level: 11, blue: 2000, purple: 0 },
  { level: 12, blue: 2100, purple: 400 },
  { level: 13, blue: 2200, purple: 0 },
  { level: 14, blue: 2300, purple: 0 },
  { level: 15, blue: 2400, purple: 600 },
  { level: 16, blue: 2500, purple: 0 },
  { level: 17, blue: 2600, purple: 0 },
  { level: 18, blue: 2700, purple: 600 },
];

// Epic Equipment: Level 1 to 27 (Blue, Purple, Gold)
export const EPIC_EQUIPMENT_DATA: EquipmentCost[] = [
  { level: 1, blue: 0, purple: 0, gold: 0 },
  { level: 2, blue: 120, purple: 0, gold: 0 },
  { level: 3, blue: 240, purple: 20, gold: 0 },
  { level: 4, blue: 400, purple: 0, gold: 0 },
  { level: 5, blue: 600, purple: 0, gold: 0 },
  { level: 6, blue: 840, purple: 100, gold: 0 },
  { level: 7, blue: 1120, purple: 0, gold: 0 },
  { level: 8, blue: 1440, purple: 0, gold: 0 },
  { level: 9, blue: 1800, purple: 200, gold: 10 },
  { level: 10, blue: 1900, purple: 0, gold: 0 },
  { level: 11, blue: 2000, purple: 0, gold: 0 },
  { level: 12, blue: 2100, purple: 400, gold: 20 },
  { level: 13, blue: 2200, purple: 0, gold: 0 },
  { level: 14, blue: 2300, purple: 0, gold: 0 },
  { level: 15, blue: 2400, purple: 600, gold: 30 },
  { level: 16, blue: 2500, purple: 0, gold: 0 },
  { level: 17, blue: 2600, purple: 0, gold: 0 },
  { level: 18, blue: 2700, purple: 600, gold: 50 },
  { level: 19, blue: 2800, purple: 0, gold: 0 },
  { level: 20, blue: 2900, purple: 0, gold: 0 },
  { level: 21, blue: 3000, purple: 600, gold: 100 },
  { level: 22, blue: 3100, purple: 0, gold: 0 },
  { level: 23, blue: 3200, purple: 0, gold: 0 },
  { level: 24, blue: 3300, purple: 600, gold: 120 },
  { level: 25, blue: 3400, purple: 0, gold: 0 },
  { level: 26, blue: 3500, purple: 0, gold: 0 },
  { level: 27, blue: 3600, purple: 600, gold: 150 },
];

export function calculateRequiredOres(
  data: EquipmentCost[],
  currentLevel: number,
  goalLevel: number
): OreTotals {
  if (goalLevel <= currentLevel) {
    return { blue: 0, purple: 0, gold: 0 };
  }

  let blue = 0;
  let purple = 0;
  let gold = 0;

  for (const row of data) {
    if (row.level > currentLevel && row.level <= goalLevel) {
      blue += row.blue || 0;
      purple += row.purple || 0;
      gold += row.gold || 0;
    }
  }

  return { blue, purple, gold };
}
