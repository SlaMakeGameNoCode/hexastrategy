/**
 * Terrain Types and Unit Movement Point (MP) Cost Matrix.
 */

export type TerrainType = 'GROUND' | 'ROAD' | 'FOREST' | 'HIGH_GROUND' | 'RUINS' | 'MOUNTAIN' | 'WATER';

export type UnitCategory = 'INFANTRY' | 'CAVALRY' | 'ARCHER';

export class TerrainMatrix {
  /**
   * Returns MP cost for entering a terrain hex for a specific unit category.
   * Returns Infinity if terrain is impassable for that category.
   */
  public static getMovementCost(terrain: TerrainType, unitCategory: UnitCategory): number {
    switch (terrain) {
      case 'ROAD':
        return 1;
      case 'GROUND':
        return 1;
      case 'HIGH_GROUND':
        return 2;
      case 'FOREST':
        return unitCategory === 'CAVALRY' ? 3 : 2;
      case 'RUINS':
        return unitCategory === 'CAVALRY' ? 3 : 2;
      case 'MOUNTAIN':
      case 'WATER':
        return Infinity; // Impassable
      default:
        return 1;
    }
  }

  /**
   * Checks if terrain type is impassable.
   */
  public static isImpassable(terrain: TerrainType, unitCategory: UnitCategory): boolean {
    return this.getMovementCost(terrain, unitCategory) === Infinity;
  }
}
