import { describe, it, expect } from 'vitest';
import { ArmyRegistry } from '../../../src/gameplay/army-registry.js';
describe('ArmyRegistry Unit Tests', () => {
    it('test_retrieves_stats_for_all_12_armies', () => {
        const spear = ArmyRegistry.getStats('SHORT_SPEAR');
        expect(spear.actionCost).toBe(1);
        expect(spear.movementPoints).toBe(5);
        const heavyCav = ArmyRegistry.getStats('HEAVY_CAVALRY');
        expect(heavyCav.actionCost).toBe(3);
        expect(heavyCav.hp).toBe(150);
        const longbow = ArmyRegistry.getStats('LONGBOW');
        expect(longbow.range).toBe(5);
    });
    it('test_counter_matrix_multipliers', () => {
        expect(ArmyRegistry.getCounterMultiplier('LONG_SPEAR', 'HEAVY_CAVALRY')).toBe(1.5);
        expect(ArmyRegistry.getCounterMultiplier('HEAVY_CAVALRY', 'LONGBOW')).toBe(1.4);
        expect(ArmyRegistry.getCounterMultiplier('LONGBOW', 'LONG_SPEAR')).toBe(1.3);
        expect(ArmyRegistry.getCounterMultiplier('SHORT_SPEAR', 'SWORD_SHIELD')).toBe(1.0);
    });
});
