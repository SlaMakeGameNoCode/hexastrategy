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
   * Finds the optimal path from start to target using A* algorithm considering terrain MP costs and unit blocks.
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

        // Block if terrain is impassable OR blocked by another unit (unless neighbor is the target itself)
        const isTarget = neighbor.q === target.q && neighbor.r === target.r;
        if (cost === Infinity || (tile.blockedByUnit && !isTarget)) continue;

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
   * Returns list of all reachable hex coordinates within available MP budget (excluding hexes blocked by units).
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
        const isStart = neighbor.q === start.q && neighbor.r === start.r;
        if (cost === Infinity || (tile.blockedByUnit && !isStart)) continue;

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

  /**
   * Finds the optimal unoccupied hex cell to move to in order to attack targetEnemyCoord within attackRange.
   * Stops at the nearest valid hex tile within Range.
   */
  public static findAttackPosition(
    start: HexCoord,
    targetEnemyCoord: HexCoord,
    attackRange: number,
    maxMP: number,
    unitCategory: UnitCategory,
    tileLookup: (coord: HexCoord) => MapHexTile | undefined
  ): PathResult | null {
    // 1. If start is ALREADY within attackRange, no movement required!
    const currentDist = HexMath.getDistance(start, targetEnemyCoord);
    if (currentDist <= attackRange) {
      return { path: [start], totalCost: 0 };
    }

    // 2. Find all candidate unoccupied tiles reachable within MP that are within attackRange of targetEnemyCoord
    const reachableHexes = HexPathfinder.getReachableHexes(start, maxMP, unitCategory, tileLookup);
    let bestPath: PathResult | null = null;
    let minCost = Infinity;

    for (const [key] of reachableHexes.entries()) {
      const [q, r] = key.split(',').map(Number);
      const candHex: HexCoord = { q, r };
      const distToEnemy = HexMath.getDistance(candHex, targetEnemyCoord);

      if (distToEnemy <= attackRange) {
        const pathRes = HexPathfinder.findPath(start, candHex, maxMP, unitCategory, tileLookup);
        if (pathRes && pathRes.totalCost < minCost) {
          minCost = pathRes.totalCost;
          bestPath = pathRes;
        }
      }
    }

    return bestPath;
  }
}
