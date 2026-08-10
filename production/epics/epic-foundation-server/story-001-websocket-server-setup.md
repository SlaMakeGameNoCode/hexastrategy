# Story 001: WebSocket Server & Room Setup

> **Epic**: Foundation & Server State Engine  
> **Status**: Ready  
> **Layer**: Foundation / Core  
> **Type**: Logic  
> **Estimate**: 3 hours  
> **Manifest Version**: 1.0.0  
> **Last Updated**: 2026-08-10  

## Context

**GDD**: [design/gdd/game-concept.md](file:///f:/prototype/hexastreragy/design/gdd/game-concept.md)  
**Requirement**: `TR-concept-004` (Server Authoritative WebSocket Server)  

**ADR Governing Implementation**: [ADR-0002: Server-Authoritative State & WebSocket Payload Protocol](file:///f:/prototype/hexastreragy/docs/architecture/adr-0002-server-authoritative-websocket-protocol.md)  
**ADR Decision Summary**: Server Node.js / TypeScript chịu trách nhiệm quản lý kết nối WebSocket và tạo phòng đấu 1v1 (`MatchState`).  

**Engine**: Web Canvas / HTML5 / Node.js | **Risk**: LOW  

**Control Manifest Rules (this layer)**:
- Required: Server-Authoritative State validation, Anti-cheat payload verification.
- Forbidden: Allowing Client to directly mutate HP or unit position.

---

## Acceptance Criteria

- [ ] Node.js WebSocket Server boots and accepts incoming client connections.
- [ ] Server manages 1v1 match creation and registers two player socket connections per room.
- [ ] Server auto-cleans up disconnected sessions after 2 timeout turns.

---

## Implementation Notes

- Create TypeScript WebSocket server in `src/server/server.ts` or `src/server/matchmaker.ts`.
- Maintain `MatchState` object in memory on server side.
- Emit `match_created` event when 2 clients join room.

---

## QA Test Cases

- **AC-1**: WebSocket Server Startup & Connection
  - Given: Server is started on port 8080.
  - When: Client connects via WebSocket URL `ws://localhost:8080`.
  - Then: Server accepts connection and returns `connection_ack` message.

---

## Test Evidence

**Story Type**: Logic  
**Required evidence**: `tests/unit/server/websocket_server_test.ts` — must exist and pass.  

**Status**: [ ] Not yet created  

---

## Dependencies

- Depends on: None  
- Unlocks: Story 002  
