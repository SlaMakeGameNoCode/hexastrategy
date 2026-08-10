# Epic: Canvas 2D Renderer & Game UI

> **Layer**: Presentation  
> **GDD**: [design/gdd/battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md)  
> **Architecture Module**: Canvas2DRenderer & HUDOverlay  
> **Status**: Ready  
> **Stories**: Not yet created — run `/create-stories epic-canvas-renderer-ui`  

## Overview

Xây dựng bộ vẽ HTML5 Canvas 2D tốc độ 60 FPS, cache địa hình tĩnh bằng Offscreen Canvas, giao diện xem trước đường đi (Path Preview), đếm ngược 10s và quản lý ngân sách 10 AP trên giao diện UI.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0004](file:///f:/prototype/hexastreragy/docs/architecture/adr-0004-html5-canvas-render-loop.md) | HTML5 Canvas 2D Batching & Render Loop Architecture | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-battle-002 | Movement Preview (Pathfinding UI overlay) | ADR-0004 ✅ |
| TR-battle-004 | Canvas 2D 60 FPS performance (<100 draw calls) | ADR-0004 ✅ |

## Definition of Done

- Canvas 2D render loop achieves 60 FPS on desktop and mobile browsers.
- Static hex map background is cached in offscreen canvas buffer.
- Pathfinding hover preview correctly overlays movement cost and reachable hexes.

## Next Step

Run `/create-stories epic-canvas-renderer-ui` to break this epic into implementable stories.
