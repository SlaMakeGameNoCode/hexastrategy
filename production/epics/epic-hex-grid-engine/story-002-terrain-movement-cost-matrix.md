# Story 002: Terrain Movement Cost Matrix

> **Epic**: Hex Grid Engine & Pathfinding  
> **Status**: Complete  
> **Layer**: Core  
> **Type**: Config/Data  
> **Estimate**: 1 hour  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/army-system.md](file:///f:/prototype/hexastreragy/design/gdd/army-system.md)  
**Requirement**: `TR-army-002` (Terrain Movement Cost Matrix)  

**ADR Governing Implementation**: [ADR-0001: Hex Grid Coordinate System & Math Strategy](file:///f:/prototype/hexastreragy/docs/architecture/adr-0001-hex-grid-coordinate-system.md)  
**ADR Decision Summary**: Define terrain types and Movement Point (MP) penalties per unit category.  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [x] Terrain types (GROUND, ROAD, FOREST, HIGH_GROUND, RUINS, MOUNTAIN, WATER) defined.
- [x] Movement costs per unit category (INFANTRY, CAVALRY, ARCHER) configured.
- [x] Cavalry receives +1 MP penalty in Forest/Ruins; Mountains and Water are impassable.

---

## Implementation Notes

- Implement `src/core/terrain-matrix.ts`.

---

## Test Evidence

**Story Type**: Config/Data  
**Required evidence**: `tests/unit/core/terrain_matrix_test.ts` — must exist and pass.  

**Status**: [x] Passed (3/3 unit tests passing via Vitest)  

