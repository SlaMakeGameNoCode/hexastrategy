# ADR-0001: Hex Grid Coordinate System & Math Strategy

## Status
Accepted

## Date
2026-08-10

## Engine Compatibility
Web Canvas / HTML5 / TypeScript (Pure Math, zero external engine dependencies)

## Context
HEX LEGION requires a hexagonal grid for unit movement, range calculations, line of sight, and terrain placement. Using standard offset 2D grid coordinates causes asymmetrical distance math and complex pathfinding.

## GDD Requirements Addressed
- TR-battle-001: Hexagonal Grid Map Rendering & Axial/Cube Coordinate System
- TR-battle-002: Movement Preview & A* Pathfinding

## Decision
We adopt **Axial Coordinates ($q, r$) with derived Cube Coordinates ($q, r, s$ where $q + r + s = 0$)**:
1. **Coordinate Representation**: Every hex cell is identified by integer pair `(q, r)`.
2. **Hex Distance**: Distance between two hexes $A(q_1, r_1)$ and $B(q_2, r_2)$ is computed as:
   $$\text{Distance}(A, B) = \frac{|q_1 - q_2| + |r_1 - r_2| + |(q_1 + r_1) - (q_2 + r_2)|}{2}$$
3. **Pathfinding Algorithm**: A* algorithm using Hex Distance as the heuristic function $h(n)$.
4. **Pixel Conversion**: Pointy-topped hex layout conversion formula for Canvas rendering:
   $$x = \text{size} \times \sqrt{3} \times (q + r / 2)$$
   $$y = \text{size} \times \frac{3}{2} \times r$$

## Consequences
- **Positive**: Exact, symmetrical distance calculation for ranged attacks and movement.
- **Positive**: Clean A* pathfinding implementation without directional bias.
- **Negative**: Canvas pixel transformation requires dynamic screen-to-hex conversion logic for mouse/touch clicks.
