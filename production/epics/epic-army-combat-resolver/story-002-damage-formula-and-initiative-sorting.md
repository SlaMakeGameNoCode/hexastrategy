# Story 002: Damage Formula & Initiative Sorting

> **Epic**: Army Stats & Combat Resolver  
> **Status**: Complete  
> **Layer**: Core / Gameplay  
> **Type**: Logic  
> **Estimate**: 2 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/army-system.md](file:///f:/prototype/hexastreragy/design/gdd/army-system.md)  
**Requirement**: `TR-battle-003`  

**ADR Governing Implementation**: [ADR-0003: Simultaneous Combat Resolution & Initiative Determinism](file:///f:/prototype/hexastreragy/docs/architecture/adr-0003-simultaneous-combat-resolution.md)  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [x] Damage formula calculates base damage modified by ATK, DEF, Counter multiplier, and Terrain.
- [x] Actions sorted deterministically by PriorityScore before turn resolution.

---

## Implementation Notes

- Implement `src/gameplay/combat-resolver.ts`.

---

## Test Evidence

**Story Type**: Logic  
**Required evidence**: `tests/unit/gameplay/combat_resolver_test.ts` — must exist and pass.  

**Status**: [x] Passed (2/2 unit tests passing via Vitest)  

