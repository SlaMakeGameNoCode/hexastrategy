import { describe, it, expect } from 'vitest';
import { CombatResolver } from '../../../src/gameplay/combat-resolver.js';

describe('Charge vs Brace Counter Unit Tests', () => {
  it('test_brace_triggers_counter_damage_and_cancels_charge', () => {
    // Heavy Cavalry charges into Long Spear bracing
    const result = CombatResolver.calculateDamage(
      'HEAVY_CAVALRY',
      'LONG_SPEAR',
      true, // isAttackerCharging
      true  // isDefenderBracing
    );

    expect(result.isBraceCounterTriggered).toBe(true);
    expect(result.isChargeCanceled).toBe(true);
    expect(result.finalDamage).toBeGreaterThan(0);
  });

  it('test_charge_without_brace_deals_bonus_damage', () => {
    // Heavy Cavalry charges into non-bracing Sword & Shield
    const normalCharge = CombatResolver.calculateDamage(
      'HEAVY_CAVALRY',
      'SWORD_SHIELD',
      true,  // isAttackerCharging
      false  // isDefenderBracing
    );

    const normalAttack = CombatResolver.calculateDamage(
      'HEAVY_CAVALRY',
      'SWORD_SHIELD',
      false, // isAttackerCharging
      false  // isDefenderBracing
    );

    expect(normalCharge.isChargeCanceled).toBe(false);
    expect(normalCharge.finalDamage).toBeGreaterThan(normalAttack.finalDamage);
  });
});
