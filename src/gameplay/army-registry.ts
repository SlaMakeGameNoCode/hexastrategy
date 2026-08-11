import { UnitCategory } from '../core/terrain-matrix.js';

export type ArmyClassId =
  | 'SHORT_SPEAR'
  | 'LONG_SPEAR'
  | 'SWORD_SHIELD'
  | 'GREATSWORD'
  | 'LIGHT_CAVALRY'
  | 'HEAVY_CAVALRY'
  | 'HORSE_ARCHER'
  | 'SHORT_BOW'
  | 'LONGBOW'
  | 'CROSSBOW'
  | 'HEAVY_CROSSBOW'
  | 'CATAPULT';

export interface ArmyStats {
  id: ArmyClassId;
  name: string;
  category: UnitCategory;
  hp: number;
  attack: number;
  defense: number;
  actionCost: number; // AP Cost
  movementPoints: number; // MP
  range: number;
  initiative: number;
  cooldownTurns: number;
}

export class ArmyRegistry {
  private static readonly STATS: Record<ArmyClassId, ArmyStats> = {
    SHORT_SPEAR: { id: 'SHORT_SPEAR', name: 'Giáo Ngắn', category: 'INFANTRY', hp: 100, attack: 25, defense: 20, actionCost: 1, movementPoints: 2, range: 1, initiative: 4, cooldownTurns: 0 },
    LONG_SPEAR: { id: 'LONG_SPEAR', name: 'Giáo Dài', category: 'INFANTRY', hp: 110, attack: 28, defense: 25, actionCost: 1, movementPoints: 2, range: 1, initiative: 6, cooldownTurns: 1 },
    SWORD_SHIELD: { id: 'SWORD_SHIELD', name: 'Kiếm Khiên', category: 'INFANTRY', hp: 130, attack: 22, defense: 40, actionCost: 1, movementPoints: 2, range: 1, initiative: 3, cooldownTurns: 0 },
    GREATSWORD: { id: 'GREATSWORD', name: 'Đại Kiếm', category: 'INFANTRY', hp: 140, attack: 45, defense: 30, actionCost: 2, movementPoints: 2, range: 1, initiative: 5, cooldownTurns: 1 },
    LIGHT_CAVALRY: { id: 'LIGHT_CAVALRY', name: 'Khinh Kỵ', category: 'CAVALRY', hp: 120, attack: 32, defense: 15, actionCost: 2, movementPoints: 4, range: 1, initiative: 8, cooldownTurns: 0 },
    HEAVY_CAVALRY: { id: 'HEAVY_CAVALRY', name: 'Trọng Kỵ', category: 'CAVALRY', hp: 160, attack: 42, defense: 35, actionCost: 3, movementPoints: 3, range: 1, initiative: 7, cooldownTurns: 2 },
    HORSE_ARCHER: { id: 'HORSE_ARCHER', name: 'Kỵ Cung', category: 'CAVALRY', hp: 90, attack: 26, defense: 10, actionCost: 2, movementPoints: 4, range: 3, initiative: 9, cooldownTurns: 1 },
    SHORT_BOW: { id: 'SHORT_BOW', name: 'Cung Ngắn', category: 'ARCHER', hp: 70, attack: 20, defense: 5, actionCost: 1, movementPoints: 3, range: 3, initiative: 7, cooldownTurns: 0 },
    LONGBOW: { id: 'LONGBOW', name: 'Cung Dài', category: 'ARCHER', hp: 80, attack: 30, defense: 10, actionCost: 2, movementPoints: 2, range: 4, initiative: 5, cooldownTurns: 1 },
    CROSSBOW: { id: 'CROSSBOW', name: 'Nỏ Thủ', category: 'ARCHER', hp: 85, attack: 35, defense: 15, actionCost: 1, movementPoints: 2, range: 3, initiative: 4, cooldownTurns: 1 },
    HEAVY_CROSSBOW: { id: 'HEAVY_CROSSBOW', name: 'Nỏ Nặng', category: 'ARCHER', hp: 95, attack: 48, defense: 20, actionCost: 2, movementPoints: 2, range: 3, initiative: 2, cooldownTurns: 2 },
    CATAPULT: { id: 'CATAPULT', name: 'Mãng Pháo', category: 'ARCHER', hp: 150, attack: 60, defense: 25, actionCost: 3, movementPoints: 1, range: 5, initiative: 1, cooldownTurns: 3 }
  };

  public static getStats(id: ArmyClassId): ArmyStats {
    const stats = this.STATS[id];
    if (!stats) throw new Error(`Unknown ArmyClassId: ${id}`);
    return { ...stats };
  }

  /**
   * Returns counter damage multiplier based on unit category and class matchups.
   */
  public static getCounterMultiplier(attacker: ArmyClassId, defender: ArmyClassId): number {
    const attackerCategory = this.STATS[attacker].category;
    const defenderCategory = this.STATS[defender].category;

    // Spear vs Cavalry
    if ((attacker === 'SHORT_SPEAR' || attacker === 'LONG_SPEAR') && defenderCategory === 'CAVALRY') {
      return 1.5;
    }
    // Cavalry vs Archer
    if (attackerCategory === 'CAVALRY' && defenderCategory === 'ARCHER') {
      return 1.4;
    }
    // Archer vs Slow Infantry
    if (attackerCategory === 'ARCHER' && (defender === 'LONG_SPEAR' || defender === 'SWORD_SHIELD')) {
      return 1.3;
    }
    // Heavy Infantry vs Light Infantry
    if (attacker === 'GREATSWORD' && (defender === 'SHORT_SPEAR' || defender === 'SHORT_BOW')) {
      return 1.3;
    }

    return 1.0;
  }
}
