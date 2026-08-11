import { describe, it, expect } from 'vitest';
import { TerrainMatrix } from '../../../src/core/terrain-matrix.js';

describe('TerrainMatrix Unit Tests', () => {
  it('test_cavalry_forest_and_ruins_movement_penalty', () => {
    expect(TerrainMatrix.getMovementCost('FOREST', 'CAVALRY')).toBe(3);
    expect(TerrainMatrix.getMovementCost('FOREST', 'INFANTRY')).toBe(2);

    expect(TerrainMatrix.getMovementCost('RUINS', 'CAVALRY')).toBe(3);
    expect(TerrainMatrix.getMovementCost('RUINS', 'INFANTRY')).toBe(2);
  });

  it('test_road_and_ground_costs', () => {
    expect(TerrainMatrix.getMovementCost('ROAD', 'CAVALRY')).toBe(1);
    expect(TerrainMatrix.getMovementCost('GROUND', 'INFANTRY')).toBe(1);
  });

  it('test_mountain_and_water_costs', () => {
    expect(TerrainMatrix.isImpassable('MOUNTAIN', 'INFANTRY')).toBe(true);
    expect(TerrainMatrix.getMovementCost('WATER', 'CAVALRY')).toBe(3);
    expect(TerrainMatrix.getMovementCost('MOUNTAIN', 'ARCHER')).toBe(Infinity);
  });

});
