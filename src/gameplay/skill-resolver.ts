import { ArmyClassId, ArmyRegistry } from './army-registry.js';
import { HexCoord, HexMath } from '../core/hex-math.js';


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
      description: 'Bắn tên lửa gây sát thương + Thiêu đốt 15 DMG/lượt trong 2 lượt.'
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
      description: 'Lao thẳng 3 ô gây 2.0x sát thương và đẩy lùi mục tiêu 1 ô Hex.'
    },
    ARMOR_PIERCE_BOLT: {
      type: 'ARMOR_PIERCE_BOLT',
      name: 'Bắn Xuyên Giáp',
      apCost: 3,
      cooldownRounds: 2,
      description: 'Bắn tên nỏ thép bỏ qua 70% Giáp và xuyên qua mục tiêu phía sau.'
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
      description: 'Chém xoay 360 độ gây 100% sát thương lên tất cả 6 ô Hex xung quanh.'
    },
    BOULDER_BARRAGE: {
      type: 'BOULDER_BARRAGE',
      name: 'Mưa Đá Lửa Địa Chấn',
      apCost: 5,
      cooldownRounds: 3,
      description: 'Bắn chùm đá lửa gây nổ diện rộng 7 ô Hex.'
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
    targetDef: number = 20
  ): SkillResult {

    const stats = ArmyRegistry.getStats(attackerClass);
    const affectedHexes: HexCoord[] = [targetPos];

    switch (skillType) {
      case 'FIRE_ARROW': {
        const rawDmg = Math.round(stats.attack * 1.3);
        const dmg = Math.max(5, rawDmg - Math.round(targetDef * 0.5));
        return {
          skillType,
          primaryDamage: dmg,
          isCritical: true,
          appliedStatus: 'BURN',
          affectedHexes
        };
      }

      case 'CAVALRY_CHARGE': {
        const rawDmg = Math.round(stats.attack * 2.0);
        const dmg = Math.max(10, rawDmg - targetDef);
        return {
          skillType,
          primaryDamage: dmg,
          isCritical: true,
          appliedStatus: 'KNOCKBACK',
          affectedHexes
        };
      }

      case 'ARMOR_PIERCE_BOLT': {
        const effectiveDef = Math.round(targetDef * 0.3); // Ignores 70% Def
        const dmg = Math.max(15, stats.attack - effectiveDef);

        // Calculate piercing hex behind target
        const dq = targetPos.q - attackerPos.q;
        const dr = targetPos.r - attackerPos.r;
        const pierceHex: HexCoord = {
          q: targetPos.q + Math.sign(dq),
          r: targetPos.r + Math.sign(dr)
        };
        affectedHexes.push(pierceHex);

        return {
          skillType,
          primaryDamage: dmg,
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
        const dmg = Math.max(10, Math.round(stats.attack * 1.1) - Math.round(targetDef * 0.5));
        return {
          skillType,
          primaryDamage: dmg,
          isCritical: true,
          affectedHexes: neighbors
        };
      }

      case 'BOULDER_BARRAGE': {
        const neighbors = HexMath.getNeighbors(targetPos);
        const allTargetHexes = [targetPos, ...neighbors];
        const dmg = Math.max(15, Math.round(stats.attack * 1.4) - Math.round(targetDef * 0.4));
        return {
          skillType,
          primaryDamage: dmg,
          isCritical: true,
          affectedHexes: allTargetHexes
        };
      }
    }
  }
}
