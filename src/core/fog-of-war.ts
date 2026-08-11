import { HexCoord, HexMath } from './hex-math.js';
import { TerrainMatrix, UnitCategory } from './terrain-matrix.js';

export interface VisionUnit {
  id: string;
  category: UnitCategory;
  armyClass?: string;
  position: HexCoord;
  ownerColor: string;
  isStealthed?: boolean;
}

export class FogOfWar {
  /**
   * Computes all visible hex keys for the player team.
   */
  public static calculateVisibleHexes(units: VisionUnit[], playerColor: string = '#3B82F6'): Set<string> {
    const visibleHexes = new Set<string>();

    for (const unit of units) {
      if (unit.ownerColor === playerColor) {
        const sightRadius = TerrainMatrix.getSightRadius(unit.category, unit.armyClass);

        for (let q = -6; q <= 6; q++) {
          for (let r = -6; r <= 6; r++) {
            if (Math.abs(q + r) <= 6) {
              const hex: HexCoord = { q, r };
              const dist = HexMath.getDistance(unit.position, hex);
              if (dist <= sightRadius) {
                visibleHexes.add(`${q},${r}`);
              }
            }
          }
        }
      }
    }

    return visibleHexes;
  }

  /**
   * Checks if an enemy unit is visible to the player.
   * Enemy units in Fog of War OR Stealthed in Forest are hidden unless revealed!
   */
  public static isEnemyUnitVisible(
    enemyUnit: VisionUnit,
    visibleHexes: Set<string>,
    playerColor: string = '#3B82F6'
  ): boolean {
    if (enemyUnit.ownerColor === playerColor) return true; // Friendly units are always visible

    const hexKey = `${enemyUnit.position.q},${enemyUnit.position.r}`;

    // Must be in player Line of Sight
    if (!visibleHexes.has(hexKey)) {
      return false;
    }

    // Stealthed enemy units in Forest are hidden unless a player unit is directly adjacent (dist <= 1)
    if (enemyUnit.isStealthed) {
      return false;
    }

    return true;
  }
}
