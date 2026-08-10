import { describe, it, expect } from 'vitest';
import { CombatResolver, CombatAction } from '../../../src/gameplay/combat-resolver.js';

describe('CombatResolver Unit Tests', () => {
  it('test_calculate_damage_with_counter_matrix', () => {
    const result = CombatResolver.calculateDamage('LONG_SPEAR', 'HEAVY_CAVALRY');
    expect(result.isCounter).toBe(true);
    expect(result.finalDamage).toBeGreaterThan(0);
  });

  it('test_sort_actions_by_initiative_priority', () => {
    const actions: CombatAction[] = [
      { unitId: 'u1', attackerClass: 'SHORT_SPEAR', type: 'ATTACK' }, // Initiative 5
      { unitId: 'u2', attackerClass: 'LIGHT_CAVALRY', type: 'ATTACK' }, // Initiative 9
      { unitId: 'u3', attackerClass: 'LONG_SPEAR', type: 'BRACE' } // Initiative 4 + 10 = 14
    ];

    const sorted = CombatResolver.sortActionsByInitiative(actions);

    expect(sorted[0].unitId).toBe('u3'); // Brace first
    expect(sorted[1].unitId).toBe('u2'); // Light Cav second
    expect(sorted[2].unitId).toBe('u1'); // Short Spear third
  });
});
