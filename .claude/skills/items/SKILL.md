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
- Extra proposal columns: its `weight`, and which of `maxQuantity` / `numberOfUses` / `container` it has.
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
  "weight": 0.1,
  "maxQuantity": 20
}
```

- `weight`: **required**; the MCP refuses an item without one. The weight of **one** item (a pile is `weight x quantity`, so arrows are 0.1 each, not 2 for a bundle of 20). A number, 0 or more, at most 2 decimals; one decimal is usually enough. The scale is pound-sized and the unit has no name yet, so just call it "weight". Calibrate against the existing items (read them, below) and these: a key or parchment 0.1, a medallion or empty pouch 0.5, a torch or pair of pants 1, a ragged tunic 2, a spear 4. A currency item is the exception: send `0` (see Currency items). Heavy armour does not exist yet; don't guess at it. Show the weight in the proposal for the owner to correct, and say it is a guess when it is.
- `maxQuantity`: only for things that **pile**: arrows, gold, lockpicks, throwing spears. A whole number, 2 or more; leave it out for a single item (never `1`). It is not charges: a wand with 100 charges is one thing with 100 uses (`numberOfUses`), while 100 arrows are 100 things in one pile.
- `numberOfUses`: how many times the thing can be used before it is gone; a whole number, 1 or more; leave it out for unlimited. A torch burns out, a wand has charges.
- `container`: `{ "capacity": n }` for a bag, pouch or quiver that holds other things, `capacity` 1 or more. `maxDepth` only if it may hold other containers: counting itself, so 2 holds a bag that holds items. Leave it out otherwise. The engine caps it at 3.
- `isQuestItem`: `true` only for a thing a quest needs the player to hold and hand in (the goblin head, a delivered letter), so the game can protect it from being dropped or deleted by accident. Set it only when the owner says it is a quest item, or the request is plainly about a quest object; **never send `false`** (absent means false). Weapons and armor carry the same flag.
- `isCurrency`: `true` only on a currency item (below); **never send `false`**.
- Don't send `stackable`: it is the retired predecessor of `maxQuantity`. Don't send `interactions`: using an item (a wand casting a spell) is a separate design that is deferred.

## Item, weapon or armor?

**Weapons are their own kind** with their own skill (the weapons skill): a sword, dagger, bow, club or spear is a weapon, not an item. Armor is its own kind too, with the armor skill: a helmet, boots, shield or ring is armor, not an item. Ammo (arrows, bolts, sling stones) stays a plain item. `items` holds all three kinds, so always filter `list_collection` by `kind`.

Plain items from before the split may still be weapons or clothes (the sandbox `SPEAR`, `RAGGED_CLOTHES`). Leave them alone and tell the owner.

## Currency items

Coins on the map are plain items marked as currency (DATA-MODEL.md 8, Trello [Currency 1]). Picking one up adds it to the character's money, not the inventory.

- There is **one item per currency**, and no others: `BRONZE`, `COPPER`, `IRON`, `SILVER`, `GOLD`, `PLATINUM`, lowest to highest. **The `id` is exactly that word**: the game matches on it, and the MCP refuses an `isCurrency` item with any other `id`. This overrides the usual freedom to pick an `id`. If one already exists, use it or fix it; don't make a second, and don't invent a new currency.
- Fields: `isCurrency: true`, `weight: 0` (currency has no weight), `maxQuantity: 1000000` (a pile is one placement with a `quantity`). No `numberOfUses`, `container`, `isQuestItem` or value: the rates live in code.
- Each looks distinct, with its own sprite.
- A bag of coins or a purse is an ordinary item, not a currency item.

```json
{
  "id": "SILVER", "kind": "item", "name": "Silver Coins",
  "description": "Small, bright coins stamped with a worn crown.",
  "glyph": { "symbol": "$", "color": "text-zinc-300", "bg": "bg-black" },
  "spriteId": "<the _id of its sprite>",
  "weight": 0,
  "maxQuantity": 1000000,
  "isCurrency": true
}
```

## What the model doesn't have

There is no category, price, damage, armour, slot, rarity or stat on an item, and you must not invent them, nor hide them in `name` or `description` ("+2 long sword, 1d8"). They depend on combat, classes and skills that don't exist yet, and are out of scope for the current milestone. When a request asks for them, create the item with the supported fields and say what you left out. Don't log it anywhere.

## Match what exists

Read the existing items before proposing: `list_collection` on the **real** server, `collection: items`, `filters: { kind: "item" }`. It is short. Keep colours in the same spirit as similar ones (keys are orange or yellow).

## Glyph conventions

A single symbol on `bg-black`, often an emoji, as the existing items do.

## Fixing one

An older item that still carries `stackable` loses it on replace, and the MCP says so in its warnings; that is fine.
