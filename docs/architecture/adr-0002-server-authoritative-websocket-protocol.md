# ADR-0002: Server-Authoritative State & WebSocket Payload Protocol

## Status
Accepted

## Date
2026-08-10

## Engine Compatibility
Web Canvas / HTML5 / Node.js WebSocket (ws / Socket.io / Native WebSockets)

## Context
HEX LEGION is a competitive 1v1 game using a Simultaneous Planning turn model (10s timer, 10 AP limit). Client-side combat calculations could allow cheat injection, invalid AP usage, or fake HP modifications.

## GDD Requirements Addressed
- TR-concept-001: 1v1 PvP Matchmaking & Private Rooms
- TR-concept-003: Simultaneous Planning (10s timer, 10 AP budget)
- TR-concept-004: Server-Authoritative Anti-Cheat Match State

## Decision
1. **Server Ownership**: Server maintains the canonical `MatchState` (unit HP, positions, cooldowns, current round, player ratings).
2. **Turn Payload Protocol**: During the 10-second planning window, client sends action payloads:
   ```json
   {
     "matchId": "m_12345",
     "round": 4,
     "actions": [
       { "unitId": "u_1", "type": "MOVE", "targetHex": { "q": 2, "r": -1 } },
       { "unitId": "u_2", "type": "ATTACK", "targetUnitId": "u_5" }
     ]
   }
   ```
3. **Server Validation**: Server checks:
   - $\sum \text{ActionCost} \le 10 \text{ AP}$
   - All unit positions and ranges are valid
   - Unit is alive and cooldowns are clear
4. **Resolution Broadcast**: Once both payloads are received or timer expires, server resolves the turn and broadcasts `RoundResolvedPayload` containing animation keyframes and updated `MatchState`.

## Consequences
- **Positive**: Complete anti-cheat protection; client cannot tamper with combat outcomes.
- **Positive**: Smooth, deterministic animation playback on client.
- **Negative**: Requires Node.js WebSocket server infrastructure.
