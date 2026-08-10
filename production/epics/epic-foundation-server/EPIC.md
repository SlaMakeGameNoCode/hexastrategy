# Epic: Foundation & Server State Engine

> **Layer**: Foundation / Core  
> **GDD**: [design/gdd/game-concept.md](file:///f:/prototype/hexastreragy/design/gdd/game-concept.md)  
> **Architecture Module**: WebSocketClient/Server & GameStateStore  
> **Status**: Ready  
> **Stories**: 3 Stories created  

## Overview

Xây dựng hệ thống Server Authoritative và giao thức mạng WebSocket thời gian thực. Server làm chủ toàn bộ dữ liệu trận đấu (`MatchState`), đếm ngược 10 giây và kiểm tra tính hợp lệ của ngân sách 10 AP/lượt.

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | [WebSocket Server & Room Setup](file:///f:/prototype/hexastreragy/production/epics/epic-foundation-server/story-001-websocket-server-setup.md) | Logic | Complete | ADR-0002 |
| 002 | [Simultaneous Turn Timer & AP Validator](file:///f:/prototype/hexastreragy/production/epics/epic-foundation-server/story-002-simultaneous-turn-timer-and-ap-validator.md) | Logic | Complete | ADR-0002 |
| 003 | [Match State Serialization & Sync](file:///f:/prototype/hexastreragy/production/epics/epic-foundation-server/story-003-match-state-serialization-and-sync.md) | Integration | Complete | ADR-0002 |



## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0002](file:///f:/prototype/hexastreragy/docs/architecture/adr-0002-server-authoritative-websocket-protocol.md) | Server-Authoritative WebSocket State & 10 AP Payload Protocol | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-concept-001 | PvP Matchmaking & Private Rooms | ADR-0002 ✅ |
| TR-concept-003 | Simultaneous Planning (10s timer, 10 AP budget) | ADR-0002 ✅ |
| TR-concept-004 | Server-Authoritative Anti-Cheat Match State | ADR-0002 ✅ |

## Definition of Done

- All WebSocket connection payloads, match creation, and state synchronization stories are implemented.
- 10 AP budget validator prevents illegal client submissions.
- Unit testing for match state serialization passes with 80%+ coverage.

## Next Step

Run `/create-stories epic-foundation-server` to break this epic into implementable stories.
