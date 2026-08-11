# HEX LEGION — Game Design Overview

**Document:** Overview  
**Version:** 0.1  
**Status**: Designed  
**Platform:** Web Game / Server-based  
**Genre:** Turn-based Tactical PvP / PvE  
**Match Duration:** Target 3–5 minutes  
**Battle Format:** 1v1  
**Army Size:** Up to 5 armies per player  

---

## Overview

**HEX LEGION** is a fast-paced turn-based tactical strategy game played on a hexagonal battlefield.

Each player commands a small army of up to five distinct military units. Players must position their armies, predict enemy actions, exploit terrain, use unit counters, and manage abilities and cooldowns to win battles.

The game combines:
- Tactical positioning
- Unit counter systems
- Short decision windows
- Army collection
- RPG-style progression
- PvP matchmaking
- Private PvP invitations
- PvE battles against increasingly difficult bots

---

## Player Fantasy

The player acts as a **Master Tactician / Legion Commander** commanding a high-stakes 5-unit medieval army on a dynamic hex board. The core fantasy is compressing the depth and tactical weight of a *Total War* battlefield into a fast, intense 5-minute duel where prediction and positioning outsmart raw numbers.

---

## Core Design Pillars

### 2.1 Easy to Learn
Each army must have a clear battlefield role.
A player should quickly understand:
- What the unit does
- What it counters
- What counters it
- Its movement range
- Its attack range
- Its key ability

### 2.2 Hard to Master
Winning should depend primarily on:
- Positioning
- Timing
- Target selection
- Prediction
- Counter-play
- Terrain
- Cooldown management
- Army composition

Progression should improve collection and build variety without making raw account power the only determinant of PvP results.

### 2.3 Five-Minute Battles
A match should be short enough to encourage: *"One more game."*  
Target battle duration: **3–5 minutes**.

### 2.4 Collection and Progression
The long-term loop is:  
**Battle → Reward → Gacha → New/Duplicate Army → Upgrade → Evolution → New Build → Battle**

---

## Detailed Rules

### Turn Model: Alternating Realtime Turn (Mô Hình Cờ Vua / Cờ Tướng Luân Phiên)
Trận đấu diễn ra theo lượt luân phiên từng người chơi:
- **Lượt Đi (Turn)**: Mỗi người chơi có 15 giây để chọn 1 lính di chuyển hoặc kích hoạt kỹ năng.
- **Realtime Animation Relay**: Ngay khi gửi lượt đi, hành động và hoạt cảnh (chém/nổ/bắn tên) được truyền qua WebSocket và **chạy hoạt cảnh đồng thời trên cả 2 màn hình tại thời điểm đó**.
- **Đồng Bộ Góc Nhìn Đối Ứng 180°**: Người chơi 1 và Người chơi 2 đều thấy quân mình ở phía dưới màn hình. Player 2 được lật đối ứng `(q, r) -> (-q, -r)`.
- **Hệ Thống Reconnect & Heartbeat**: Heartbeat 5s Ping-Pong giữ kết nối sống 100%. Nếu rớt mạng quá 30s sẽ bị xử thua rớt mạng (`Forfeit Win`).

### Game Modes
1. **PvP Matchmaking**: Ranked 1v1 based on skill MMR.
2. **Private PvP**: 1v1 invited room for friendly/practice games.
3. **PvE**: 1v1 vs Bot (Easy, Medium, Hard, Very Hard).

---

## Formulas

- **Round AP Allocation**: $AP_{\text{round}} = 10$
- **Action Selection Constraint**: $\sum_{i \in \text{Selected Armies}} AP_{\text{cost}}(i) \le 10$
- **Deck Limit**: $N_{\text{armies}} \le 5$

---

## Edge Cases

- **Timer Expiry**: If a player submits incomplete actions when the 10s timer expires, submitted actions are locked; unassigned units perform `Wait`.
- **Disconnect**: If a player disconnects, the server auto-submits `Wait` for 2 turns before awarding forfeit victory to opponent.
- **Match Timeout**: If 3-5 minute limit is reached, victory goes to the player with the highest remaining total Army HP percentage.

---

## Dependencies

- [army-system.md](file:///f:/prototype/hexastreragy/design/gdd/army-system.md) — Specification of unit stats, AP costs, and abilities.
- [battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md) — Combat resolution, initiative, and hex board mechanics.

---

## Tuning Knobs

- `PLANNING_TIME_SEC`: 10 seconds
- `MAX_ROUND_AP`: 10 AP
- `DECK_MAX_UNITS`: 5 units
- `MATCH_TIMEOUT_MIN`: 5 minutes

---

## Acceptance Criteria

- [ ] A 1v1 match completes within 3–5 minutes.
- [ ] Players cannot spend more than 10 AP per round.
- [ ] Simultaneous actions resolve deterministically on the server.
- [ ] Both PvP (Ranked & Private) and PvE (4 difficulties) modes function as specified.
