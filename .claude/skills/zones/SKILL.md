---
name: zones
description: Build a Ragged Crown zone in the sandbox from a pending zone spec (zone_specs), creating any missing terrain, objects, items and sprites first, so the owner can review it. Use when asked to process, build or redo a zone or zone spec.
---

# Zones

**Read `.claude/skills/shared/RULES.md` first** (hierarchy and reuse, sandbox-only writes, ids, sprites, batches, what not to do), then `.claude/skills/zones/LESSONS.md` (what earlier runs taught). This file is only what is particular to zones. Shape: DATA-MODEL.md sections 2, 2.3 and 3.

This skill is deliberately loose. The owner doesn't yet know what can be generated well, so the composition is left to you. Rules get added here when a result looks wrong, not before. Don't invent layout rules the owner hasn't given; do record what you did and what went wrong (below).

## Input

A document in `zone_specs` (`list_collection`, `filters: { status: "pending" }`, or by `id`): `id`, `name`, `width`, `height`, `dangerLevel`, `description` (free text: the idea of the zone), `status`. The zone takes the **spec's `id`, name and danger level**, and the size is the size of `terrain`. Work on one spec at a time.

## Process

1. **Read the spec and what exists**: terrain (`tile_defs`), objects, portals and items (names only, see the object skill's command), and sprites. Reuse before creating (`RULES.md`).
2. **Decide the plan, and don't stop for approval** (owner, 2026-11-07). A long run that waits on the owner needs them watching, so, as with sprites, build first and review afterwards. Write the plan (defs to reuse, new ones and why, a layout grid) at the top of your report instead of asking. This overrides the "propose, then wait" steps in `RULES.md` Batches for zones. The 10-def cap still applies: over it, build the most useful ones and say what you left for a second round.
3. **Create the missing parts bottom-up**, following the matching skill for each kind (terrain, objects, items, portals): sprites first via the `sprite-artist` subagent, then the defs. Nothing is held up for review.
4. **Compose the zone** and write it with `create_doc` on `zones`, with `"status": "review"` so it lands in the owner's review queue.
5. **Report**: the plan as built, the zone `id`, a character grid, every def and sprite created (the owner reviews the new defs and sprites afterwards, so list them by `id`), what the spec asked for that the model can't hold, and doubts. Then mark the spec `processed` (`get_doc`, then `replace_doc` with the whole spec and `status: "processed"`; keep every other field): it only means a zone now exists for it. **Review is on the zone, not the spec.** The owner approves the zone or sends it back with a note, see Redo round.
6. **Append an entry to `LESSONS.md`** (see its header). Do this every run, success or not.

## Document

```json
{
  "id": "SMALL_HUT", "name": "small hut", "dangerLevel": 0,
  "startingPosition": { "x": 3, "y": 6 },
  "status": "review",
  "terrain": [["<terrain _id>", "..."], ["..."]],
  "placements": {
    "3,7": [{ "uid": "<uuid>", "defKind": "portal", "defId": "<portal _id>" }],
    "1,4": [{ "uid": "<uuid>", "defKind": "object", "defId": "<object _id>",
              "contents": [{ "uid": "<uuid>", "defKind": "item", "defId": "<item _id>" }] }]
  }
}
```

- `terrain` is `[y][x]`, every row the same width, a terrain def `_id` in every cell. `width` and `height` come from the spec; `dimensions` isn't stored.
- `placements` is keyed `"x,y"` (x first), only for cells with something, each stack ordered bottom to top. `defId` is the def's `_id`; `defKind` is `object`, `item` or `portal`. `uid` is a fresh UUID per placement.
- `startingPosition` must be inside the map. Put it on a walkable cell.
- The same def can't sit directly on top of itself in one stack (DATA-MODEL 3).
- A portal gets **no `destination`** unless the request names one. No destination named means the zone isn't meant to connect: don't ask, and don't list it as a doubt.
- Container contents go in the placement's `contents`, and only for a def with a `container`. A custom-value slot (a sign's text, a chest's reward) is filled in `customValues` keyed by the def's slot id; leave it empty if the spec gives no value.
- Don't use `edgeExits`: the builder doesn't have them yet.

## Writing the document

A zone is hundreds of lines, so build it with a throwaway script instead of by hand: put it in `frontend/.sandbox/` (say that you added it), have it print the JSON, and send that. The MCP validates it with the frontend's zone schema and says what is wrong.

## Redo round

Started by a prompt like "work through the zone redo queue". The owner sends a zone back with a note, from the zone review page (Zones, Review Generated Zones) or the zone's inspector in the zone builder. That sets the **zone's** `status` to `redo` and stores its `reviewNote` (the same fields and idea as a sprite). The zone's spec is not touched: it stays as the base prompt. For each zone with `status: "redo"` (`list_collection` on `zones`, `filters: { status: "redo" }`):

1. **Read the zone's `reviewNote`, and its spec** (`list_collection` on `zone_specs` with `filters: { id }`, the zone's `id`) as the original request. The note says what to change; the spec says what the zone was meant to be. If there is no spec (a hand-built zone), the note and the zone are all there is.
2. **Do what the note asks.** A redo is about **contents and placement**: objects the owner expected and didn't get, a room that feels thin, things badly placed. Create missing defs and sprites through the matching skills, as in a first run. A def the owner thinks is wrong is theirs to fix, and sprites have their own queue: don't redraw or edit existing defs here unless the note asks for it by name.
3. **Replace the zone**: `get_doc` it, change what the note asks for, and `replace_doc` the **whole** document. Keep its `_id` (it is in the URL), `id`, and every unchanged placement `uid`. Don't touch the rest of the layout. Set `status: "review"` and **remove `reviewNote`**. (The MCP refuses `redo` with no note, so a zone in the queue always has one.)
4. **Update `LESSONS.md`**: add what was corrected to the zone's entry, and what it suggests.
5. **Report** per zone: the note, what you changed, any new defs and sprites (the sprites are now waiting for review), and doubts. The owner approves from the review page, or sends it back again.

A zone that needs scrapping isn't redone: the owner deletes it and rewrites the spec.

## Fixing one outside the queue

If the owner asks for a change in conversation instead of a note, do steps 2 to 4 above and leave the zone's `status` alone (unless it is `redo`, then step 3 applies as written).
