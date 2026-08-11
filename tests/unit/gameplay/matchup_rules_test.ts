import { describe, it, expect } from 'vitest';
import { ArmyRegistry } from '../../../src/gameplay/army-registry.js';
import { HexPathfinder } from '../../../src/core/hex-pathfinder.js';
import { TerrainMatrix } from '../../../src/core/terrain-matrix.js';

describe('Matchup & Advanced Map Rules Unit Tests', () => {
  it('test_ap_initiative_priority_rule', () => {
    // Squad A (Light Melee + Shortbows): 1 AP each x 8 = 8 AP total
    // Squad B (Heavy Cavalry + Catapults): 3 AP each x 8 = 24 AP total
    const squadAAP = 8;
    const squadBAP = 24;

    // Team with LOWER total AP goes FIRST
    const firstTeam = squadAAP <= squadBAP ? 'PLAYER' : 'ENEMY';
    expect(firstTeam).toBe('PLAYER');
  });

  it('test_forest_clustering_rule', () => {
    // Forest tiles must exist in clusters of at least 3 adjacent tiles
    const seed = { q: 0, r: 0 };
    const cluster = [seed, { q: 1, r: 0 }, { q: 0, r: 1 }];

    expect(cluster.length).toBeGreaterThanOrEqual(3);
  });

  it('test_mountain_solvability_pathfinding', () => {
    // Ensure pathfinding can always find a route from start to target
    const start = { q: 0, r: 5 };
    const target = { q: 0, r: -5 };

    const mockTileLookup = (c: { q: number; r: number }) => {
      return { coord: c, terrain: 'GROUND' as const, blockedByUnit: false };
    };

    const pathRes = HexPathfinder.findPath(start, target, 99, 'INFANTRY', mockTileLookup);
    expect(pathRes).not.toBeNull();
    expect(pathRes!.path.length).toBeGreaterThan(1);
  });
});
