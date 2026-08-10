# Epic: Hex Grid Engine & Pathfinding

> **Layer**: Core  
> **GDD**: [design/gdd/battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md)  
> **Architecture Module**: HexGridEngine & A* Pathfinder  
> **Status**: Ready  
> **Stories**: 3 Stories created  

## Overview

Xây dựng bộ toán bàn cờ Hexagon dựa trên hệ tọa độ Axial ($q, r$), công thức khoảng cách Hex và thuật toán tìm đường ngắn nhất A* có tính đến chi phí địa hình (Đất, Đường, Rừng, Núi,...).

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | [Axial Hex Coordinates & Distance Math](file:///f:/prototype/hexastreragy/production/epics/epic-hex-grid-engine/story-001-axial-hex-coordinates-and-math.md) | Logic | Complete | ADR-0001 |
| 002 | [Terrain Movement Cost Matrix](file:///f:/prototype/hexastreragy/production/epics/epic-hex-grid-engine/story-002-terrain-movement-cost-matrix.md) | Config/Data | Complete | ADR-0001 |
| 003 | [A* Hex Pathfinder](file:///f:/prototype/hexastreragy/production/epics/epic-hex-grid-engine/story-003-a-star-hex-pathfinder.md) | Logic | Complete | ADR-0001 |



## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0001](file:///f:/prototype/hexastreragy/docs/architecture/adr-0001-hex-grid-coordinate-system.md) | Hex Grid Axial Coordinate System & A* Pathfinding Strategy | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-battle-001 | Hexagonal Grid Map Rendering & Axial Coordinate System | ADR-0001 ✅ |
| TR-battle-002 | A* Pathfinding & Terrain MP Movement Cost Calculation | ADR-0001 ✅ |

## Definition of Done

- Hex distance and coordinate transform functions pass all unit tests.
- A* Pathfinding correctly computes cheapest path considering unit category terrain penalties.
- Impassable tiles (Mountains/Water) block movement calculations correctly.

## Next Step

Run `/create-stories epic-hex-grid-engine` to break this epic into implementable stories.
