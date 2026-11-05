---
name: items
description: Make, redo or adjust Ragged Crown item definitions (things the player can pick up and carry, such as a spear, arrows, a torch or a pouch) in the sandbox so the owner can review them. Use when asked to create or tweak items.
---

# Items

**Read `.claude/skills/shared/RULES.md` first.** It holds the rules every creation skill follows: the hierarchy and reuse, where you may write, ids, glyphs, sprites, batches, fixing and what not to do. This file is only what is particular to items.

An item is something the player picks up and keeps in their inventory, which is what separates it from an object (DATA-MODEL.md 1.3). Bumping into one on the map picks it up; that is engine behaviour, not something you author. The item model is **deliberately minimal** while the inventory is designed, so most of this skill is what not to add.

- Collection: `items`, `kind: "item"`.
- Sprite category: `item`.
- Batch cap: the default, 10.
- Extra proposal columns: which of `maxQuantity` / `numberOfUses` / `container` it has.
- Sandbox UI page: item definitions.

## Item or object?

Items are carried; objects stand on the map. A spear, a torch, a key, a bag of coins: items. A fireplace, a table, a plate on a shelf, a trophy mounted on a wall: objects, which the objects skill makes. When a request mixes them ("things in a medieval hut"), propose the items here and list the rest as objects, instead of making them items.

## Document

```json
{
  "id": "ARROWS", "kind": "item", "name": "Arrows",
  "description": "Goose-feathered arrows, bundled for a hunting bow.",
  "glyph": { "symbol": "↑", "color": "text-amber-300", "bg": "bg-black" },
  "spriteId": "<the _id of its sprite>",
  "maxQuantity": 20
}
```

- `maxQuantity`: only for things that **pile**: arrows, gold, lockpicks, throwing spears. A whole number, 2 or more; leave it out for a single item (never `1`). It is not charges: a wand with 100 charges is one thing with 100 uses (`numberOfUses`), while 100 arrows are 100 things in one pile.
- `numberOfUses`: how many times the thing can be used before it is gone; a whole number, 1 or more; leave it out for unlimited. A torch burns out, a wand has charges.
- `container`: `{ "capacity": n }` for a bag, pouch or quiver that holds other things, `capacity` 1 or more. `maxDepth` only if it may hold other containers: counting itself, so 2 holds a bag that holds items. Leave it out otherwise. The engine caps it at 3.
- Don't send `stackable`: it is the retired predecessor of `maxQuantity`. Don't send `interactions`: using an item (a wand casting a spell) is a separate design that is deferred.

## What the model doesn't have

There is no category, weight, price, damage, armour, slot, rarity or stat on an item, and you must not invent them, nor hide them in `name` or `description` ("+2 long sword, 1d8"). They depend on combat, classes and skills that don't exist yet, and are out of scope for the current milestone. When a request asks for them, create the item with the supported fields and say what you left out. Don't log it anywhere. A "knife" or "cloth tunic" is just a named item with a glyph.

Gold is a plain item with a large `maxQuantity` until currency is designed.

## Match what exists

Read the existing items before proposing: `list_collection` on the **real** server, `collection: items`. It is short. Keep colours in the same spirit as similar ones (keys are orange or yellow).

## Glyph conventions

A single symbol on `bg-black`, often an emoji, as the existing items do.

## Fixing one

An older item that still carries `stackable` loses it on replace, and the MCP says so in its warnings; that is fine.
