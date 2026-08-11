/**
 * Full Terrain Matrix & Environmental Interactions Engine.
 */

export type TerrainType = 'GROUND' | 'ROAD' | 'FOREST' | 'HIGH_GROUND' | 'RUINS' | 'MOUNTAIN' | 'WATER';

export type UnitCategory = 'INFANTRY' | 'CAVALRY' | 'ARCHER';

export class TerrainMatrix {
  /**
   * Returns MP cost for entering a terrain hex for a specific unit category.
   */
  public static getMovementCost(terrain: TerrainType, unitCategory: UnitCategory): number {
    switch (terrain) {
      case 'ROAD':
        return 1;
      case 'GROUND':
        return 1;
      case 'HIGH_GROUND':
        return 2; // Uphill climbing penalty
      case 'FOREST':
        return unitCategory === 'CAVALRY' ? 3 : 2;
      case 'RUINS':
        return unitCategory === 'CAVALRY' ? 3 : 2;
      case 'WATER':
        return unitCategory === 'CAVALRY' ? 3 : 2;
      case 'MOUNTAIN':
        return Infinity; // Impassable
      default:
        return 1;
    }
  }

  /**
   * Calculates effective attack range for a unit given its class and current terrain.
   * Archers in FOREST suffer a -1 Range penalty (Min = 1).
   */
  public static getEffectiveRange(baseRange: number, category: UnitCategory, terrain: TerrainType): number {
    if (category === 'ARCHER' && terrain === 'FOREST') {
      return Math.max(1, baseRange - 1);
    }
    return baseRange;
  }

  /**
   * Returns DEF multiplier bonus for units holding a defensive terrain.
   */
  public static getTerrainDefensiveMultiplier(terrain: TerrainType): number {
    if (terrain === 'HIGH_GROUND') return 1.20; // +20% DEF
    if (terrain === 'RUINS') return 1.30;       // +30% DEF
    return 1.0;
  }

  /**
   * Computes environmental combat multiplier based on elevation, foliage cover, water marshland, and skill synergies.
   */
  public static getTerrainCombatModifier(
    attackerTerrain: TerrainType,
    defenderTerrain: TerrainType,
    attackerCategory: UnitCategory,
    defenderCategory: UnitCategory,
    skillType?: string
  ): number {
    let modifier = 1.0;

    // 1. High Ground Advantage / Uphill Penalty
    if (attackerTerrain === 'HIGH_GROUND' && defenderTerrain !== 'HIGH_GROUND') {
      if (attackerCategory === 'ARCHER' || attackerCategory === 'CAVALRY') {
        modifier *= 1.30; // +30% Downhill Attack Damage Bonus
      }
    } else if (attackerTerrain !== 'HIGH_GROUND' && defenderTerrain === 'HIGH_GROUND') {
      if (attackerCategory === 'ARCHER') {
        modifier *= 0.70; // -30% Uphill Ranged Attack Penalty
      }
    }

    // 2. Skill & Environment Synergies
    // Fire Arrow on Forest -> Wildfire Synergy (+50% DMG)
    if (skillType === 'FIRE_ARROW' && defenderTerrain === 'FOREST') {
      modifier *= 1.50;
    }

    // Boulder Barrage on Ruins -> Shatter Ruins Bonus
    if (skillType === 'BOULDER_BARRAGE' && defenderTerrain === 'RUINS') {
      modifier *= 1.40;
    }

    // 3. Infantry Forest Cover against Ranged
    if (defenderTerrain === 'FOREST' && attackerCategory === 'ARCHER' && skillType !== 'FIRE_ARROW') {
      modifier *= 0.75; // -25% Ranged Damage taken in Forest cover
    }

    // 4. Water Marshland Penalty (Units in water take +20% damage)
    if (defenderTerrain === 'WATER') {
      modifier *= 1.20;
    }

    return modifier;
  }

  /**
   * Returns sight radius (Line of Sight vision range) for each unit category.
   */
  public static getSightRadius(category: UnitCategory, armyClass?: string): number {
    if (armyClass === 'LIGHT_CAVALRY' || armyClass === 'HORSE_ARCHER') return 5;
    if (category === 'CAVALRY') return 4;
    if (category === 'ARCHER') return 4;
    if (armyClass === 'CATAPULT') return 2;
    return 3; // Infantry standard sight
  }

  public static isImpassable(terrain: TerrainType, unitCategory: UnitCategory): boolean {
    return this.getMovementCost(terrain, unitCategory) === Infinity;
  }
}
