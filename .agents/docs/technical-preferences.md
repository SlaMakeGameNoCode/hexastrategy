# Technical Preferences

## Engine & Language

- **Engine**: Web Canvas / HTML5
- **Language**: TypeScript (ES2022+, Strict Mode)
- **Rendering**: HTML5 Canvas 2D / WebGL2 Context
- **Physics**: Custom Hex Grid Math / Custom AABB

## Input & Platform

- **Target Platforms**: Web / Browser (Desktop & Mobile Browser)
- **Input Methods**: Mouse / Keyboard, Touch
- **Primary Input**: Mouse / Touch (Click/Tap & Drag)
- **Gamepad Support**: None
- **Touch Support**: Full (Tap to select hex/army, Drag to inspect)
- **Platform Notes**: Responsive layout canvas, supports desktop browser windows and mobile orientations.

## Naming Conventions

- **Classes**: PascalCase (e.g., `ArmyUnit`, `HexGridMap`, `BattleState`)
- **Variables**: camelCase (e.g., `actionPoints`, `movementCost`)
- **Signals/Events**: camelCase event listener names (`onTurnStart`, `onUnitDamaged`)
- **Files**: kebab-case (e.g., `army-unit.ts`, `hex-grid-map.ts`)
- **Components**: Component classes
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ACTION_POINTS`, `GRID_WIDTH`)

## Performance Budgets

- **Target Framerate**: 60 FPS
- **Frame Budget**: 16.6ms
- **Draw Calls**: < 100 per frame (Canvas batching)
- **Memory Ceiling**: 256 MB RAM

## Testing

- **Framework**: Vitest / Jest
- **Minimum Coverage**: 80% on core combat logic & formulas
- **Required Tests**: Balance formulas, Hex distance math, Action Point validation, Simultaneous Planning resolution logic

## Forbidden Patterns

- Direct DOM manipulation inside Canvas render loops
- Hardcoded screen coordinates (must use dynamic Canvas DPI/scale resolution)
- Client-authoritative combat state (all combat state changes must originate from or be validated by server)

## Allowed Libraries / Addons

- `vite` (Build tool)
- `typescript` (Language compiler)
- `vitest` (Testing framework)

## Architecture Decisions Log

- [No ADRs yet — use /architecture-decision to create one]

## Engine Specialists

- **Primary**: tools-programmer
- **Language/Code Specialist**: gameplay-programmer
- **Shader Specialist**: technical-artist
- **UI Specialist**: ui-programmer
- **Additional Specialists**: network-programmer (PvP WebSocket/Server authoritative)
- **Routing Notes**: Use tools-programmer for Canvas rendering & build tools, gameplay-programmer for Hex grid logic & unit stats, ui-programmer for DOM/HUD overlay.

### File Extension Routing

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code (.ts files) | gameplay-programmer |
| Shader / material files (.glsl) | technical-artist |
| UI / screen files (.html, .css, UI components) | ui-programmer |
| Network / server files (server logic, WebSocket) | network-programmer |
| General architecture review | Primary |
