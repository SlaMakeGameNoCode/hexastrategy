# HEX LEGION — Battle Design

**Document:** Battle System  
**Version:** 0.1  
**Status**: Designed  

---

## Overview

The Battle System defines short-form, turn-based tactical combat played on a hexagonal grid. Players bring up to 8 armies into a 1v1 battle (PvP Matchmaking, PvP Private, or PvE vs AI). 

### Key Rules Update (v1.0 - Alternating Realtime Turn Model):
1. **Alternating Turn-Based Model (Mô hình Cờ Vua / Cờ Tướng Luân Phiên Realtime)**:
   - Thay vì lập kế hoạch đồng thời (Simultaneous), trận đấu diễn ra theo lượt luân phiên từng người chơi.
   - **Lượt Người Chơi A**: A chọn lính di chuyển / dùng kỹ năng -> Bấm "Gửi Lượt" (hoặc hết 15s đếm lùi). Hành động lập tức truyền qua WebSocket `SINGLE_TURN_ACTION` và **CẢ HÀI MÁY CÙNG PHÁT ANIMATION / VFX REALTIME** tại thời điểm đó.
   - Sau khi lượt A xong, bàn cờ chuyển sang **Lượt Người Chơi B**. B nhìn thấy rõ vị trí lính A đã di chuyển tới để tính toán phản công mà không phải đoán mò.
2. **Perspective Flipping (Góc nhìn lật đối ứng 180°)**:
   - Cả 2 người chơi đều có góc nhìn **"Quân Ta"** nằm ở nửa dưới màn hình.
   - Với Player 2 (Đỏ), tọa độ bàn cờ và dàn quân được lật đối ứng theo công thức `(q, r) -> (-q, -r)`. Hình ảnh đồ họa lính và văn bản giữ nguyên chiều đứng.
   - **Toàn bộ ma trận tọa độ, ô xem trước đường đi, chữ số sát thương bay lên `-20` và hiệu ứng nổ VFX đều được đồng bộ lật theo `isFlipped`**.
3. **Modal UI & Disconnect Grace Period**:
   - **Modal `⏳ ĐANG CHỜ ĐỐI THỦ...`**: KHÔNG BAO GIỜ hiển thị bên trong trận đấu.
   - **Heartbeat 5s Ping-Pong**: Giữ kết nối WebSocket sống 100%, chống bị ngắt kết nối ngầm.
   - **30s Disconnect Grace Period**: Nếu 1 bên bị rớt mạng, bên còn lại nhận thông báo đếm ngược 30s. Nếu rớt mạng quá 30s sẽ bị xử thua rớt mạng (`Forfeit Win`).

---

## Player Fantasy

Outmaneuvering an opponent in a fast-paced 5-minute tactical chess match. Players read enemy moves, position forces on high ground/forests, set traps with Spear Brace against Cavalry Charges, and maximize limited AP budgets.

---

## Detailed Rules


The battle system is a short-form tactical combat system played on a hexagonal grid.

Each player brings up to five armies.

The primary objective is to defeat the opposing army.

Alternative map objectives may be introduced later.

---

## 2. Battle Formats

### PvP Matchmaking

1v1 against a matched player.

The server selects opponents based primarily on competitive rating and appropriate matchmaking rules.

### PvP Private

1v1 against an invited player.

Private matches are intended for:

- Friends
- Practice
- Community games
- Build testing

Private matches may optionally be excluded from ranked progression.

### PvE

1v1 against a server-controlled bot.

Difficulty levels:

- Easy
- Medium
- Hard
- Very Hard

---

## 3. Match Duration

Target:

**3–5 minutes**

Hard upper limits may be used to prevent stalled matches.

If the time limit is reached, the game enters an end-of-match evaluation.

---

## 4. Battlefield

The battlefield uses a hexagonal grid.

Each hex is a discrete tactical position.

Every army occupies one or more hexes according to its size rules.

For the initial game version, each army should occupy one primary hex to keep the rules easy to understand.

---

## 5. Terrain

Initial terrain types:

### Normal Ground

No modifier.

### Road

Movement advantage.

### Forest

Potential defensive/visibility advantage and potential cavalry penalty.

### High Ground

Ranged advantage.

### Ruins

Defensive advantage.

### Rock / Mountain

Impassable.

### Water

Impassable or heavily restricted depending on map rules.

Terrain rules must remain visible and understandable to players.

---

## 6. Deployment

At the beginning of a battle:

1. Players receive a deployment zone.
2. Each player places up to five armies.
3. Deployment ends.
4. Battle begins.

Deployment should create meaningful strategic choices without becoming a long pre-game phase.

---

## 7. Simultaneous Planning

The preferred battle model is simultaneous planning.

Each round has two separate limits:

### Planning Time

Each player has:

**10 seconds**

to choose and submit actions.

### Action Budget

Each player has:

**10 Action Points (AP)**

per round.

Each army has its own **Action Cost**. When an army is assigned a primary action, that Action Cost is deducted from the player's 10 AP budget.

The player may control any number of surviving armies as long as:

> **Total Action Cost of submitted primary actions ≤ 10 AP**

Each army normally performs at most **one primary action per round**.

### Example

A player has:

- Short Spear — 1 AP
- Long Spear — 2 AP
- Heavy Cavalry — 3 AP
- Longbow — 2 AP
- Heavy Crossbow — 3 AP

The player could activate:

- Short Spear → Move = 1 AP
- Heavy Cavalry → Attack = 3 AP
- Longbow → Attack = 2 AP
- Long Spear → Defend = 2 AP

Total:

**8 / 10 AP**

Heavy Crossbow cannot also be activated because it would require another 3 AP.

### Round Sequence

1. Both players receive 10 seconds.
2. Both players receive 10 AP.
3. Players assign primary actions.
4. The UI prevents the player from exceeding 10 AP.
5. Players may revise actions while the timer is active.
6. When the timer expires, actions are locked.
7. The server validates actions.
8. The server resolves actions according to initiative and reaction rules.
9. Cooldowns and status effects update.
10. A new round begins with a fresh 10 AP budget.

Unused AP is normally lost at the end of the round.

This makes the action budget a core tactical resource:

> **You have five armies, but you cannot necessarily activate all five every round.**

## 8. Player Actions

Each army may receive one primary action per round.

### Move

Move to a valid hex within movement range.

### Attack

Select an enemy target within attack range.

### Ability

Use an available army ability.

### Defend

Enter a defensive state.

### Wait / Counter

Take no aggressive action and prepare to respond according to the army's mechanics.

---

## 9. Action Resolution

The server is authoritative.

Client-side input only submits an intended action.

The server validates:

- Player owns the army.
- Army is alive.
- Army is in the correct position.
- Target is valid.
- Movement is legal.
- Ability is available.
- Cooldown has completed.
- Action is compatible with the current turn.

The server then resolves the turn.

---

## 10. Initiative

The resolution order should be deterministic.

Possible factors:

- Army initiative
- Ability priority
- Charge priority
- Defensive reaction
- Special unit traits

The exact formula should be defined during combat prototyping.

The goal is to make outcomes predictable enough to learn while retaining tactical depth.

---

## 11. Action Cost

Action Cost is a core resource used to limit how many armies a player can actively command during a round.

### Design Principle

Weak, short-range, or lower-impact armies should generally have a lower Action Cost.

Strong, highly mobile, long-range, or high-impact armies should generally have a higher Action Cost.

### Initial Action Cost Scale

| Action Cost | General Profile |
|---:|---|
| 1 AP | Low-impact / simple / short-range |
| 2 AP | Standard army |
| 3 AP | Strong / mobile / high-impact |
| 4 AP | Exceptional; reserved for future designs |

### AP and MP Are Different

**Action Points (AP)** determine how many armies can be activated.

**Movement Points (MP)** determine how far an activated army can move.

Example:

> Heavy Cavalry = **3 AP + 5 MP**

The player spends 3 AP to activate the Heavy Cavalry. The unit then has up to 5 MP for movement, modified by terrain.

The Action Cost does not increase because the unit moves farther.

### No AP Carryover

Unused AP normally disappears at the end of the round.

Every new round starts with:

**10 AP**

## 11. Movement

Movement is based on **Movement Points**, not simply raw hex distance.

Each army has a Base Movement value.

Example:

- Light Cavalry: 6
- Heavy Cavalry: 5
- Short Spear: 5
- Sword & Shield: 4
- Long Spear: 3
- Heavy Crossbow: 2

Each terrain type consumes a different number of Movement Points.

### Example

A Short Spear with 5 Movement Points could move:

**Road → Road → Ground → Forest**

Cost:

**1 + 1 + 1 + 2 = 5**

The unit can therefore reach the Forest hex.

A Heavy Cavalry with the same route may have:

**1 + 1 + 1 + 3 = 6**

and therefore cannot reach the Forest hex during that turn.

### Movement Rules

Movement may be modified by:

- Terrain
- Unit abilities
- Status effects
- Charge mechanics
- Road bonuses
- Temporary buffs/debuffs

The pathfinding system should calculate the cheapest legal route rather than simply counting hexes.

### Movement Preview

When a player selects an army, the UI should display:

- All reachable hexes
- Recommended/shortest path
- Movement cost per hex
- Total path cost
- Remaining Movement Points

This is important because terrain-based movement is intended to be a core tactical decision.

---

## 12. Attack Range

Each army has an attack range.

Examples:

- Melee: 1 hex
- Short ranged: 2–3 hexes
- Longbow: 4–5 hexes
- Horse Archer: 3–4 hexes

Range should be shown clearly during targeting.

---

## 13. Combat Resolution

A simplified combat model:

**Base Damage**

modified by:

- Attacker Attack
- Defender Defense
- Armor
- Unit matchup
- Terrain
- Ability
- Status effect
- Charge
- Other temporary modifiers

The combat formula should be tuned through prototype testing.

The system must avoid excessive hidden modifiers.

---

## 14. Counter System

Counter relationships are a core mechanic.

Examples:

### Spear vs Cavalry

Spears gain a significant advantage against charging cavalry.

### Cavalry vs Ranged

Cavalry can rapidly close distance and punish exposed ranged units.

### Ranged vs Slow Infantry

Ranged units can exploit slow movement.

### Heavy Infantry vs Light Infantry

Heavy infantry can win direct engagements but may be vulnerable to mobility and ranged pressure.

Counters should be strong but not completely deterministic.

---

## 15. Charge

Heavy Cavalry should have a signature ability:

### Charge

If the cavalry moves a sufficient distance before attacking:

- Increased damage
- Potential knockback
- Stronger impact against vulnerable units

Charge should interact strongly with defensive spear mechanics.

---

## 16. Brace

Anti-cavalry units can have:

### Brace

The unit prepares for a cavalry attack.

If cavalry charges into a braced unit:

- Spear counterattack triggers
- Cavalry charge effectiveness is reduced
- Potential bonus damage to cavalry

This creates a direct prediction/counter interaction.

---

## 17. Ranged Combat

Ranged units should trade mobility and defense for attack range.

### Short Bow

High consistency and moderate range.

### Longbow

High range and strong damage but low defense.

### Crossbow

High damage with slower attack/reload.

### Heavy Crossbow

Very high damage with low mobility and long cooldown/reload.

---

## 18. Cooldowns

Abilities have cooldowns.

Example:

**Heavy Cavalry — Charge**

Cooldown: 2 rounds.

The UI must clearly communicate:

- Ability ready
- Cooldown remaining
- Ability target area
- Expected effect

Cooldown management is intended to create tactical timing decisions.

---

## 19. Death

When an army reaches 0 HP:

- It is removed from the battlefield.
- Its space becomes available.
- Relevant death effects trigger.
- The player loses that tactical option for the remainder of the match.

---

## 20. Victory Conditions

Primary:

> Defeat all opposing armies.

Secondary future mode:

> Control objective hexes and accumulate Victory Points.

The objective system is important for preventing passive ranged strategies and creating reasons to move.

---

## 21. Draw / Time Limit

If the battle reaches the maximum duration:

1. Evaluate remaining armies.
2. Evaluate objective control if applicable.
3. Calculate Victory Points if the map uses them.
4. Determine the winner.

The exact tiebreak formula should be transparent to players.

---

## 22. PvE Bot

The bot uses the same battlefield rules as players.

### Easy

- Basic movement
- Basic attacks
- Limited tactical planning
- Few advanced counters

### Medium

- Recognizes obvious counters
- Uses basic positioning
- Uses abilities

### Hard

- Better target selection
- Flanking
- Cooldown management
- Terrain awareness
- Counter strategy

### Very Hard

- Strong prediction
- Advanced positioning
- Baiting
- Counter-attacks
- Efficient ability timing
- Army composition awareness

Difficulty should primarily improve decision quality rather than simply inflate statistics.

---

## 23. PvP Matchmaking

Ranked matchmaking should use a competitive rating.

Possible inputs:

- MMR / rating
- Current rank
- Match result
- Optional party restrictions
- Connection/region constraints

Army level should not be the primary matchmaking metric.

---

## 24. Private PvP

A player can create a private battle.

The server generates an invitation/session.

The invited player joins the same private lobby.

Private match settings may include:

- Map
- Battle rules
- Optional ranked/unranked mode

---

## 25. Server Architecture Principles

The server is authoritative for all important battle state.

Client:

- Displays battlefield
- Sends player commands
- Predicts UI where appropriate
- Displays results

Server:

- Owns match state
- Validates commands
- Resolves combat
- Controls timers
- Generates rewards
- Stores results

This prevents basic client manipulation of combat or progression.

---

## 26. Battle State

A match state should contain at minimum:

- Match ID
- Map ID
- Turn number
- Phase
- Turn deadline
- Player IDs
- Army IDs
- Army positions
- HP
- Status effects
- Cooldowns
- Submitted actions
- Initiative information
- Victory state

---

## 27. Battle Result

The server produces a final result:

- Winner
- Loser
- Match duration
- Units lost
- Damage dealt
- Rewards
- Rating changes
- PvE progress where applicable

The result is saved to persistent player data/history.

---

## 28. Battle Design Goals

Every battle should create moments such as:

> “He moved the cavalry there, so I need to pull my archer back.”

> “If I use Charge now, his Spearman can Brace.”

> “I can bait his counter ability, then attack next round.”

The desired experience is **prediction, positioning, and counter-play**, not simply statistical comparison.

---

## Formulas

- **Initiative Resolution Priority**:
  $$\text{PriorityScore} = \text{Initiative}_{\text{base}} + \text{Bonus}_{\text{ability}} + \text{Bonus}_{\text{charge}}$$
- **Path Cost Calculation**:
  $$\text{Cost}_{\text{path}} = \sum_{h \in \text{path}} \text{Cost}_{\text{terrain}}(h, \text{UnitCategory})$$
- **Simultaneous Combat Damage**:
  $$\text{Damage}(A \to B) = \text{ATK}_A \times \frac{100}{100 + \text{DEF}_B} \times \text{CounterMultiplier}$$

---

## Edge Cases

- **Collision in Movement**: If two opposing units move to the same destination hex during simultaneous resolution, the unit with higher Initiative claims the hex; the lower Initiative unit stops at the preceding hex along its path.
- **Target Destroyed Before Action**: If unit A targets unit B, but unit B is destroyed earlier in the initiative sequence by unit C, unit A's action fails and AP is consumed.
- **Client Desync / Invalid Action**: If client submits illegal AP sum (> 10 AP) or illegal hex movement, server rejects the payload and defaults unit to `Wait`.

---

## Dependencies

- [game-concept.md](file:///f:/prototype/hexastreragy/design/gdd/game-concept.md) — AP budget (10 AP), 10s timer, high-level game modes.
- [army-system.md](file:///f:/prototype/hexastreragy/design/gdd/army-system.md) — Army statistics, terrain movement cost matrix, unit counter matrix.

---

## Tuning Knobs

- `PLANNING_WINDOW_SEC`: 10 seconds
- `MAX_AP_PER_ROUND`: 10 AP
- `DEFAULT_DEPLOY_ZONE_ROWS`: 2 rows per player
- `BOT_DECISION_DELAY_MS`: 1000 ms

---

## Acceptance Criteria

- [ ] Hex battlefield correctly computes movement costs according to terrain.
- [ ] Simultaneous Planning limits each player to 10 AP and 10 seconds per round.
- [ ] Server validates all actions authoritatively before resolving combat.
- [ ] Charge and Brace interactions execute according to prediction rules.
- [ ] Battle results are recorded persistently after victory/defeat evaluation.

