---
name: objects
description: Make, redo or adjust Ragged Crown object definitions (solid objects such as a wall or a bar counter, and spaces such as a rug or fire, placed on the map) in the sandbox so the owner can review them. Use when asked to create or tweak objects, furniture, scenery or spaces. Does not create interactions.
---

# Objects

An object def is something placed on top of the terrain: scenery, furniture, a chest. It is one `kind: "object"`, told apart by `isSolid` (DATA-MODEL.md 1.4, 1.5). The owner judges the result; you create, they review.

**This skill does not create interactions** (dialogue, keys, effects, quest givers). A def made here is a body: it blocks, decorates or holds things, and does nothing when the player bumps it. When a request needs behaviour, create the body, say plainly what behaviour was left out, and let the owner add it in the interaction editor in the UI. Interactions get their own skill later (Trello [Skills 9], v2).

## Where you may write

Sandbox only: `mcp__ragged-crown-sandbox__create_doc` and `replace_doc`, collection `entities`, `kind: "object"`. The real server (`mcp__ragged-crown__*`) is read-only. Nothing here reaches the real database yet (def promotion is Skills 11), so an approved object is re-created by the owner in the real UI.

If the sandbox looks stale next to the real database (real objects or sprites missing), say so before a big batch: `make sandbox-refresh` rebuilds it. Run it as a dry run only; `APPLY=1` deletes the sandbox volume and needs the owner's go-ahead.

## Object, space or item?

- **Solid object** (`isSolid: true`): the player cannot stand there and bumping it costs no movement. A wall, a bar counter, a bookshelf, a barrel.
- **Space** (`isSolid: false`): the player can stand on it, and the player's icon is drawn on top. A rug, a bed, fire, a puddle. Its sprite should look flat, like something on the floor.
- **Item**: carried by the player (a spear, a torch, a key). That is the items skill, not this one. A plate on a shelf is scenery, so an object; a goblin head the player takes is an item.
- Creatures and portals are also stored in `entities` but are not made here; leave `kind: "object"` only.

## Document

```json
{
  "id": "BAR_COUNTER", "kind": "object", "name": "Bar counter",
  "description": "A long oak counter, ringed with old cup marks.",
  "glyph": { "symbol": "=", "color": "text-amber-500", "bg": "bg-black" },
  "spriteId": "<the _id of its sprite>",
  "isSolid": true
}
```

- `id`: required (the MCP refuses a def without one). Written like a constant: uppercase full words joined by underscores (`BAR_COUNTER`), not copied from the `name`. No abbreviations. Test documents start with `ZZ_`. `entities` also holds creatures and portals and `id` is unique across all of it, so check it is free on **both** servers without filtering by `kind` (`list_collection`, `collection: entities`, `filters: { id }`, `limit: 1`). If taken, say so and pick another.
- `name`: short human label. `description`: one plain sentence of flavour.
- `isSolid`: required, **always set it**, `true` or `false`.
- `moveCost`: spaces only. Leave it out for a solid object (the forms drop it) and leave it out for an ordinary space too, since it defaults to 1. Set it only when entering should be harder (quicksand, deep mud): a whole number, 0 or more.
- `numberOfUses`: how many times the thing can be used before it disappears; 1 or more; absent is unlimited. Nothing uses an object until it has interactions, so leave it out unless asked.
- `container`: `{ "capacity": n }` for a chest, barrel, cabinet or corpse that holds things, `capacity` 1 or more. `maxDepth` only if it may hold other containers, counting itself (2 holds a bag that holds items); the engine caps it at 3. Leave it out for anything that doesn't hold things.
- `spriteId`: a sprite's `_id`. See Sprites.
- Don't send `interactions`. Don't invent fields (category, room type, tags, weight, hit points).
- A misspelt or unknown top-level field is dropped, and the MCP names it in a `Warnings:` block after the stored copy: read it, and fix the spelling.

## Glyph

Required; shown when there is no sprite and as the backfill if the sprite goes missing.

- `symbol`: 1 or 2 characters, counted as characters and not bytes, so an emoji is one and up to two pass. Existing objects use a single symbol on a black background, often an emoji.
- `bg`: `bg-black`, as the existing objects do.
- `color` must come from the palette, because anything else isn't in the safelist and renders uncoloured (in the game for certain). The MCP refuses other classes, so check against this list before writing:
  - `text-white`, `text-black`, or `text-<hue>-<300|400|500|600>` with an optional `/70`;
  - hues: zinc, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, violet, purple, pink, rose, stone.
  - If `frontend/src/lib/types/colorPalette.ts` ever differs, the file wins.

## Match what exists

Read the existing objects before proposing, with names only (the full documents are long):

```bash
curl -s "localhost:8080/collection/entities?kind=object" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(d=>d.id+" ("+d.name+", "+(d.isSolid?"solid":"space")+")").join(", ")))'
```

Reuse an existing def instead of a near copy ("`TABLE` already exists; reusing it"). Several object sprites exist without a matching def, so look at those before drawing.

## Sprites

Every new object gets a sprite (owner, 2026-11-04). The MCP checks the sprite exists and is an object sprite, and refuses the def otherwise. For each object:

1. **Look for a suitable existing sprite** first, on both servers (names only; the full documents are long):
   ```bash
   for p in 8080 8081; do curl -s "localhost:$p/collection/sprites?category=object" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(d=>d.id+" ("+d.name+")").join(", ")))'; done
   ```
   Suitable means it really is that thing, not merely close (a dining table is not a bar counter). Reusing one is fine, for example one sprite for two defs; say which and why. Use that sprite's `_id` from the server you are writing to (the sandbox).
2. **Otherwise draw a new one** with the sprites skill, category `object`, and read its `_id` from the create result. Match the existing object sprites in outline and colour use; a space's sprite is flat.
3. **Stop and have the owner approve the sprites in the sandbox UI before creating any object.** Redo one that isn't approved (same `id`) and ask again. Only then create the object with `spriteId`.

If the owner says an object needs no sprite, leave `spriteId` out.

## Batches

Cap: **10 objects per request** (Skills 12). Over that, say so and propose the 10 most useful, or split it into rounds, each reviewed before the next.

1. Read the existing objects, then **propose first**: a table of `id`, name, solid or space (and `moveCost` if set), `container` capacity if any, the sprite (reuse an existing one, new, or none), the behaviour you are leaving out if the request implied one, and a one-line reason it earns its place in the scene. Merge entries that differ only by name. Every entry needs a reason the player would see it or bump into it there.
2. Wait for the owner to approve or trim the table. Then follow the Sprites steps: create the new sprites (capped at 10 too; render the batch side by side and check the style as a set) and stop for their review.
3. After the sprites are approved, create exactly the approved list of objects.
4. Report the `id`s in the same order, with what you left out and any doubts. Review is in the sandbox UI (`pnpm dev:sandbox` in `frontend/`, on :3001, object definitions page).

A single object asked for by name needs no table, but it still goes through the Sprites steps before the object is created.

## Fixing one

`list_collection` with `filters: { id }` to get the document, change what is wrong, and `replace_doc` with the **whole** document (PUT replaces everything). Many existing objects carry `interactions`: **send them back unchanged**, or the replace deletes them. Keep the same `id` so the owner is still judging the same object.

## Don't

- Don't write to the real server, or with no `id`.
- Don't create interactions, and don't invent fields.
- Don't touch `creature` or `portal` defs, or an existing object's interactions.
- Don't leave test objects around; use `ZZ_`. There is no delete: cleanup is `make sandbox-reset`, which needs the owner's confirmation.
- Don't edit zones that use an object.
