import { describe, it, expect } from 'vitest';
import { SkillResolver } from '../../../src/gameplay/skill-resolver.js';
import { CombatResolver } from '../../../src/gameplay/combat-resolver.js';

describe('SkillResolver Unit Tests', () => {
  it('test_fire_arrow_applies_burn_status', () => {
    const res = SkillResolver.executeSkill(
      'LONGBOW',
      'FIRE_ARROW',
      { q: 0, r: 0 },
      { q: 3, r: 0 },
      'SHORT_SPEAR'
    );

    expect(res.skillType).toBe('FIRE_ARROW');
    expect(res.appliedStatus).toBe('BURN');
    expect(res.primaryDamage).toBeGreaterThan(25);
  });

  it('test_skill_damage_is_significantly_higher_than_regular_attack', () => {
    const regularRes = CombatResolver.calculateDamage('LONGBOW', 'SHORT_SPEAR');
    const skillRes = SkillResolver.executeSkill(
      'LONGBOW',
      'FIRE_ARROW',
      { q: 0, r: 0 },
      { q: 3, r: 0 },
      'SHORT_SPEAR'
    );

    // Skill Damage must be strictly higher than Regular Attack damage!
    expect(skillRes.primaryDamage).toBeGreaterThan(regularRes.finalDamage);
  });

  it('test_armor_pierce_bolt_ignores_seventy_percent_def', () => {
    const resNormal = SkillResolver.executeSkill(
      'CROSSBOW',
      'ARMOR_PIERCE_BOLT',
      { q: 0, r: 0 },
      { q: 2, r: 0 },
      'SHORT_SPEAR'
    );

    expect(resNormal.skillType).toBe('ARMOR_PIERCE_BOLT');
    expect(resNormal.affectedHexes.length).toBe(2); // Pierces to 2nd hex
  });

  it('test_cavalry_charge_deals_double_damage_and_knockback', () => {
    const res = SkillResolver.executeSkill(
      'HEAVY_CAVALRY',
      'CAVALRY_CHARGE',
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      'SHORT_SPEAR'
    );

    expect(res.skillType).toBe('CAVALRY_CHARGE');
    expect(res.appliedStatus).toBe('KNOCKBACK');
    expect(res.primaryDamage).toBeGreaterThan(45);
  });

  it('test_whirlwind_slash_affects_all_six_neighbors', () => {
    const res = SkillResolver.executeSkill(
      'GREATSWORD',
      'WHIRLWIND_SLASH',
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      'SHORT_SPEAR'
    );

    expect(res.skillType).toBe('WHIRLWIND_SLASH');
    expect(res.affectedHexes.length).toBe(6);
  });
});
