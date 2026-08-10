# Story 003: HUD Overlay Timer & AP Bar

> **Epic**: Canvas 2D Renderer & Game UI  
> **Status**: Complete  
> **Layer**: Presentation  
> **Type**: UI  
> **Estimate**: 3 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/game-concept.md](file:///f:/prototype/hexastreragy/design/gdd/game-concept.md) & [design/gdd/battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md)  
**Requirement**: `TR-concept-003` & `TR-battle-004`  

**ADR Governing Implementation**: [ADR-0004: HTML5 Canvas 2D Batching & Render Loop Architecture](file:///f:/prototype/hexastreragy/docs/architecture/adr-0004-html5-canvas-render-loop.md)  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [x] HUD displays 10 AP budget bar updating in real-time as actions are assigned.
- [x] 10-second timer displays countdown ring and auto-submits actions upon expiration.
- [x] Web application index.html launches playable Canvas game directly in browser.

---

## Implementation Notes

- Implement `src/ui/hud-overlay.ts` and `index.html`.

---

## Test Evidence

**Story Type**: UI  
**Required evidence**: `tests/unit/ui/hud_overlay_test.ts` — must exist and pass.  

**Status**: [x] Passed (2/2 unit tests passing via Vitest)  

