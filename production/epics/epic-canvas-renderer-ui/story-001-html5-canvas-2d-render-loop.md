# Story 001: HTML5 Canvas 2D Render Loop & Offscreen Terrain Cache

> **Epic**: Canvas 2D Renderer & Game UI  
> **Status**: Complete  
> **Layer**: Presentation  
> **Type**: UI  
> **Estimate**: 3 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md)  
**Requirement**: `TR-battle-004` (Canvas 2D 60 FPS performance)  

**ADR Governing Implementation**: [ADR-0004: HTML5 Canvas 2D Batching & Render Loop Architecture](file:///f:/prototype/hexastreragy/docs/architecture/adr-0004-html5-canvas-render-loop.md)  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [x] `requestAnimationFrame` loop runs at 60 FPS.
- [x] Static hex map terrain cached in Offscreen Canvas.
- [x] Canvas scales dynamically with `window.devicePixelRatio`.

---

## Implementation Notes

- Implement `src/ui/canvas-renderer.ts`.

---

## Test Evidence

**Story Type**: UI  
**Required evidence**: `tests/unit/ui/canvas_renderer_test.ts` — must exist and pass.  

**Status**: [x] Passed (1/1 unit test passing via Vitest)  

