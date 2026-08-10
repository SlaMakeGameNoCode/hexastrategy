# Story 001: Axial Hex Coordinates & Distance Math

> **Epic**: Hex Grid Engine & Pathfinding  
> **Status**: Complete  
> **Layer**: Core  
> **Type**: Logic  
> **Estimate**: 2 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md)  
**Requirement**: `TR-battle-001` (Hexagonal Grid Map & Axial Coordinates)  

**ADR Governing Implementation**: [ADR-0001: Hex Grid Coordinate System & Math Strategy](file:///f:/prototype/hexastreragy/docs/architecture/adr-0001-hex-grid-coordinate-system.md)  
**ADR Decision Summary**: Adopt Axial Coordinates ($q, r$) with derived Cube Coordinates ($q, r, s$ where $q + r + s = 0$).  

**Engine**: Web Canvas / HTML5 / TypeScript | **Risk**: LOW  

**Control Manifest Rules (this layer)**:
- Required: Use Axial coordinates (`q`, `r`) for all spatial math.
- Forbidden: Hardcoding Cartesian pixel distance ($x^2 + y^2$) for hex grid distance.

---

## Acceptance Criteria

- [x] `HexCoord` class handles Axial `(q, r)` and computes derived Cube `s = -q - r`.
- [x] `getHexDistance(a, b)` computes exact hex tile distance.
- [x] `hexToPixel(hex, radius)` and `pixelToHex(point, radius)` convert coordinates accurately.

---

## Implementation Notes

- Implement `src/core/hex-math.ts`.

---

## QA Test Cases

- **AC-1**: Distance Math
  - Given: Hex A = (0, 0) and Hex B = (2, -1).
  - When: `getHexDistance(A, B)` is called.
  - Then: Distance returns 2.

---

## Test Evidence

**Story Type**: Logic  
**Required evidence**: `tests/unit/core/hex_math_test.ts` — must exist and pass.  

**Status**: [x] Passed (3/3 unit tests passing via Vitest)  

