# HEX LEGION — Army Design

**Document:** Army / Unit System  
**Version:** 0.1  
**Status**: Designed  

---

## Overview

An Army is the basic collectible combat unit in HEX LEGION. A player owns individual armies in their persistent collection and selects up to five armies before a battle. Each army features a distinct class, role, rarity tier, level, XP, stats, movement range, attack range, signature ability, cooldown, counter relationships, and evolution state.

---

## Player Fantasy

Commanding diverse, specialized military contingents (Spearmen, Shield Infantry, Shock Cavalry, Longbow Snipers, Heavy Crossbows). Players feel like tactical generals orchestrating unit counter-play and terrain advantages on a 3-5 minute battle scale.

---

## Detailed Rules


An Army is the basic collectible combat unit in HEX LEGION.

A player owns individual armies in their persistent collection and selects up to five armies before a battle.

Each army has:

- Class
- Role
- Rarity / tier
- Level
- XP
- Stats
- Movement
- Attack range
- Abilities
- Cooldowns
- Counter relationships
- Evolution state

---

## 2. Army Design Philosophy

Every army must answer three questions immediately:

1. **What does this army do?**
2. **What does this army counter?**
3. **What counters this army?**

A new army should add a new tactical possibility rather than simply being a stronger version of an existing army.

---

## 3. Primary Army Classes

### Melee Infantry

Frontline and close-combat armies.

Initial candidates:

- Short Spear
- Long Spear
- Sword & Shield
- Spear & Shield
- Heavy Sword / Greatsword

### Cavalry

Mobile armies focused on flanking, pressure, and charge mechanics.

Initial candidates:

- Light Cavalry
- Heavy Cavalry
- Horse Archer

### Ranged

Long-distance damage armies.

Initial candidates:

- Short Bow
- Longbow
- Crossbow
- Heavy Crossbow

---

# 4. Core Army Stats

Each army should have a readable set of primary stats.

Movement is represented as **Movement Points (MP)** rather than a simple number of hexes.

The army's actual movement per turn depends on:

- Base Movement Points
- Terrain Movement Cost
- Movement modifiers
- Status effects
- Unit abilities

| Stat | Description |
|---|---|
| HP | Health |
| Attack | Base offensive power |
| Defense | Resistance to incoming damage |
| Movement | Base Movement Points available each round |
| Range | Attack range |
| Initiative | Resolution priority |
| Armor | Reduction against appropriate attacks |
| Ability | Special combat mechanic |
| Cooldown | Ability recovery time |

Additional stats may be introduced only when they create meaningful gameplay.

---

---

# 4.1. Initial Army Stat Table

The following values are the **initial prototype/balance values** for the first 12 armies.

These numbers are not final. They are intended to make the first playable prototype concrete enough to implement and test.

| Army | HP | ATK | DEF | Action Cost | Move MP | Range | Initiative | Role |
|---|---:|---:|---:|---:|---:|---:|---|
| Short Spear | 100 | 24 | 18 | 1 AP | 5 | 1 | 7 | Mobile Anti-Cavalry |
| Long Spear | 125 | 27 | 28 | 2 AP | 3 | 2 | 4 | Defensive Anti-Cavalry |
| Sword & Shield | 140 | 25 | 35 | 2 AP | 4 | 1 | 5 | Frontline |
| Spear & Shield | 150 | 23 | 40 | 2 AP | 3 | 2 | 4 | Defensive Anti-Cavalry |
| Heavy Sword | 130 | 42 | 24 | 2 AP | 3 | 1 | 3 | Heavy Melee |
| Light Cavalry | 90 | 30 | 16 | 2 AP | 6 | 1 | 9 | Flanker |
| Heavy Cavalry | 150 | 48 | 30 | 3 AP | 5 | 1 | 6 | Shock Cavalry |
| Horse Archer | 85 | 27 | 14 | 3 AP | 6 | 4 | 8 | Mobile Ranged |
| Short Bow | 75 | 25 | 12 | 1 AP | 4 | 3 | 6 | Ranged DPS |
| Longbow | 70 | 38 | 10 | 2 AP | 3 | 5 | 5 | Long Range |
| Crossbow | 85 | 43 | 15 | 2 AP | 3 | 3 | 4 | Anti-Armor |
| Heavy Crossbow | 95 | 58 | 12 | 3 AP | 2 | 4 | 2 | Heavy Ranged |

### Stat Interpretation

**HP** — Total health before the army is destroyed.

**ATK** — Base attack power before matchup, terrain, ability, armor, and other modifiers.

**DEF** — Base defensive value.

**Move MP** — Movement Points available during each round before terrain and status modifiers.

**Range** — Maximum attack distance in hexes.

**Initiative** — Used when the server resolves simultaneous actions. Higher initiative generally resolves earlier, subject to special abilities and reaction rules.

### Intended Balance Relationships

The initial values intentionally create different trade-offs:

- **Heavy Cavalry** has high HP, ATK, and DEF but is expensive in movement through difficult terrain and is vulnerable to prepared anti-cavalry.
- **Light Cavalry** has the highest mobility but low durability.
- **Long Spear / Spear & Shield** are slower but specialize in controlling cavalry approaches.
- **Longbow** has exceptional range and damage but very low DEF.
- **Heavy Crossbow** has the highest single-hit ATK but the lowest movement and initiative.
- **Sword & Shield** is designed as the baseline general-purpose unit.
- **Horse Archer** trades raw damage for mobility and range.

### Important Balance Rule

These values should **not** be treated as permanent progression values.

The development team should first balance the **Level 1 baseline** in normalized battles.

Only after the core matchup is fun and understandable should level scaling, rarity, and evolution modify the numbers.


# 4.1. Action Cost System

Every army has an **Action Cost (AP Cost)**.

The player receives **10 Action Points per round**.

When an army is assigned a primary action, its Action Cost is consumed from that 10 AP budget.

### Initial Action Cost Table

| Army | Action Cost |
|---|---:|
| Short Spear | 1 AP |
| Long Spear | 2 AP |
| Sword & Shield | 2 AP |
| Spear & Shield | 2 AP |
| Heavy Sword | 2 AP |
| Light Cavalry | 2 AP |
| Heavy Cavalry | 3 AP |
| Horse Archer | 3 AP |
| Short Bow | 1 AP |
| Longbow | 2 AP |
| Crossbow | 2 AP |
| Heavy Crossbow | 3 AP |

### Action Cost Philosophy

Action Cost represents the **strategic weight of activating an army**, not the distance it moves.

General rule:

- Weak / short-range / low-impact armies → lower AP Cost
- Standard armies → medium AP Cost
- Strong / mobile / high-impact armies → higher AP Cost

### Example

If a player tries to activate:

- Short Spear = 1 AP
- Sword & Shield = 2 AP
- Heavy Cavalry = 3 AP
- Longbow = 2 AP
- Heavy Crossbow = 3 AP

Total:

**11 AP**

This is illegal because the player has only 10 AP.

The player must leave at least one army inactive or change the combination.

### AP vs MP

These are deliberately separate systems.

**AP** answers:

> “How many armies can I activate this round?”

**MP** answers:

> “How far can an activated army move?”

Example:

> Heavy Cavalry = **3 AP + 5 MP**

Activating the unit costs 3 AP. Its movement can then use up to 5 MP, with terrain modifying the cost of each hex.

### No AP Carryover

Unused AP normally disappears at the end of the round.

Every new round begins with:

**10 AP**

# 4.1. Terrain Movement System

Terrain is part of the Army's tactical identity.

The same terrain should not affect every army equally.

Each terrain type has a **Movement Cost** for each army category.

### Initial Movement Cost Matrix

| Terrain | Infantry | Heavy Infantry | Light Cavalry | Heavy Cavalry | Ranged |
|---|---:|---:|---:|---:|---:|
| Normal Ground | 1 | 1 | 1 | 1 | 1 |
| Road | 1 | 1 | 1 | 1 | 1 |
| Forest | 2 | 2–3 | 2 | 3 | 2 |
| High Ground | 1 | 1 | 2 | 2 | 1 |
| Ruins | 1–2 | 2 | 2 | 2 | 1–2 |
| Mountain | Impassable | Impassable | Impassable | Impassable | Impassable |
| Water | Impassable | Impassable | Impassable | Impassable | Impassable |

This is a starting balance table and should be tuned through prototype testing.

### Movement Example

A unit with:

**5 Movement Points**

travels through:

- Road = 1
- Road = 1
- Normal Ground = 1
- Forest = 2

Total:

**5 Movement Points**

The unit can complete the route.

A Heavy Cavalry unit with the same 5 Movement Points may not be able to complete that route if the Forest costs 3 Movement Points for Heavy Cavalry.

### Tactical Consequences

Terrain creates different strategic routes:

**Road**
- Fastest route
- Good for reinforcement
- Good for cavalry rotation

**Forest**
- Slows cavalry
- Creates defensive opportunities
- Can protect infantry from direct cavalry pressure

**High Ground**
- Valuable for ranged units
- May be worth taking even if the route is longer

**Ruins**
- Defensive strongpoint
- Useful around objectives

### Design Principle

Terrain should create **trade-offs**, not simply bonuses.

A player may choose:

> Short route through Forest

or:

> Longer route through Road.

A faster route is not always the safest route.


# 5. Short Spear
### Prototype Stats

- HP: 100
- ATK: 24
- DEF: 18
- Movement: 5 MP
- Range: 1
- Initiative: 7
- Ability Cooldown: 2 rounds



### Role

Mobile anti-cavalry infantry.

### Strengths

- High base movement
- Relatively efficient movement through difficult terrain
- Good against light cavalry
- Can rapidly reposition
- Good for protecting ranged units

### Weaknesses

- Lower durability than shield infantry
- Vulnerable to sustained ranged fire
- Less effective against heavy frontline infantry

### Signature Ability

**Spear Counter**

Receives a bonus against cavalry entering melee range.

---

# 6. Long Spear
### Prototype Stats

- HP: 125
- ATK: 27
- DEF: 28
- Movement: 3 MP
- Range: 2
- Initiative: 4
- Ability Cooldown: 2 rounds



### Role

Defensive anti-cavalry.

### Strengths

- Long melee reach
- Strong anti-cavalry
- Efficient at holding difficult terrain
- High defensive value
- Controls approaches

### Weaknesses

- Low movement
- Vulnerable to flanking
- Vulnerable to ranged attacks

### Signature Ability

**Brace**

Prepares for incoming cavalry.

A charging cavalry unit attacking a braced Long Spear receives a strong counter effect.

---

# 7. Sword & Shield
### Prototype Stats

- HP: 140
- ATK: 25
- DEF: 35
- Movement: 4 MP
- Range: 1
- Initiative: 5
- Ability Cooldown: 2 rounds



### Role

General-purpose frontline.

### Strengths

- Good defense
- Reliable melee combat
- Easy to use
- Good for holding objectives

### Weaknesses

- Limited mobility
- Limited range
- Can be kited by ranged units

### Signature Ability

**Shield Wall**

Receives a defensive bonus when positioned appropriately with allied shield infantry.

---

# 8. Spear & Shield
### Prototype Stats

- HP: 150
- ATK: 23
- DEF: 40
- Movement: 3 MP
- Range: 2
- Initiative: 4
- Ability Cooldown: 3 rounds



### Role

Defensive anti-cavalry frontline.

### Strengths

- High defense
- Strong cavalry counter
- Excellent at holding a line

### Weaknesses

- Low movement
- Vulnerable to ranged attacks
- Less effective when isolated

### Signature Ability

**Defensive Formation**

Gain additional defense while maintaining a suitable formation.

---

# 9. Heavy Sword / Greatsword
### Prototype Stats

- HP: 130
- ATK: 42
- DEF: 24
- Movement: 3 MP
- Range: 1
- Initiative: 3
- Ability Cooldown: 2 rounds



### Role

Heavy melee damage.

### Strengths

- High melee damage
- Effective against lighter infantry
- Strong breakthrough unit

### Weaknesses

- Low movement
- Vulnerable to ranged fire
- Vulnerable to mobility-based strategies

### Signature Ability

**Heavy Strike**

A powerful attack with a meaningful cooldown.

---

# 10. Light Cavalry
### Prototype Stats

- HP: 90
- ATK: 30
- DEF: 16
- Movement: 6 MP
- Range: 1
- Initiative: 9
- Ability Cooldown: 2 rounds



### Role

Fast flanker.

### Strengths

- Very high base movement
- Excellent movement on open ground and roads
- Strong against exposed ranged units
- Excellent for flanking
- Can exploit weak positions

### Weaknesses

- Lower defense
- Vulnerable to spears
- Poor frontal engagement against defensive infantry

### Signature Ability

**Rapid Charge**

Gain an offensive bonus after sufficient movement.

---

# 11. Heavy Cavalry
### Prototype Stats

- HP: 150
- ATK: 48
- DEF: 30
- Movement: 5 MP
- Range: 1
- Initiative: 6
- Ability Cooldown: 3 rounds



### Role

Heavy shock cavalry.

### Strengths

- High damage
- High mobility on open terrain
- Strong at choosing engagement routes
- Strong charge
- Can break vulnerable formations

### Weaknesses

- Vulnerable to prepared spear units
- Expensive/high-value target
- Poor when trapped

### Signature Ability

**Charge**

If sufficient movement is performed before attack:

- Increased damage
- Potential knockback
- Increased impact against exposed units

---

# 12. Horse Archer
### Prototype Stats

- HP: 85
- ATK: 27
- DEF: 14
- Movement: 6 MP
- Range: 4
- Initiative: 8
- Ability Cooldown: 2 rounds



### Role

Mobile ranged harassment.

### Strengths

- Very high mobility
- Ranged attack
- Excellent at kiting
- Strong against slow armies

### Weaknesses

- Low defense
- Vulnerable when trapped
- Lower direct damage than dedicated ranged units

### Signature Ability

**Shoot & Retreat**

Allows the unit to maintain distance through movement-oriented gameplay.

---

# 13. Short Bow
### Prototype Stats

- HP: 75
- ATK: 25
- DEF: 12
- Movement: 4 MP
- Range: 3
- Initiative: 6
- Ability Cooldown: 2 rounds



### Role

Basic ranged DPS.

### Strengths

- Reliable damage
- Good fire rate
- Moderate range
- Easy to understand

### Weaknesses

- Low defense
- Vulnerable to cavalry
- Requires protection

### Signature Ability

**Rapid Volley**

Temporarily increases ranged pressure.

---

# 14. Longbow
### Prototype Stats

- HP: 70
- ATK: 38
- DEF: 10
- Movement: 3 MP
- Range: 5
- Initiative: 5
- Ability Cooldown: 2 rounds



### Role

Long-range sniper.

### Strengths

- Very high range
- High damage
- Excellent at punishing exposed targets

### Weaknesses

- Very low defense
- Low mobility
- Vulnerable to cavalry

### Signature Ability

**Volley**

After remaining stationary/preparing, the next attack gains an offensive bonus.

---

# 15. Crossbow
### Prototype Stats

- HP: 85
- ATK: 43
- DEF: 15
- Movement: 3 MP
- Range: 3
- Initiative: 4
- Ability Cooldown: 2 rounds



### Role

High-damage ranged unit.

### Strengths

- High single-target damage
- Strong against armored targets
- Moderate range

### Weaknesses

- Slower attack cycle
- Vulnerable at close range

### Signature Ability

**Armor-Piercing Shot**

Ignores part of the target's armor/defense.

---

# 16. Heavy Crossbow
### Prototype Stats

- HP: 95
- ATK: 58
- DEF: 12
- Movement: 2 MP
- Range: 4
- Initiative: 2
- Ability Cooldown: 3 rounds



### Role

Heavy ranged damage.

### Strengths

- Very high damage
- Strong armor penetration
- Excellent against heavy units

### Weaknesses

- Very low mobility
- Long reload/cooldown
- Extremely vulnerable to flanking

### Signature Ability

**Heavy Bolt**

A powerful attack with a long cooldown.

---

# 17. Army Counter Matrix

The initial counter system should follow understandable relationships.

| Army Type | Strong Against | Weak Against |
|---|---|---|
| Short Spear | Light Cavalry | Ranged / Heavy Infantry |
| Long Spear | Cavalry | Ranged / Flank |
| Sword & Shield | General frontline | Heavy damage / Ranged |
| Spear & Shield | Cavalry | Ranged / Flank |
| Heavy Sword | Light infantry | Cavalry / Ranged |
| Light Cavalry | Ranged / Exposed units | Spears |
| Heavy Cavalry | Ranged / Weak frontline | Braced Spears |
| Horse Archer | Slow units | Fast cavalry / Traps |
| Short Bow | Light targets | Cavalry |
| Longbow | Exposed targets | Cavalry / Flank |
| Crossbow | Armored units | Fast melee |
| Heavy Crossbow | Heavy units | Fast flankers |

This matrix is a starting point for prototyping, not a final balance table.

---

# 18. Army Rarity

Proposed rarity tiers:

- Common
- Rare
- Epic
- Legendary

Rarity should primarily communicate:

- Collection value
- Gameplay complexity
- Unique mechanics
- Long-term investment

Rarity should not make an army automatically unbeatable.

---

# 19. Army Level

Each owned army has an individual level.

Level progression can improve appropriate base statistics.

Example:

**Longbow**

Level 1 → Level 2 → Level 3 → ... → Max Level

The exact stat growth curve must be tuned during balance testing.

---

# 20. Army EXP

Players gain Army EXP through:

- Duplicate army pulls
- Rewards
- EXP cards
- Other progression systems

Duplicate collection results should always have useful progression value.

---

# 21. Evolution

When an army reaches the maximum level of its current rarity/tier, the player can evolve it.

Evolution can provide:

- Higher level cap
- Increased base stats
- New ability behavior
- Cosmetic upgrade
- New visual effects
- New progression tier

Evolution should be meaningful without invalidating the player's existing investment.

---

# 22. Gacha

Winning a battle can grant a gacha opportunity.

Possible outcomes:

### New Army

Adds a new unit to the collection.

### Duplicate Army

Converted into Army EXP or equivalent progression material.

### EXP Card

Used to level a selected army.

### Evolution Material

Used for evolution.

---

# 23. Collection

The Army Collection screen should allow players to:

- Browse owned armies
- See locked armies
- Inspect stats
- Inspect abilities
- Inspect counters
- Level armies
- Evolve armies
- Add armies to a battle deck
- Compare armies

---

# 24. Army Loadout

A battle loadout contains:

**Maximum 5 armies**

The player can save multiple loadouts/builds.

Example:

### Anti-Cavalry

- Long Spear
- Spear & Shield
- Sword & Shield
- Longbow
- Crossbow

### Fast Attack

- Light Cavalry
- Heavy Cavalry
- Horse Archer
- Short Spear
- Short Bow

---

# 25. Army Synergy

Future armies should introduce mechanics that reward combinations.

Examples:

### Shield Formation

Multiple shield infantry together gain defensive bonuses.

### Cavalry Wing

Multiple cavalry units gain mobility or charge synergy.

### Ranged Screen

Frontline units protect ranged units.

### Flanking Bonus

Attacking from a side/rear position creates additional damage.

Synergy should reward strategy without forcing one mandatory meta composition.

---

# 26. Army Design Rules

When creating a new army:

### Rule 1

Give it one clear battlefield identity.

### Rule 2

Give it at least one meaningful strength.

### Rule 3

Give it a meaningful weakness.

### Rule 4

Give it a counter.

### Rule 5

Give the player a reason to choose it over another army.

### Rule 6

Avoid creating units that are simply:

> “The same unit but with +20% stats.”

---

# 27. Future Army Expansion

Future unit categories can include:

### Infantry

- Axemen
- Pikemen
- Spearmen
- Swordsmen
- Heavy Infantry

### Cavalry

- Scout Cavalry
- Heavy Cavalry
- Lancer
- Horse Archer
- Mounted Spearman

### Ranged

- Short Bow
- Longbow
- Crossbow
- Heavy Crossbow
- Siege Bow

### Special

Future special armies may introduce:

- Siege
- Support
- Healing
- Buffing
- Debuffing
- Traps
- Area control

Special units should be introduced carefully because they can significantly increase system complexity.

---

# 28. Long-Term Army Design Goal

The final army roster should create a strategic ecosystem where:

> No single army is the best in every situation.

Instead:

**Army A beats Army B**

but:

**Army B can beat Army C**

and:

**Army C can punish Army A**

while terrain, positioning, timing, and player decisions can change the result.

The goal is to create a constantly evolving tactical meta based on **composition + counter + execution**, rather than raw numerical power.

---

## Formulas

- **Movement Cost Calculation**:
  $$MP_{\text{remaining}} = MP_{\text{base}} - \sum_{h \in \text{path}} \text{Cost}_{\text{terrain}}(h, \text{ArmyClass})$$
- **Damage Calculation**:
  $$\text{Damage} = \max\left(1, (\text{ATK}_{\text{attacker}} - \text{DEF}_{\text{defender}}) \times \text{Multiplier}_{\text{counter}} \times \text{Modifier}_{\text{terrain/ability}}\right)$$
- **Level Stat Scaling**:
  $$\text{Stat}_{\text{level } L} = \text{Stat}_{\text{base}} \times \left(1 + \text{GrowthRate} \times (L - 1)\right)$$

---

## Edge Cases

- **Partial Movement Exhaustion**: If a unit enters a hex where remaining $MP < \text{Cost}_{\text{terrain}}$, it cannot enter that hex during the current turn.
- **Simultaneous Target Elimination**: If two units destroy each other in the same turn due to simultaneous resolution, both units die at the end of the Resolve Phase.
- **Brace Counter against Charge**: If Heavy Cavalry charges into a Long Spear unit currently in `Brace` state, Charge knockback/bonus is canceled and Long Spear deals $2.0\times$ counter damage.

---

## Dependencies

- [game-concept.md](file:///f:/prototype/hexastreragy/design/gdd/game-concept.md) — High-level game goals and AP budget definitions.
- [battle-system.md](file:///f:/prototype/hexastreragy/design/gdd/battle-system.md) — Grid movement rules, combat resolution order, and initiative systems.

---

## Tuning Knobs

- `SHORT_SPEAR_HP`: 100, `ATK`: 24, `DEF`: 18, `MP`: 5, `RANGE`: 1, `AP`: 1
- `HEAVY_CAVALRY_HP`: 150, `ATK`: 48, `DEF`: 30, `MP`: 5, `RANGE`: 1, `AP`: 3
- `LONGBOW_HP`: 70, `ATK`: 38, `DEF`: 10, `MP`: 3, `RANGE`: 5, `AP`: 2
- `FOREST_CAVALRY_COST`: 3 MP, `INFANTRY_FOREST_COST`: 2 MP

---

## Acceptance Criteria

- [ ] All 12 initial armies have defined stats, roles, AP costs, MP values, and signature abilities.
- [ ] Terrain movement costs correctly penalize Cavalry in Forest and Ruins.
- [ ] Counter relationships operate as specified in the Counter Matrix.
- [ ] Army EXP, Leveling, and Evolution pipelines support duplicate unit conversions.

