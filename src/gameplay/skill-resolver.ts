import { ArmyClassId, ArmyRegistry } from './army-registry.js';
import { HexCoord, HexMath } from '../core/hex-math.js';
import { TerrainMatrix, TerrainType } from '../core/terrain-matrix.js';

export type SkillType =
  | 'FIRE_ARROW'
  | 'SPEAR_WALL'
  | 'CAVALRY_CHARGE'
  | 'ARMOR_PIERCE_BOLT'
  | 'SHIELD_WALL_DEFENSE'
  | 'WHIRLWIND_SLASH'
  | 'BOULDER_BARRAGE';

export interface SkillDefinition {
  type: SkillType;
  name: string;
  apCost: number;
  cooldownRounds: number;
  description: string;
}

export interface SkillResult {
  skillType: SkillType;
  primaryDamage: number;
  isCritical: boolean;
  appliedStatus?: 'BURN' | 'SHIELD_WALL' | 'BRACE' | 'KNOCKBACK';
  affectedHexes: HexCoord[];
}

export class SkillResolver {
  private static readonly SKILL_DEFS: Record<SkillType, SkillDefinition> = {
    FIRE_ARROW: {
      type: 'FIRE_ARROW',
      name: 'Bắn Tên Lửa',
      apCost: 3,
      cooldownRounds: 2,
      description: 'Bắn tên lửa gây 1.5x Sát Thương + Bão Lửa 50% DMG trong Rừng.'
    },
    SPEAR_WALL: {
      type: 'SPEAR_WALL',
      name: 'Trận Địa Phản Công',
      apCost: 2,
      cooldownRounds: 2,
      description: 'Lập hàng rào giáo: Giảm 50% DMG nhận vào và phản công 2.0x Kỵ binh.'
    },
    CAVALRY_CHARGE: {
      type: 'CAVALRY_CHARGE',
      name: 'Đột Kích Xé Gió',
      apCost: 4,
      cooldownRounds: 3,
      description: 'Lao thẳng gây 2.2x Sát thương đột kích và đẩy lùi mục tiêu.'
    },
    ARMOR_PIERCE_BOLT: {
      type: 'ARMOR_PIERCE_BOLT',
      name: 'Bắn Xuyên Giáp',
      apCost: 3,
      cooldownRounds: 2,
      description: 'Bắn tên nỏ thép gây 1.6x Sát thương, bỏ qua 70% Giáp và xuyên thấu.'
    },
    SHIELD_WALL_DEFENSE: {
      type: 'SHIELD_WALL_DEFENSE',
      name: 'Thành Trì Kiên Cố',
      apCost: 2,
      cooldownRounds: 2,
      description: 'Kết trận hình khiên sắt: Tăng +80% Giáp Phòng Thụ trong 1 lượt.'
    },
    WHIRLWIND_SLASH: {
      type: 'WHIRLWIND_SLASH',
      name: 'Trọng Kiếm Xoay Tròn',
      apCost: 4,
      cooldownRounds: 2,
      description: 'Chém xoay 360 độ gây 1.4x Sát thương lên tất cả 6 ô Hex xung quanh.'
    },
    BOULDER_BARRAGE: {
      type: 'BOULDER_BARRAGE',
      name: 'Mưa Đá Lửa Địa Chấn',
      apCost: 5,
      cooldownRounds: 3,
      description: 'Bắn chùm đá lửa nổ diện rộng gây 1.8x Sát thương lên 7 ô Hex.'
    }
  };

  public static getSkillDefinition(type: SkillType): SkillDefinition {
    return this.SKILL_DEFS[type];
  }

  public static getSkillForClass(armyClass: ArmyClassId): SkillType {
    switch (armyClass) {
      case 'SHORT_BOW':
      case 'LONGBOW':
      case 'HORSE_ARCHER':
        return 'FIRE_ARROW';
      case 'SHORT_SPEAR':
      case 'LONG_SPEAR':
        return 'SPEAR_WALL';
      case 'LIGHT_CAVALRY':
      case 'HEAVY_CAVALRY':
        return 'CAVALRY_CHARGE';
      case 'CROSSBOW':
      case 'HEAVY_CROSSBOW':
        return 'ARMOR_PIERCE_BOLT';
      case 'SWORD_SHIELD':
        return 'SHIELD_WALL_DEFENSE';
      case 'GREATSWORD':
        return 'WHIRLWIND_SLASH';
      case 'CATAPULT':
        return 'BOULDER_BARRAGE';
      default:
        return 'FIRE_ARROW';
    }
  }

  public static executeSkill(
    attackerClass: ArmyClassId,
    skillType: SkillType,
    attackerPos: HexCoord,
    targetPos: HexCoord,
    defenderClass?: ArmyClassId,
    attackerTerrain: TerrainType = 'GROUND',
    defenderTerrain: TerrainType = 'GROUND',
    isAmbush: boolean = false
  ): SkillResult {
    const stats = ArmyRegistry.getStats(attackerClass);
    const defStats = defenderClass ? ArmyRegistry.getStats(defenderClass) : { defense: 20, category: 'INFANTRY' as const };
    const affectedHexes: HexCoord[] = [targetPos];

    // Terrain & Counter Multipliers
    let terrainMult = TerrainMatrix.getTerrainCombatModifier(
      attackerTerrain,
      defenderTerrain,
      stats.category,
      defStats.category,
      skillType
    );

    if (isAmbush) terrainMult *= 1.50;

    const counterMult = defenderClass ? ArmyRegistry.getCounterMultiplier(attackerClass, defenderClass) : 1.0;
    const defArmorMult = TerrainMatrix.getTerrainDefensiveMultiplier(defenderTerrain);

    switch (skillType) {
      case 'FIRE_ARROW': {
        const effectiveDef = defStats.defense * defArmorMult;
        const armorFactor = 100 / (100 + effectiveDef);
        const baseSkillDmg = stats.attack * 1.50; // 1.50x Base Skill Multiplier
        const finalDmg = Math.max(12, Math.round(baseSkillDmg * armorFactor * counterMult * terrainMult));

        return {
          skillType,
          primaryDamage: finalDmg,
          isCritical: true,
          appliedStatus: 'BURN',
          affectedHexes
        };
      }

      case 'CAVALRY_CHARGE': {
        const effectiveDef = defStats.defense * defArmorMult;
        const armorFactor = 100 / (100 + effectiveDef);
        const baseSkillDmg = stats.attack * 2.20; // 2.20x Base Charge Multiplier
        const finalDmg = Math.max(20, Math.round(baseSkillDmg * armorFactor * counterMult * terrainMult));

        return {
          skillType,
          primaryDamage: finalDmg,
          isCritical: true,
          appliedStatus: 'KNOCKBACK',
          affectedHexes
        };
      }

      case 'ARMOR_PIERCE_BOLT': {
        const effectiveDef = (defStats.defense * 0.3) * defArmorMult; // Ignores 70% Def
        const armorFactor = 100 / (100 + effectiveDef);
        const baseSkillDmg = stats.attack * 1.60; // 1.60x Base Armor Pierce Multiplier
        const finalDmg = Math.max(18, Math.round(baseSkillDmg * armorFactor * counterMult * terrainMult));

        const dq = targetPos.q - attackerPos.q;
        const dr = targetPos.r - attackerPos.r;
        const pierceHex: HexCoord = {
          q: targetPos.q + Math.sign(dq),
          r: targetPos.r + Math.sign(dr)
        };
        affectedHexes.push(pierceHex);

        return {
          skillType,
          primaryDamage: finalDmg,
          isCritical: true,
          affectedHexes
        };
      }

      case 'SPEAR_WALL': {
        return {
          skillType,
          primaryDamage: 0,
          isCritical: false,
          appliedStatus: 'BRACE',
          affectedHexes: [attackerPos]
        };
      }

      case 'SHIELD_WALL_DEFENSE': {
        return {
          skillType,
          primaryDamage: 0,
          isCritical: false,
          appliedStatus: 'SHIELD_WALL',
          affectedHexes: [attackerPos]
        };
      }

      case 'WHIRLWIND_SLASH': {
        const neighbors = HexMath.getNeighbors(attackerPos);
        const effectiveDef = defStats.defense * defArmorMult;
        const armorFactor = 100 / (100 + effectiveDef);
        const baseSkillDmg = stats.attack * 1.40; // 1.40x Area Slash Multiplier
        const finalDmg = Math.max(14, Math.round(baseSkillDmg * armorFactor * counterMult * terrainMult));

        return {
          skillType,
          primaryDamage: finalDmg,
          isCritical: true,
          affectedHexes: neighbors
        };
      }

      case 'BOULDER_BARRAGE': {
        const neighbors = HexMath.getNeighbors(targetPos);
        const allTargetHexes = [targetPos, ...neighbors];
        const effectiveDef = defStats.defense * defArmorMult;
        const armorFactor = 100 / (100 + effectiveDef);
        const baseSkillDmg = stats.attack * 1.80; // 1.80x Catapult Boulder Multiplier
        const finalDmg = Math.max(25, Math.round(baseSkillDmg * armorFactor * counterMult * terrainMult));

        return {
          skillType,
          primaryDamage: finalDmg,
          isCritical: true,
          affectedHexes: allTargetHexes
        };
      }
    }
  }
}
