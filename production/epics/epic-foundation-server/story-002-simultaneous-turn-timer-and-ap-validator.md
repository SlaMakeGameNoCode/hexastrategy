# Story 002: Simultaneous Turn Timer & AP Validator

> **Epic**: Foundation & Server State Engine  
> **Status**: Ready  
> **Layer**: Foundation / Core  
> **Type**: Logic  
> **Estimate**: 3 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/game-concept.md](file:///f:/prototype/hexastreragy/design/gdd/game-concept.md)  
**Requirement**: `TR-concept-003` (10s timer, 10 AP limit validation)  

**ADR Governing Implementation**: [ADR-0002: Server-Authoritative State & WebSocket Payload Protocol](file:///f:/prototype/hexastreragy/docs/architecture/adr-0002-server-authoritative-websocket-protocol.md)  
**ADR Decision Summary**: Server runs a 10-second planning timer and validates that total Action Cost $\sum \text{ActionCost} \le 10 \text{ AP}$.  

**Engine**: Web Canvas / HTML5 / Node.js | **Risk**: LOW  

**Control Manifest Rules (this layer)**:
- Required: Reject client payload if $\sum \text{ActionCost} > 10 \text{ AP}$.
- Forbidden: Accepting illegal AP payloads or letting timer run over 10 seconds.

---

## Acceptance Criteria

- [ ] Server counts down 10 seconds per planning round.
- [ ] Server validates submitted action payload AP sum ($\le 10 \text{ AP}$).
- [ ] If client submits $> 10 \text{ AP}$, server rejects the payload with error response.
- [ ] Upon 10s timer expiration, submitted actions are locked.

---

## Implementation Notes

- Implement `TurnManager.ts` in `src/server/turn-manager.ts`.
- Calculate sum of active unit AP costs using unit Action Cost stat table.
- Trigger round resolution phase when both payloads are received or 10s timer expires.

---

## QA Test Cases

- **AC-1**: AP Budget Limit Enforcement
  - Given: Player submits actions for units with total AP cost = 11 AP.
  - When: Payload is sent to `TurnManager.validatePayload()`.
  - Then: Validation fails, returns `INVALID_AP_BUDGET`, payload is rejected.

---

## Test Evidence

**Story Type**: Logic  
**Required evidence**: `tests/unit/server/turn_manager_test.ts` — must exist and pass.  

**Status**: [ ] Not yet created  

---

## Dependencies

- Depends on: Story 001  
- Unlocks: Story 003  
