import { describe, it, expect } from 'vitest';
import { HexPathfinder, MapHexTile } from '../../../src/core/hex-pathfinder.js';
import { HexCoord } from '../../../src/core/hex-math.js';

describe('HexPathfinder Unit Tests', () => {
  const createMockGrid = (): Map<string, MapHexTile> => {
    const grid = new Map<string, MapHexTile>();
    for (let q = -5; q <= 5; q++) {
      for (let r = -5; r <= 5; r++) {
        const coord: HexCoord = { q, r };
        grid.set(HexPathfinder.hexKey(coord), {
          coord,
          terrain: 'GROUND'
        });
      }
    }
    return grid;
  };

  it('test_a_star_finds_straight_path_on_ground', () => {
    const grid = createMockGrid();
    const start: HexCoord = { q: 0, r: 0 };
    const target: HexCoord = { q: 3, r: 0 };

    const result = HexPathfinder.findPath(
      start,
      target,
      5,
      'INFANTRY',
      (coord) => grid.get(HexPathfinder.hexKey(coord))
    );

    expect(result).not.toBeNull();
    expect(result!.totalCost).toBe(3);
    expect(result!.path.length).toBe(4);
    expect(result!.path[result!.path.length - 1]).toEqual(target);
  });

  it('test_find_attack_position_stops_at_nearest_hex_within_range', () => {
    const grid = createMockGrid();
    const start: HexCoord = { q: 0, r: 0 };
    const enemy: HexCoord = { q: 3, r: 0 };

    // Melee attack range = 1
    const meleeResult = HexPathfinder.findAttackPosition(
      start,
      enemy,
      1, // Attack Range = 1
      5, // Max MP
      'INFANTRY',
      (coord) => grid.get(HexPathfinder.hexKey(coord))
    );

    expect(meleeResult).not.toBeNull();
    // Should stop at (2, 0) which is 1 hex away from enemy (3, 0)
    expect(meleeResult!.path[meleeResult!.path.length - 1]).toEqual({ q: 2, r: 0 });

    // Archer attack range = 3 (already in range from start (0,0)!)
    const archerResult = HexPathfinder.findAttackPosition(
      start,
      enemy,
      3, // Attack Range = 3
      5,
      'ARCHER',
      (coord) => grid.get(HexPathfinder.hexKey(coord))
    );

    expect(archerResult).not.toBeNull();
    expect(archerResult!.path[0]).toEqual(start); // No movement needed!
  });

  it('test_units_cannot_occupy_same_hex', () => {
    const grid = createMockGrid();
    const start: HexCoord = { q: 0, r: 0 };
    const target: HexCoord = { q: 1, r: 0 };

    // Block target hex with another unit
    grid.set('1,0', { coord: { q: 1, r: 0 }, terrain: 'GROUND', blockedByUnit: true });

    const reachable = HexPathfinder.getReachableHexes(
      start,
      2,
      'INFANTRY',
      (coord) => grid.get(HexPathfinder.hexKey(coord))
    );

    expect(reachable.has('1,0')).toBe(false); // Cannot step on occupied hex!
  });
});
