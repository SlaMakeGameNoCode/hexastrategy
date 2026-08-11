# Story 004: Responsive & Adaptive Strategy HUD Layout Upgrade

> **Epic**: Canvas 2D Renderer & Game UI  
> **Status**: Complete  
> **Layer**: Presentation  
> **Type**: UI  
> **Estimate**: 3 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-11  

---

## Context

**UX Specification**: [design/ux/hud.md](file:///f:/prototype/hexastreragy/design/ux/hud.md)  
**GDD**: [design/gdd/game-concept.md](file:///f:/prototype/hexastreragy/design/gdd/game-concept.md) & [design/gdd/battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md)  
**Requirement**: `TR-concept-003` & `TR-battle-004`  

**ADR Governing Implementation**: [ADR-0004: HTML5 Canvas 2D Batching & Render Loop Architecture](file:///f:/prototype/hexastreragy/docs/architecture/adr-0004-html5-canvas-render-loop.md)  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

---

## Acceptance Criteria

- [ ] HUD layout matches 5-Zone layout specification in `design/ux/hud.md`.
- [ ] Timer Ring transitions color dynamically from Gold (`#F59E0B`) to Red when remaining time is under 3 seconds.
- [ ] Unit Card slides up smoothly with unit stats and skill activation button when a unit is selected.
- [ ] AP Bar displays AP cost preview with flashing animation when hovering or assigning actions.
- [ ] All action buttons meet minimum touch target size (44x44px) for mobile responsiveness.

---

## Implementation Notes

- Upgrade `src/ui/hud-overlay.ts`, `index.html`, and CSS styles.
- Maintain compatibility with existing `TurnManager` and `main.ts` event handlers.

---

## Test Evidence

**Story Type**: UI  
**Required evidence**: `tests/unit/ui/hud_overlay_test.ts` — must exist and pass.  
