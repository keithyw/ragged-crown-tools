---
name: terrain
description: Make, redo or adjust Ragged Crown terrain definitions (ground tiles such as swamp, sand or dirt road) in the sandbox so the owner can review them. Use when asked to create or tweak terrain or tile defs.
---

# Terrain

**Read `.claude/skills/shared/RULES.md` first.** It holds the rules every creation skill follows: the hierarchy and reuse, where you may write, ids, glyphs, sprites, batches, fixing and what not to do. This file is only what is particular to terrain.

A terrain def is the ground a zone is painted with (DATA-MODEL.md 1.3, 1.5). It has no interactions and references at most one sprite.

- Collection: `tile_defs`, `kind: "terrain"`.
- Sprite category: `terrain`.
- Batch cap: none.
- Extra proposal columns: `moveCost`, `encounterRate`, walkable.
- Sandbox UI page: tile definitions.

## Document

```json
{
  "id": "SWAMP", "kind": "terrain", "name": "Swamp",
  "description": "Murky water and reeds slow every step.",
  "glyph": { "symbol": "~~", "color": "text-teal-500", "bg": "bg-emerald-950/60" },
  "spriteId": "<the _id of its sprite>",
  "moveCost": 2, "isWalkable": true, "encounterRate": 0.12
}
```

- `description`: in the voice of the existing tiles ("Towering trees block out the sun overhead.").
- `moveCost`: required, 0 or more.
- `isWalkable`: **always set it**. Absent reads as "No" in the inspector, while the form defaults to `true`. Use `false` only for ground nobody can enter (deep water, lava, a chasm).
- `encounterRate`: 0 to 1 (the schema doesn't enforce it). Leave it out for ground that can't be entered. `encounterTableKey` is not used; encounter tables aren't designed.
- Don't send `symbol`, `color` or `bg` at the top level; they live inside `glyph`.

## Match what exists

Read the existing terrain before inventing numbers: `list_collection` on the **real** server, `collection: tile_defs`. It is small. Set `moveCost` and `encounterRate` relative to it (at the time of writing: grass 1 / 0.08, forest 2 / 0.15, mountains 3 / 0.2). Harder ground costs more and is more dangerous. Say which tiles you compared against.

## Glyph conventions

Existing tiles use a doubled character (`::`, `♠♠`, `▲▲`) on a coloured background. Keep the symbol readable against the bg, and keep the family consistent with neighbouring tiles (grass is emerald, mountains stone).

## Sprites

Terrain sprites fill the whole tile. Suitable means it really is that ground, not merely close.
