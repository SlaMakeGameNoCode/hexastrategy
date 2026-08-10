import { HexMath, HexCoord } from './hex-math.js';
import { TerrainMatrix, TerrainType, UnitCategory } from './terrain-matrix.js';

export interface MapHexTile {
  coord: HexCoord;
  terrain: TerrainType;
  blockedByUnit?: boolean;
}

export interface PathResult {
  path: HexCoord[];
  totalCost: number;
}

export class HexPathfinder {
  public static hexKey(hex: HexCoord): string {
    return `${hex.q},${hex.r}`;
  }

  /**
   * Finds the optimal path from start to target using A* algorithm considering terrain MP costs.
   */
  public static findPath(
    start: HexCoord,
    target: HexCoord,
    maxMP: number,
    unitCategory: UnitCategory,
    tileLookup: (coord: HexCoord) => MapHexTile | undefined
  ): PathResult | null {
    const openSet: HexCoord[] = [start];
    const cameFrom: Map<string, HexCoord> = new Map();

    const gScore: Map<string, number> = new Map();
    gScore.set(HexPathfinder.hexKey(start), 0);

    const fScore: Map<string, number> = new Map();
    fScore.set(HexPathfinder.hexKey(start), HexMath.getDistance(start, target));

    while (openSet.length > 0) {
      openSet.sort((a, b) => {
        const fA = fScore.get(HexPathfinder.hexKey(a)) ?? Infinity;
        const fB = fScore.get(HexPathfinder.hexKey(b)) ?? Infinity;
        return fA - fB;
      });

      const current = openSet.shift()!;
      const currentKey = HexPathfinder.hexKey(current);

      if (current.q === target.q && current.r === target.r) {
        const path: HexCoord[] = [current];
        let curr = current;
        while (cameFrom.has(HexPathfinder.hexKey(curr))) {
          curr = cameFrom.get(HexPathfinder.hexKey(curr))!;
          path.unshift(curr);
        }
        return { path, totalCost: gScore.get(currentKey) || 0 };
      }

      const neighbors = HexMath.getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = HexPathfinder.hexKey(neighbor);
        const tile = tileLookup(neighbor);

        if (!tile) continue;

        const cost = TerrainMatrix.getMovementCost(tile.terrain, unitCategory);
        if (cost === Infinity || tile.blockedByUnit) continue;

        const tentativeGScore = (gScore.get(currentKey) ?? Infinity) + cost;

        if (tentativeGScore > maxMP) continue;

        if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + HexMath.getDistance(neighbor, target));

          if (!openSet.some((h) => h.q === neighbor.q && h.r === neighbor.r)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return null;
  }

  /**
   * Returns list of all reachable hex coordinates within available MP budget.
   */
  public static getReachableHexes(
    start: HexCoord,
    maxMP: number,
    unitCategory: UnitCategory,
    tileLookup: (coord: HexCoord) => MapHexTile | undefined
  ): Map<string, number> {
    const reachable: Map<string, number> = new Map();
    reachable.set(HexPathfinder.hexKey(start), 0);

    const queue: HexCoord[] = [start];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentCost = reachable.get(HexPathfinder.hexKey(current))!;

      const neighbors = HexMath.getNeighbors(current);
      for (const neighbor of neighbors) {
        const tile = tileLookup(neighbor);
        if (!tile) continue;

        const cost = TerrainMatrix.getMovementCost(tile.terrain, unitCategory);
        if (cost === Infinity || tile.blockedByUnit) continue;

        const totalCost = currentCost + cost;
        if (totalCost <= maxMP) {
          const neighborKey = HexPathfinder.hexKey(neighbor);
          if (!reachable.has(neighborKey) || totalCost < reachable.get(neighborKey)!) {
            reachable.set(neighborKey, totalCost);
            queue.push(neighbor);
          }
        }
      }
    }

    return reachable;
  }
}
