import { ArmyRegistry, ArmyClassId } from './army-registry.js';
import { UnitState } from '../server/state-serializer.js';

export interface CombatAction {
  unitId: string;
  attackerClass: ArmyClassId;
  type: 'MOVE' | 'ATTACK' | 'CHARGE' | 'BRACE' | 'DEFEND' | 'WAIT';
  targetUnitId?: string;
  targetHex?: { q: number; r: number };
}

export interface DamageResult {
  rawDamage: number;
  finalDamage: number;
  isCounter: boolean;
  isBraceCounterTriggered: boolean;
  isChargeCanceled: boolean;
}

export class CombatResolver {
  /**
   * Computes combat damage dealt by attacker to defender.
   */
  public static calculateDamage(
    attackerClass: ArmyClassId,
    defenderClass: ArmyClassId,
    isAttackerCharging: boolean = false,
    isDefenderBracing: boolean = false,
    terrainModifier: number = 1.0
  ): DamageResult {
    const attackerStats = ArmyRegistry.getStats(attackerClass);
    const defenderStats = ArmyRegistry.getStats(defenderClass);

    // Spear Phalanx / Brace Counter Check against Cavalry
    const isDefenderSpear = defenderClass === 'LONG_SPEAR' || defenderClass === 'SHORT_SPEAR';
    const isAttackerCavalry = attackerStats.category === 'CAVALRY';

    if (isDefenderSpear && isDefenderBracing) {
      if (isAttackerCavalry) {
        // Spear Wall / Brace triggers 2.0x counter damage against Cavalry!
        const counterMult = 2.0;
        const rawDamage = Math.max(1, defenderStats.attack - attackerStats.defense);
        const finalDamage = Math.round(rawDamage * counterMult * terrainModifier);

        return {
          rawDamage,
          finalDamage,
          isCounter: true,
          isBraceCounterTriggered: true,
          isChargeCanceled: true
        };
      } else {
        // Spear Wall reduces incoming DMG from non-cavalry by 50%
        let counterMult = ArmyRegistry.getCounterMultiplier(attackerClass, defenderClass);
        const armorFactor = 100 / (100 + defenderStats.defense);
        const rawDamage = Math.max(1, attackerStats.attack * armorFactor * 0.5);
        const finalDamage = Math.max(1, Math.round(rawDamage * counterMult * terrainModifier));

        return {
          rawDamage,
          finalDamage,
          isCounter: false,
          isBraceCounterTriggered: false,
          isChargeCanceled: false
        };
      }
    }

    // Standard Combat Damage calculation
    let counterMult = ArmyRegistry.getCounterMultiplier(attackerClass, defenderClass);
    if (isAttackerCharging) {
      counterMult *= 1.5; // Charge damage multiplier
    }

    const armorFactor = 100 / (100 + defenderStats.defense);
    const rawDamage = Math.max(1, attackerStats.attack * armorFactor);
    const finalDamage = Math.max(1, Math.round(rawDamage * counterMult * terrainModifier));

    return {
      rawDamage,
      finalDamage,
      isCounter: counterMult > 1.0,
      isBraceCounterTriggered: false,
      isChargeCanceled: false
    };
  }

  /**
   * Sorts combat actions deterministically by Initiative priority score.
   */
  public static sortActionsByInitiative(actions: CombatAction[]): CombatAction[] {
    return [...actions].sort((a, b) => {
      const statsA = ArmyRegistry.getStats(a.attackerClass);
      const statsB = ArmyRegistry.getStats(b.attackerClass);

      let priorityA = statsA.initiative;
      let priorityB = statsB.initiative;

      if (a.type === 'BRACE') priorityA += 10;
      if (b.type === 'BRACE') priorityB += 10;

      if (a.type === 'CHARGE') priorityA += 5;
      if (b.type === 'CHARGE') priorityB += 5;

      return priorityB - priorityA;
    });
  }
}
