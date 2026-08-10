# ADR-0003: Simultaneous Combat Resolution & Initiative Determinism

## Status
Accepted

## Date
2026-08-10

## Engine Compatibility
Web Canvas / HTML5 / TypeScript

## Context
In Simultaneous Planning, both players submit actions at the same time. The server must resolve actions deterministically when units move to the same space, attack each other, or activate conflicting abilities (e.g. Heavy Cavalry Charge vs Long Spear Brace).

## GDD Requirements Addressed
- TR-army-003: Unit Counter Matrix
- TR-army-004: Signature Abilities (Charge vs Brace mechanics)
- TR-battle-003: Turn Resolution Sequence & Initiative Ordering

## Decision
1. **Initiative Ordering**: Actions are sorted by `PriorityScore`:
   $$\text{PriorityScore} = \text{Initiative}_{\text{base}} + \text{Bonus}_{\text{ability}} + \text{Bonus}_{\text{charge}}$$
   High initiative units resolve movement and attacks earlier in the phase sequence.
2. **Charge vs Brace Resolution**:
   - If a Cavalry unit uses `Charge` into a target hex occupied by a Long Spear unit in `Brace` state, `Brace` counter-reaction triggers **before** the Charge damage hits.
   - Long Spear deals $2.0\times$ anti-cavalry damage, and Cavalry knockback/bonus is canceled.
3. **Collision Handling**: If two units attempt to occupy the same hex in the same round, the higher Initiative unit gains the hex; the lower Initiative unit stops at its previous hex.
4. **Simultaneous Damage Resolution**: Attacks occurring in the same Initiative tier apply damage simultaneously before checking unit death states.

## Consequences
- **Positive**: Predictable, strategic counter-play rewards prediction.
- **Positive**: Eliminates non-deterministic race conditions.
- **Negative**: Requires strict Initiative tier sorting before resolving damage.
