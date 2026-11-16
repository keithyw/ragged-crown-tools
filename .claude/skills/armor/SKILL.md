---
name: armor
description: Make, redo or adjust Ragged Crown armor definitions (body armor, helmets, boots, gloves, shields, cloaks, rings and other things a character wears) in the sandbox so the owner can review them. Use when asked to create or tweak armor, including a whole set at once ("a set of leather armor", "plate armor").
---

# Armor

**Read `.claude/skills/shared/RULES.md` first.** It holds the rules every creation skill follows: the hierarchy and reuse, where you may write, ids, glyphs, sprites, batches, fixing and what not to do. This file is only what is particular to armor. The weapons skill is its closest neighbour; the flow is the same.

Armor is a def the player can carry **and wear**. It is its own kind, not a category of item (the decisions are on Trello [Inventory 1] and [Inventory 2]).

- Collection: `items`, `kind: "armor"`.
- Sprite category: `item` (there is no armor category).
- Batch cap: the default, 10.
- Extra proposal columns: `type` (the slot), `defenseValue`, `weight`, and the sprite plan (own, or shared with which piece).
- Sandbox UI page: Armor Definitions.

## Armor, weapon or item?

Armor is worn: it has a slot. A shield is armor (a hand slot), not a weapon. Jewelry (a ring, an amulet) is armor too, in its own slots. A sword or bow is a weapon (the weapons skill). Plain clothes with no protection (a ragged tunic, wool pants) are worn too, but the sandbox has them as plain **items** (`RAGGED_CLOTHES`, `WOOLPANTS`): leave those alone and tell the owner; a request for new clothes is armor with `defenseValue: 0` (see below).

## Document

```json
{
  "id": "CHAIN_MAIL", "kind": "armor", "name": "Chain mail",
  "description": "A shirt of interlocking steel rings.",
  "glyph": { "symbol": "🛡", "color": "text-zinc-300", "bg": "bg-black" },
  "spriteId": "<the _id of its sprite>",
  "type": "chest",
  "defenseValue": 50,
  "weight": 40
}
```

- `type`: **required**, exactly one value from `ARMOR_TYPES` in `frontend/src/lib/constants/gear.ts` (read the file; it wins over any list here). It is the **slot**: where the piece is worn. Today: head, chest, legs, hands, wrists, feet, shoulders, belt, cloak, shield, neck, ring, earring, brooch. Don't invent a slot: if a request needs one the list lacks, make what fits, say it is missing, and let the owner add it.
- `defenseValue`: **required**, a whole number, 0 or more, **no ceiling** (a character's total can get high, so values stay small and progressive). Use the starting table below and show it in the proposal for the owner to correct. No multipliers (owner, 2026-11-16).
- `weight`: **required**, the weight of **one** piece, pound-sized (the items skill has the scale). Show it in the proposal and say when it is a guess.
- `maxQuantity`, `numberOfUses`: leave out. No `interactions`, no `container`.

## Style is the name, not a field

The owner's lists mix two things: **where** it is worn (the `type`) and **how it is made** (leather, chain, plate). Only the slot is a field. The construction style lives in the name and `id`: `LEATHER_ARMOR`, `CHAIN_MAIL`, `PLATE_MAIL` are all `type: chest`. That redundancy is accepted (owner, 2026-11-14). A set is several slots in one style: a "leather set" is leather armor (chest), a leather cap (head), leather gloves (hands), leather boots (feet).

**Material, quality, magic and bonuses are instance data** ([Inventory 13], [Inventory 14]): no "Iron chain mail", "Shoddy helmet" or "+1 plate". Leather, chain and plate are construction styles in the base name and are fine; a metal or a grade in front of them is not. Strip those, say what you left out.

## What makes two pieces different defs

Differing in something the model holds (slot, `defenseValue`, `weight`), or in how they read at tile size. Give each piece its own sprite and share only where two truly read the same (a cap and a hood would). A chest piece, boots and gloves are always distinct.

### Starting values (simple and progressive)

Reference, not rules: show them in the proposal. The owner (2026-11-16): **no multipliers**, keep it simple and progressive: cloth 1, leather 2, and so on up the construction styles, one step each. The numbers are the same for every slot of a style (a cloth hat is as good as a cloth tunic); a piece may be one lower where it clearly covers less (a belt, sandals). Weights are pounds-sized guesses.

| Style | defenseValue |
| --- | --- |
| Cloth | 1 |
| Leather | 2 |
| Studded leather | 3 |
| Chain | 4 |
| Plate | 5 |

Weight guesses: cloth tunic 2, pants 1, hat 0.3, sandals 1, rope belt 0.3; leather armor 15, chain mail 40, plate mail 50; helmet 5, boots 4, gauntlets 3; small shield 5, large shield 10. The model has no stacking rule yet, so don't add the numbers up for the owner.

A shield blocks a second or two-handed weapon in the engine; that is an equip rule, not a field. Say nothing about it in the data.

## Never put these in the data

Left out, even when a request implies them: who may wear it (class restrictions, heavy armor for fighters only), rarity, damage-type resistances (lightning against metal), movement or spell penalties, material, quality, and named magic items. Create the plain piece and **say what you left out**; don't hide it in the description.

## Match what exists

Before proposing, read what is there, on **both** servers, `list_collection` with `filters: { kind: "armor" }` (the `items` collection holds items, weapons and armor, so always filter by kind). `id` is unique across all of `items`, so check a new `id` without the kind filter.

## Glyph conventions

A single symbol on `bg-black`. There is no one right emoji: `🛡` for shields and body armor, `👢` boots, `🧤` gloves, `💍` rings, `📿` necklaces, `🧥` cloaks and cloth. `text-zinc-300` for metal, `text-amber-600` for leather.

## Fixing one

As in RULES: read the whole document, change what is wrong, `replace_doc` with the whole thing. Keep `defenseValue` even when it is 0.
