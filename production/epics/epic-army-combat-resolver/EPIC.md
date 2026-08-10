# Epic: Army Stats & Combat Resolver

> **Layer**: Core / Gameplay  
> **GDD**: [design/gdd/army-system.md](file:///f:/prototype/hexastreragy/design/gdd/army-system.md)  
> **Architecture Module**: CombatResolver & UnitStatsManager  
> **Status**: Ready  
> **Stories**: 3 Stories created  

## Overview

Xây dựng dữ liệu 12 loại đơn vị quân (HP, ATK, DEF, AP, MP, Range, Initiative, Cooldown), ma trận khắc chế, thứ tự phân giải lượt (Initiative Ordering) và các cơ chế tương tác đặc thù (Spear Brace phản công Kỵ binh Charge).

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | [Army Stats & Counter Matrix](file:///f:/prototype/hexastreragy/production/epics/epic-army-combat-resolver/story-001-army-stats-and-counter-matrix.md) | Logic | Complete | ADR-0003 |
| 002 | [Damage Formula & Initiative Sorting](file:///f:/prototype/hexastreragy/production/epics/epic-army-combat-resolver/story-002-damage-formula-and-initiative-sorting.md) | Logic | Complete | ADR-0003 |
| 003 | [Charge vs Brace Counter Resolution](file:///f:/prototype/hexastreragy/production/epics/epic-army-combat-resolver/story-003-charge-vs-brace-counter-resolution.md) | Logic | Complete | ADR-0003 |



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
