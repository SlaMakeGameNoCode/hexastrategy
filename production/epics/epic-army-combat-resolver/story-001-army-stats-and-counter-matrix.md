# Story 001: Army Stats & Counter Matrix

> **Epic**: Army Stats & Combat Resolver  
> **Status**: Complete  
> **Layer**: Core / Gameplay  
> **Type**: Logic  
> **Estimate**: 2 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/army-system.md](file:///f:/prototype/hexastreragy/design/gdd/army-system.md)  
**Requirement**: `TR-army-001` & `TR-army-003`  

**ADR Governing Implementation**: [ADR-0003: Simultaneous Combat Resolution & Initiative Determinism](file:///f:/prototype/hexastreragy/docs/architecture/adr-0003-simultaneous-combat-resolution.md)  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [x] Stat registry configured for 12 army classes (HP, ATK, DEF, AP, MP, Range, Initiative, Cooldown).
- [x] `getCounterMultiplier(attacker, defender)` returns exact counter matrix multipliers.

---

## Implementation Notes

- Implement `src/gameplay/army-registry.ts`.

---

## Test Evidence

**Story Type**: Logic  
**Required evidence**: `tests/unit/gameplay/army_registry_test.ts` — must exist and pass.  

**Status**: [x] Passed (2/2 unit tests passing via Vitest)  

