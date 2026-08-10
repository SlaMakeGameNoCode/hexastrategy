# Story 002: Hex Pathfinding Hover Preview UI

> **Epic**: Canvas 2D Renderer & Game UI  
> **Status**: Complete  
> **Layer**: Presentation  
> **Type**: Visual/Feel  
> **Estimate**: 3 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md)  
**Requirement**: `TR-battle-002` (Movement Preview Pathfinding UI)  

**ADR Governing Implementation**: [ADR-0004: HTML5 Canvas 2D Batching & Render Loop Architecture](file:///f:/prototype/hexastreragy/docs/architecture/adr-0004-html5-canvas-render-loop.md)  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [x] Highlights reachable hex tiles when unit is selected.
- [x] Hovering over target hex draws optimal path line and displays MP cost.

---

## Implementation Notes

- Implement path preview rendering in `src/ui/path-preview-overlay.ts`.

---

## Test Evidence

**Story Type**: Visual/Feel  
**Required evidence**: `tests/unit/ui/path_preview_test.ts` — must exist and pass.  

**Status**: [x] Passed (1/1 unit test passing via Vitest)  

