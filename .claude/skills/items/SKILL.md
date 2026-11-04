---
name: items
description: Make, redo or adjust Ragged Crown item definitions (things the player can pick up and carry, such as a spear, arrows, a torch or a pouch) in the sandbox so the owner can review them. Use when asked to create or tweak items.
---

# Items

An item is something the player picks up and keeps in their inventory, which is what separates it from an object (DATA-MODEL.md 1.3). Bumping into one on the map picks it up; that is engine behaviour, not something you author. The item model is **deliberately minimal** while the inventory is designed, so most of this skill is what not to add. The owner judges the result; you create, they review.

## Where you may write

Sandbox only: `mcp__ragged-crown-sandbox__create_doc` and `replace_doc`, collection `items`, `kind: "item"`. The real server (`mcp__ragged-crown__*`) is read-only. Nothing here reaches the real database yet (def promotion is Skills 11), so an approved item is re-created by the owner in the real UI.

If the sandbox looks stale next to the real database (real items or sprites missing), say so before a big batch: `make sandbox-refresh` rebuilds it. Run it as a dry run only; `APPLY=1` deletes the sandbox volume and needs the owner's go-ahead.

## Item or object?

Items are carried; objects stand on the map. A spear, a torch, a key, a bag of coins: items. A fireplace, a table, a plate on a shelf, a trophy mounted on a wall: objects, and there is no object skill yet. When a request mixes them ("things in a medieval hut"), propose only the items, and list the rest as objects for later instead of making them items.

## Document

```json
{
  "id": "ARROWS", "kind": "item", "name": "Arrows",
  "description": "Goose-feathered arrows, bundled for a hunting bow.",
  "glyph": { "symbol": "↑", "color": "text-amber-300", "bg": "bg-black" },
  "maxQuantity": 20
}
```

- `id`: required (the MCP refuses an item without one). Written like a constant: uppercase full words joined by underscores (`TOWN_GUARD_SPEAR`), not copied from the `name`. No abbreviations. Test documents start with `ZZ_`. Check it is free on **both** servers (`list_collection`, `collection: items`, `filters: { id }`, `limit: 1`), because promotion matches on `id` and the sandbox can be behind the real database. If taken, say so and pick another.
- `name`: short human label. `description`: one plain sentence of flavour. It is not a place for stats.
- `maxQuantity`: only for things that **pile**: arrows, gold, lockpicks, throwing spears. A whole number, 2 or more; leave it out for a single item (never `1`). It is not charges: a wand with 100 charges is one thing with 100 uses (`numberOfUses`), while 100 arrows are 100 things in one pile.
- `numberOfUses`: how many times the thing can be used before it is gone; a whole number, 1 or more; leave it out for unlimited. A torch burns out, a wand has charges.
- `container`: `{ "capacity": n }` for a bag, pouch or quiver that holds other things, `capacity` 1 or more. `maxDepth` only if it may hold other containers: counting itself, so 2 holds a bag that holds items. Leave it out otherwise. The engine caps it at 3.
- `spriteId`: optional, a sprite's `_id`. See Sprites.
- Don't send `stackable`: it is the retired predecessor of `maxQuantity`. Don't send `interactions`: using an item (a wand casting a spell) is a separate design that is deferred.
- A misspelt or unknown top-level field is dropped, and the MCP names it in a `Warnings:` block after the stored copy: read it, and fix the spelling.

## What the model doesn't have

There is no category, weight, price, damage, armour, slot, rarity or stat on an item, and you must not invent them, nor hide them in `name` or `description` ("+2 long sword, 1d8"). They depend on combat, classes and skills that don't exist yet (Trello [Inventory 1]). When a request asks for them, create the item with the supported fields and **say what you left out**, so the owner can log it on that card. A "knife" or "cloth tunic" is just a named item with a glyph.

Gold is a plain item with a large `maxQuantity` until currency is designed.

## Glyph

Required; shown when there is no sprite and as the backfill if the sprite goes missing.

- `symbol`: 1 or 2 characters, counted as characters and not bytes, so an emoji is one and up to two pass. Existing items use a single symbol on a black background, often an emoji.
- `bg`: `bg-black`, as the existing items do.
- `color` must come from the palette, because anything else isn't in the safelist and renders uncoloured (in the game for certain). The MCP refuses other classes, so check against this list before writing:
  - `text-white`, `text-black`, or `text-<hue>-<300|400|500|600>` with an optional `/70`;
  - hues: zinc, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, violet, purple, pink, rose, stone.
  - If `frontend/src/lib/types/colorPalette.ts` ever differs, the file wins.

## Match what exists

Read the existing items before proposing: `list_collection` on the **real** server, `collection: items`. It is short. Reuse an existing item instead of a near copy ("`TREASURE_KEY` already exists; reusing it"), and keep colours in the same spirit as similar ones (keys are orange or yellow).

## Sprites

Every new item gets a sprite (owner, 2026-11-04). The MCP checks the sprite exists and is an item sprite, and refuses the item otherwise. For each item:

1. **Look for a suitable existing sprite** first, on both servers (names only; the full documents are long):
   ```bash
   for p in 8080 8081; do curl -s "localhost:$p/collection/sprites?category=item" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(d=>d.id+" ("+d.name+")").join(", ")))'; done
   ```
   Suitable means it really is that thing, not merely close (a rake is not a spear). Reusing one is fine, for example one sprite for two variants; say which and why. Use that sprite's `_id` from the server you are writing to (the sandbox).
2. **Otherwise draw a new one** with the sprites skill, category `item`, and read its `_id` from the create result. Match the existing item sprites in outline and colour use.
3. **Stop and have the owner approve the sprites in the sandbox UI before creating any item.** Redo one that isn't approved (same `id`) and ask again. Only then create the item with `spriteId`.

If the owner says an item needs no sprite, leave `spriteId` out.

## Batches

Cap: **10 items per request** (Skills 12). Over that, say so and propose the 10 most useful, or split it into rounds, each reviewed before the next.

1. Read the existing items, then **propose first**: a table of `id`, name, which of `maxQuantity` / `numberOfUses` / `container` it has, the sprite (reuse an existing one, new, or none), and a one-line reason it earns its place in the scene. Merge entries that differ only by name. Every entry needs a reason a player would pick it up or use it.
2. Wait for the owner to approve or trim the table. Then follow the Sprites steps: create the new sprites (capped at 10 too; render the batch side by side and check the style as a set) and stop for their review.
3. After the sprites are approved, create exactly the approved list of items.
4. Report the `id`s in the same order, with what you left out and any doubts. Review is in the sandbox UI (`pnpm dev:sandbox` in `frontend/`, on :3001, item definitions page).

A single item asked for by name needs no table, but it still goes through the Sprites steps before the item is created.

## Fixing one

`list_collection` with `filters: { id }` to get its `_id`, change what is wrong, and `replace_doc` with the **whole** document (PUT replaces everything). Keep the same `id` so the owner is still judging the same item. An older item that still carries `stackable` loses it on replace, and the MCP says so in its warnings; that is fine.

## Don't

- Don't write to the real server, or with no `id`.
- Don't invent fields, categories, stats or interactions, and don't put them in the text.
- Don't leave test items around; use `ZZ_`. There is no delete: cleanup is `make sandbox-reset`, which needs the owner's confirmation.
- Don't edit objects, zones or other defs that use an item.
