# ADR-0004: HTML5 Canvas 2D Batching & Render Loop Architecture

## Status
Accepted

## Date
2026-08-10

## Engine Compatibility
Web Canvas 2D / HTML5 / TypeScript / Vite

## Context
HEX LEGION requires rendering a hex grid map, terrain tiles, unit sprites, movement paths, range indicators, and health bars at 60 FPS without UI stutter.

## GDD Requirements Addressed
- TR-battle-002: Movement Preview (Pathfinding UI)
- TR-battle-004: Performance (60 FPS, <100 Draw Calls per frame)

## Decision
1. **Render Architecture**: `requestAnimationFrame` loop driving a custom `Canvas2DRenderer`.
2. **Layered Offscreen Canvas Caching**:
   - **Background Layer (Static)**: Hex grid & terrain tiles rendered once to an offscreen Canvas and blitted per frame.
   - **Dynamic Layer**: Units, movement paths, attack range overlays, and UI health bars rendered per frame.
3. **DPI & Responsive Scaling**: Canvas resolution dynamically scales with `window.devicePixelRatio` to maintain high DPI crispness on mobile and desktop screens.
4. **Decoupled Game Loop**: Render loop reads read-only snapshot of `GameState`; no direct state mutations occur within the render pipeline.

## Consequences
- **Positive**: High performance (60 FPS, <30 draw calls/frame via offscreen canvas caching).
- **Positive**: Crisp rendering on mobile and retina displays.
- **Negative**: Canvas 2D requires custom sprite animation frame management.
