# Web HTML5 / Canvas — Version Reference

| Field | Value |
|-------|-------|
| **Engine Target** | Web Canvas 2D / WebGL2 / HTML5 |
| **Language Target** | TypeScript 5.0+ |
| **Project Pinned** | 2026-08-10 |
| **LLM Knowledge Cutoff** | May 2025 |
| **Risk Level** | LOW — Web Standards (HTML5 Canvas / ECMAScript) are fully supported and stable |

## Overview & Architecture Rules

1. **Client Rendering**: HTML5 Canvas 2D API / WebGL2 via custom render loop or Vite bundling.
2. **Server Logic**: Node.js / TypeScript WebSocket authoritative server for match state resolution.
3. **Hex Grid System**: Axial / Cube coordinates math (`q`, `r`, `s`) for hex calculations and pathfinding (A* algorithm).
4. **Performance Targets**: 60 FPS, <100 draw calls per frame, 16.6ms frame budget.
