# Story 003: Charge vs Brace Counter Resolution

> **Epic**: Army Stats & Combat Resolver  
> **Status**: Complete  
> **Layer**: Core / Gameplay  
> **Type**: Logic  
> **Estimate**: 3 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/army-system.md](file:///f:/prototype/hexastreragy/design/gdd/army-system.md)  
**Requirement**: `TR-army-004`  

**ADR Governing Implementation**: [ADR-0003: Simultaneous Combat Resolution & Initiative Determinism](file:///f:/prototype/hexastreragy/docs/architecture/adr-0003-simultaneous-combat-resolution.md)  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [x] Long Spear `Brace` reaction triggers before Heavy Cavalry `Charge` damage occurs.
- [x] `Brace` counter deals 2.0x anti-cavalry damage and cancels Charge knockback.

---

## Implementation Notes

- Implement Charge vs Brace interaction in `src/gameplay/combat-resolver.ts`.

---

## Test Evidence

**Story Type**: Logic  
**Required evidence**: `tests/unit/gameplay/charge_brace_test.ts` — must exist and pass.  

**Status**: [x] Passed (2/2 unit tests passing via Vitest)  

