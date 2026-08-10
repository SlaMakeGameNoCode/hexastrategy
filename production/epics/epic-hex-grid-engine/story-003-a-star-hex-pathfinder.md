# Story 003: A* Hex Pathfinder

> **Epic**: Hex Grid Engine & Pathfinding  
> **Status**: Complete  
> **Layer**: Core  
> **Type**: Logic  
> **Estimate**: 3 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md)  
**Requirement**: `TR-battle-002` (A* Pathfinding & Movement Preview)  

**ADR Governing Implementation**: [ADR-0001: Hex Grid Coordinate System & Math Strategy](file:///f:/prototype/hexastreragy/docs/architecture/adr-0001-hex-grid-coordinate-system.md)  
**ADR Decision Summary**: Implement A* pathfinding using hex distance heuristic $h(n)$ and terrain MP cost.  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [x] A* Pathfinder calculates optimal path with lowest MP cost.
- [x] Returns list of reachable hexes given unit's available MP.
- [x] Correctly avoids impassable terrain or blocked hexes.

---

## Implementation Notes

- Implement `src/core/hex-pathfinder.ts`.

---

## Test Evidence

**Story Type**: Logic  
**Required evidence**: `tests/unit/core/hex_pathfinder_test.ts` — must exist and pass.  

**Status**: [x] Passed (3/3 unit tests passing via Vitest)  

