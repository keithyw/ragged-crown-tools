---
name: terrain
description: Make, redo or adjust Ragged Crown terrain definitions (ground tiles such as swamp, sand or dirt road) in the sandbox so the owner can review them. Use when asked to create or tweak terrain or tile defs.
---

# Terrain

A terrain def is the ground a zone is painted with (DATA-MODEL.md 1.3, 1.5). It has no interactions and references at most one sprite. The owner judges the result; you create, they review.

## Where you may write

Sandbox only: `mcp__ragged-crown-sandbox__create_doc` and `replace_doc`, collection `tile_defs`, `kind: "terrain"`. The real server (`mcp__ragged-crown__*`) is read-only. Nothing here reaches the real database yet; there is no def promotion (Skills 11), so an approved tile is re-created by the owner in the real UI.

If the sandbox looks stale next to the real database (real tiles or sprites missing), say so before a big batch: `make sandbox-refresh` rebuilds it. Run it as a dry run only; `APPLY=1` deletes the sandbox volume and needs the owner's go-ahead.

## Document

```json
{
  "id": "SWAMP", "kind": "terrain", "name": "Swamp",
  "description": "Murky water and reeds slow every step.",
  "glyph": { "symbol": "~~", "color": "text-teal-500", "bg": "bg-emerald-950/60" },
  "moveCost": 2, "isWalkable": true, "encounterRate": 0.12
}
```

- `id`: required (the MCP refuses a def without one; review and promotion depend on it). Written like a constant: uppercase full words joined by underscores (`DIRT_ROAD`), not copied from the `name`. No abbreviations. Test documents start with `ZZ_`. Check it is free on **both** servers (`list_collection`, `collection: tile_defs`, `filters: { id }`, `limit: 1`), because promotion matches on `id` and the sandbox is behind the real database. If taken, say so and pick another.
- `name`: short human label. `description`: one plain sentence, in the voice of the existing tiles ("Towering trees block out the sun overhead.").
- `moveCost`: required, 0 or more.
- `isWalkable`: **always set it**. Absent reads as "No" in the inspector, while the form defaults to `true`. Use `false` only for ground nobody can enter (deep water, lava, a chasm).
- `encounterRate`: 0 to 1 (the schema doesn't enforce it). Leave it out for ground that can't be entered. `encounterTableKey` is not used; encounter tables aren't designed.
- `spriteId`: optional, a sprite's `_id`. See Sprites.
- Don't send `symbol`, `color` or `bg` at the top level; they live inside `glyph`. A misspelt or unknown top-level field is dropped, and the MCP names it in a `Warnings:` block after the stored copy: read it, and fix the spelling.

## Match what exists

Read the existing terrain before inventing numbers: `list_collection` on the **real** server, `collection: tile_defs`. It is small. Set `moveCost` and `encounterRate` relative to it (at the time of writing: grass 1 / 0.08, forest 2 / 0.15, mountains 3 / 0.2). Harder ground costs more and is more dangerous. Say which tiles you compared against.

## Glyph

Shown when there is no sprite, and the backfill when a sprite is missing, so it is always required.

- `symbol`: 1 or 2 characters. Existing tiles use a doubled character (`::`, `♠♠`, `▲▲`).
- `color` and `bg` must come from the palette, because anything else isn't in the safelist and renders uncoloured (in the game for certain). The MCP refuses other classes, so check against this list before writing:
  - `color`: `text-white`, `text-black`, or `text-<hue>-<300|400|500|600>` with an optional `/70`.
  - `bg`: `bg-black`, `bg-white`, or `bg-<hue>-<700|800|900|950>` with an optional `/30` or `/60`.
  - hues: zinc, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, violet, purple, pink, rose, stone.
  - If `frontend/src/lib/types/colorPalette.ts` ever differs, the file wins.
- Keep the symbol readable against the bg, and keep the family consistent with neighbouring tiles (grass is emerald, mountains stone).

## Sprites

Every new tile gets a sprite (owner, 2026-11-04). The MCP checks the sprite exists and is a terrain sprite, and refuses the tile otherwise. For each tile:

1. **Look for a suitable existing sprite** first, on both servers (names only; the full documents are long):
   ```bash
   for p in 8080 8081; do curl -s "localhost:$p/collection/sprites?category=terrain" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(d=>d.id+" ("+d.name+")").join(", ")))'; done
   ```
   Suitable means it really is that ground, not merely close. Reusing one is fine; say which and why. Use that sprite's `_id` from the server you are writing to (the sandbox).
2. **Otherwise draw a new one** with the sprites skill, category `terrain`, and read its `_id` from the create result.
3. **Stop and have the owner approve the sprites in the sandbox UI before creating any tile.** Redo one that isn't approved (same `id`) and ask again. Only then create the tile with `spriteId`.

If the owner says a tile needs no sprite, leave `spriteId` out.

## Batches

Terrain isn't capped, but the same discipline applies (Skills 12):

1. Read the existing terrain, then **propose first**: a table of `id`, name, `moveCost`, `encounterRate`, walkable, the sprite (reuse an existing one, new, or none), and a one-line reason it is needed. Reuse an existing tile rather than a near copy.
2. Wait for the owner to approve or trim the table. Then follow the Sprites steps: create the new sprites and stop for their review.
3. After the sprites are approved, create exactly the approved list of tiles.
4. Report the `id`s in the same order, with any choices or doubts. Review is in the sandbox UI (`pnpm dev:sandbox` in `frontend/`, on :3001, tile definitions page).

A single tile asked for by name needs no table, but it still goes through the Sprites steps before the tile is created.

## Fixing one

`list_collection` with `filters: { id }` to get its `_id`, change what is wrong, and `replace_doc` with the **whole** document (PUT replaces everything). Keep the same `id` so the owner is still judging the same tile.

## Don't

- Don't write to the real server, or with no `id`.
- Don't invent fields (categories, tags, biome) or encounter tables.
- Don't leave test tiles around; use `ZZ_`. There is no delete: cleanup is `make sandbox-reset`, which needs the owner's confirmation.
- Don't edit zones or other defs that use a tile.
