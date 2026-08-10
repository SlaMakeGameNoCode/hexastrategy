# Epic: Army Stats & Combat Resolver

> **Layer**: Core / Gameplay  
> **GDD**: [design/gdd/army-system.md](file:///f:/prototype/hexastreragy/design/gdd/army-system.md)  
> **Architecture Module**: CombatResolver & UnitStatsManager  
> **Status**: Ready  
> **Stories**: Not yet created — run `/create-stories epic-army-combat-resolver`  

## Overview

Xây dựng dữ liệu 12 loại đơn vị quân (HP, ATK, DEF, AP, MP, Range, Initiative, Cooldown), ma trận khắc chế, thứ tự phân giải lượt (Initiative Ordering) và các cơ chế tương tác đặc thù (Spear Brace phản công Kỵ binh Charge).

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0003](file:///f:/prototype/hexastreragy/docs/architecture/adr-0003-simultaneous-combat-resolution.md) | Simultaneous Combat Resolution & Initiative Determinism | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-army-001 | 12 Army Classes with Core Stats | ADR-0003 ✅ |
| TR-army-003 | Unit Counter Matrix | ADR-0003 ✅ |
| TR-army-004 | Signature Abilities (Brace vs Charge counter-play) | ADR-0003 ✅ |
| TR-battle-003 | Turn Resolution Sequence & Initiative Sorting | ADR-0003 ✅ |

## Definition of Done

- All 12 unit statistics and AP costs are configured.
- Combat damage formula and counter matrix multipliers resolve deterministically.
- Long Spear Brace vs Heavy Cavalry Charge counter reaction functions correctly in test suite.

## Next Step

Run `/create-stories epic-army-combat-resolver` to break this epic into implementable stories.
