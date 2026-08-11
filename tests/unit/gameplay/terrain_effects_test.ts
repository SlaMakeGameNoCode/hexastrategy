import { describe, it, expect } from 'vitest';
import { TerrainMatrix } from '../../../src/core/terrain-matrix.js';
import { CombatResolver } from '../../../src/gameplay/combat-resolver.js';
import { FogOfWar, VisionUnit } from '../../../src/core/fog-of-war.js';

describe('Full 7 Terrain Effects & Environment Synergies Unit Tests', () => {
  it('test_archer_in_forest_range_penalty', () => {
    // Longbow base range is 4. In Forest, effective range should be reduced to 3.
    const baseRange = 4;
    const forestRange = TerrainMatrix.getEffectiveRange(baseRange, 'ARCHER', 'FOREST');
    const groundRange = TerrainMatrix.getEffectiveRange(baseRange, 'ARCHER', 'GROUND');

    expect(forestRange).toBe(3);
    expect(groundRange).toBe(4);
  });

  it('test_high_ground_downhill_bonus_and_uphill_penalty', () => {
    // Archer attacking downhill (High Ground to Ground)
    const downhillMod = TerrainMatrix.getTerrainCombatModifier('HIGH_GROUND', 'GROUND', 'ARCHER', 'INFANTRY');
    // Archer attacking uphill (Ground to High Ground)
    const uphillMod = TerrainMatrix.getTerrainCombatModifier('GROUND', 'HIGH_GROUND', 'ARCHER', 'INFANTRY');

    expect(downhillMod).toBe(1.30); // +30% Downhill Bonus
    expect(uphillMod).toBe(0.70);   // -30% Uphill Penalty
  });

  it('test_fire_arrow_wildfire_forest_synergy', () => {
    // Fire Arrow on Forest triggers Wildfire (+50% DMG)
    const wildfireMod = TerrainMatrix.getTerrainCombatModifier('GROUND', 'FOREST', 'ARCHER', 'INFANTRY', 'FIRE_ARROW');

    expect(wildfireMod).toBe(1.50);
  });

  it('test_ambush_strike_bonus_damage', () => {
    // Ambush attack from Stealth deals 1.5x damage
    const resNormal = CombatResolver.calculateDamage('SHORT_SPEAR', 'SWORD_SHIELD', false, false, 'GROUND', 'GROUND', undefined, false);
    const resAmbush = CombatResolver.calculateDamage('SHORT_SPEAR', 'SWORD_SHIELD', false, false, 'GROUND', 'GROUND', undefined, true);

    expect(resAmbush.isAmbush).toBe(true);
    expect(resAmbush.finalDamage).toBeGreaterThan(resNormal.finalDamage);
  });

  it('test_fog_of_war_line_of_sight_and_stealth', () => {
    const playerUnits: VisionUnit[] = [
      { id: 'p1', category: 'CAVALRY', armyClass: 'LIGHT_CAVALRY', position: { q: 0, r: 0 }, ownerColor: '#3B82F6' }
    ];

    const visibleHexes = FogOfWar.calculateVisibleHexes(playerUnits);

    // Light Cavalry has sight radius = 5 hexes
    expect(visibleHexes.has('0,0')).toBe(true);
    expect(visibleHexes.has('2,2')).toBe(true);
    expect(visibleHexes.has('6,-6')).toBe(false); // Outside sight radius (6 > 5)

    const enemyInSight: VisionUnit = { id: 'e1', category: 'INFANTRY', position: { q: 2, r: 2 }, ownerColor: '#EF4444' };
    const enemyOutsideSight: VisionUnit = { id: 'e2', category: 'INFANTRY', position: { q: 6, r: -6 }, ownerColor: '#EF4444' };
    const enemyStealthed: VisionUnit = { id: 'e3', category: 'INFANTRY', position: { q: 2, r: 2 }, ownerColor: '#EF4444', isStealthed: true };

    expect(FogOfWar.isEnemyUnitVisible(enemyInSight, visibleHexes)).toBe(true);
    expect(FogOfWar.isEnemyUnitVisible(enemyOutsideSight, visibleHexes)).toBe(false);
    expect(FogOfWar.isEnemyUnitVisible(enemyStealthed, visibleHexes)).toBe(false); // Stealthed enemy is hidden!
  });
});
