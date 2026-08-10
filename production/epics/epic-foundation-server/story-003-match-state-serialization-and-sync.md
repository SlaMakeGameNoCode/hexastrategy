# Story 003: Match State Serialization & Sync

> **Epic**: Foundation & Server State Engine  
> **Status**: Complete  
> **Layer**: Foundation / Core  
> **Type**: Integration  
> **Estimate**: 3 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/game-concept.md](file:///f:/prototype/hexastreragy/design/gdd/game-concept.md)  
**Requirement**: `TR-concept-001` & `TR-concept-004` (Match State Sync)  

**ADR Governing Implementation**: [ADR-0002: Server-Authoritative State & WebSocket Payload Protocol](file:///f:/prototype/hexastreragy/docs/architecture/adr-0002-server-authoritative-websocket-protocol.md)  
**ADR Decision Summary**: Server broadcasts `RoundResolvedPayload` after resolving turn so client can animate movement, combat, and update HP.  

**Engine**: Web Canvas / HTML5 / Node.js | **Risk**: LOW  

**Control Manifest Rules (this layer)**:
- Required: Broadcast complete `MatchState` snapshot to both clients after round resolution.

---

## Acceptance Criteria

- [x] Server serializes `MatchState` (unit HP, positions, cooldowns, victory status).
- [x] Server broadcasts `RoundResolvedPayload` to both room sockets upon resolution.
- [x] Client receives state update payload and updates local client model.

---

## Implementation Notes

- Implement JSON serialization in `src/server/state-serializer.ts`.
- Broadcast via WebSocket event `round_resolved`.

---

## QA Test Cases

- **AC-1**: Round Resolved Payload Sync
  - Given: A turn finishes resolution on server.
  - When: `StateSerializer.broadcastRoundResolved()` is called.
  - Then: Both connected clients receive the exact same match state payload.

---

## Test Evidence

**Story Type**: Integration  
**Required evidence**: `tests/integration/server/state_sync_test.ts` — must exist and pass.  

**Status**: [x] Passed (2/2 integration tests passing via Vitest)  


---

## Dependencies

- Depends on: Story 002  
- Unlocks: Hex Grid Engine Implementation  
