import { describe, it, expect } from 'vitest';
import { HexPathfinder } from '../../../src/core/hex-pathfinder.js';
describe('HexPathfinder Unit Tests', () => {
    const createMockGrid = () => {
        const grid = new Map();
        for (let q = -5; q <= 5; q++) {
            for (let r = -5; r <= 5; r++) {
                const coord = { q, r };
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
        const start = { q: 0, r: 0 };
        const target = { q: 3, r: 0 };
        const result = HexPathfinder.findPath(start, target, 5, 'INFANTRY', (coord) => grid.get(HexPathfinder.hexKey(coord)));
        expect(result).not.toBeNull();
        expect(result.totalCost).toBe(3);
        expect(result.path.length).toBe(4); // Start + 3 steps
        expect(result.path[result.path.length - 1]).toEqual(target);
    });
    it('test_a_star_detours_around_impassable_mountains', () => {
        const grid = createMockGrid();
        const start = { q: 0, r: 0 };
        const target = { q: 2, r: 0 };
        // Place impassable mountain on direct path at (1, 0)
        grid.set(HexPathfinder.hexKey({ q: 1, r: 0 }), {
            coord: { q: 1, r: 0 },
            terrain: 'MOUNTAIN'
        });
        const result = HexPathfinder.findPath(start, target, 5, 'INFANTRY', (coord) => grid.get(HexPathfinder.hexKey(coord)));
        expect(result).not.toBeNull();
        expect(result.path).not.toContainEqual({ q: 1, r: 0 });
        expect(result.path[result.path.length - 1]).toEqual(target);
    });
    it('test_get_reachable_hexes_within_mp', () => {
        const grid = createMockGrid();
        const start = { q: 0, r: 0 };
        const reachable = HexPathfinder.getReachableHexes(start, 2, 'INFANTRY', (coord) => grid.get(HexPathfinder.hexKey(coord)));
        // Range 2 reachable count on empty hex grid = 1 + 6 + 12 = 19 hexes
        expect(reachable.size).toBe(19);
        expect(reachable.get('0,0')).toBe(0);
        expect(reachable.get('1,0')).toBe(1);
        expect(reachable.get('2,0')).toBe(2);
    });
});
