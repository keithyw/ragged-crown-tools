---
name: weapons
description: Make, redo or adjust Ragged Crown weapon definitions (swords, daggers, bows, spears, axes and other things a character wields) in the sandbox so the owner can review them. Use when asked to create or tweak weapons, including a whole type at once ("a set of swords", "the polearms").
---

# Weapons

**Read `.claude/skills/shared/RULES.md` first.** It holds the rules every creation skill follows: the hierarchy and reuse, where you may write, ids, glyphs, sprites, batches, fixing and what not to do. This file is only what is particular to weapons.

A weapon is a def the player can carry **and wield**. It is its own kind, not a category of item (DATA-MODEL.md is not updated yet; the decisions are on Trello [Inventory 1] and [Inventory 2]).

- Collection: `items`, `kind: "weapon"`.
- Sprite category: `item` (there is no weapon category).
- Batch cap: the default, 10.
- Extra proposal columns: `type`, damage (`1d8`), the flags it has, `weight`, and the sprite plan (own, or shared with which weapon).
- Sandbox UI page: Weapon Definitions.

## Weapon, item or armor?

A weapon is something you hit or shoot with. A sword, a sling, a club: weapons, made here. **Arrows, bolts and sling stones are items** (the items skill): ammo has no model yet. Shields, helmets and rings are armor, which has no skill yet ([Inventory 16]); say so and leave them out.

## Document

```json
{
  "id": "LONG_SWORD", "kind": "weapon", "name": "Long sword",
  "description": "A well-balanced steel sword with a straight double edge.",
  "glyph": { "symbol": "🗡", "color": "text-zinc-300", "bg": "bg-black" },
  "spriteId": "<the _id of its sprite>",
  "type": "sword",
  "damage": { "count": 1, "die": 8 },
  "weight": 4
}
```

- `type`: **required**, exactly one value from `WEAPON_TYPES` in `frontend/src/lib/constants/gear.ts` (read the file; it wins over any list in this skill). A broadsword, scimitar and bastard sword are all `sword`. Don't invent a type: if a request needs one the list lacks (a whip, a net), make what fits, say it is missing, and let the owner add it.
- `damage`: **required**. `count` is a whole number, 1 or more (almost always 1); `die` is one of 4, 6, 8, 10, 12, 20, 100. So 2d4 is `{ "count": 2, "die": 4 }`. No size-dependent damage (a large-target column), no bonuses: those are instance data.
- `weight`: **required**, the weight of **one**, pound-sized (RULES and the items skill have the scale). Use the AD&D table below as the starting point, show it in the proposal, and say when it is a guess.
- Flags, each only when true, **never `false`** (absent means false):
  - `isTwoHanded`: needs both hands (a two-handed sword, a great axe, a longbow).
  - `isMissile`: fires something (bows, slings, crossbows). They need ammo, which has no model yet; the ammo is a separate item.
  - `isThrown`: made to be thrown (a throwing dagger, a dart, a javelin).
- `maxQuantity`: only for things that pile, which for weapons means darts and similar thrown stacks. `numberOfUses`: leave out (no degradation). Don't send `interactions` or `container`.

## What makes two weapons different defs

A def is the **base weapon**. Two defs earn their places by differing in something the model holds, or by reading differently at tile size:

- **Damage** (a broadsword is 2d4 and a scimitar 1d8), **weight**, or a **flag**.
- **A distinct look.** The owner (2026-11-15): give each its own sprite, and share only where they truly read the same (a broadsword and a long sword; a dagger and a knife). A scimitar and a two-handed sword are always distinct.

Flavour matters to the owner too (a curved blade for a druid, a famous named sword much later), but that depends on things the model doesn't have yet. Don't pretend otherwise.

### Starting values (AD&D, small and medium targets)

Reference, not rules: show them in the proposal for the owner to correct.

| Weapon | type | damage | weight | flags |
| --- | --- | --- | --- | --- |
| Dagger | dagger | 1d4 | 1 | `isThrown` |
| Short sword | sword | 1d6 | 3 | |
| Rapier | sword | 1d6 | 3 | |
| Long sword | sword | 1d8 | 4 | |
| Scimitar | sword | 1d8 | 4 | |
| Broadsword | sword | 2d4 | 4 | |
| Bastard sword | sword | 1d8 | 6 | |
| Two-handed sword | sword | 1d10 | 15 | `isTwoHanded` |

A bastard sword can be held either way; the model has no "either", so it carries no flag. Say so.

## Never put these in the data

**Material, quality, magic and bonuses are instance data** ([Inventory 13], [Inventory 14]): there is no "Steel Long Sword", "Shoddy Dagger" or "+2 Sword" def. Strip them from the `id`, `name` and `description` and say what you left out. Likewise left out, even when a request implies them: who may wield it (class restrictions), rarity, damage types (slashing, piercing), modifiers, `requiredBy` (ammo) and a named magic item. Create the plain weapon and **say what you left out**; don't hide it in the description ("Slashing, fighters only").

## Match what exists

Before proposing, read what is there, on **both** servers, `list_collection` with `filters: { kind: "weapon" }` (the `items` collection also holds items and later armor, so always filter by kind). `id` is unique across all of `items`, so check a new `id` without the kind filter. Old plain-item weapons may still exist (the sandbox `SPEAR`): they are `kind: item`, so tell the owner rather than making a second one.

## Glyph conventions

A single symbol on `bg-black`: `🗡` for blades, `†` is also used. `text-zinc-300` for steel, `text-amber-*` for wood.

## Fixing one

As in RULES: read the whole document, change what is wrong, `replace_doc` with the whole thing. A flag that is on stays; one that is off stays out.
