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
5. **Repoint other zones' doors, only if the spec asks** (STARTING_TOWN, 2026-11-10). A spec may say that an existing zone's portal should lead to the new zone (the way back out of an interior). Do it with `replace_doc` and `changes` on that zone: `remove` the portal placement (`from`, `def`), then `add` it again at the same cell with a `destination` (`zoneId` is the new zone's `_id`; `pos` is the walkable cell in front of the matching building, or leave it out for the new zone's `startingPosition`). The re-added placement gets a new `uid`. Leave that zone's `status` alone, and touch no other door in it. Read it first with `get_doc` and say in the report which doors you changed. If several placements lead in but the interior has one exit (three huts, one SMALL_HUT), the exit can lead back to only one: point it at the first and report the rest as what the model can't hold ([Tools: Portals 8]).
6. **Report**: the plan as built, the zone `id`, a character grid, every def and sprite created (the owner reviews the new defs and sprites afterwards, so list them by `id`), what the spec asked for that the model can't hold, and doubts. Then mark the spec `processed` (`get_doc`, then `replace_doc` with the whole spec and `status: "processed"`; keep every other field): it only means a zone now exists for it. **Review is on the zone, not the spec.** The owner approves the zone or sends it back with a note, see Redo round.
7. **Append an entry to `LESSONS.md`** (see its header). Do this every run, success or not.

## Document

```json
{
  "id": "SMALL_HUT", "name": "small hut", "dangerLevel": 0,
  "startingPosition": { "x": 3, "y": 6 },
  "status": "review",
  "terrainRows": ["wf wf wf", "wf wf wf"],
  "placements": {
    "3,7": [{ "uid": "<uuid>", "defKind": "portal", "defId": "<portal _id>" }],
    "1,4": [{ "uid": "<uuid>", "defKind": "object", "defId": "<object _id>",
              "contents": [{ "uid": "<uuid>", "defKind": "item", "defId": "<item _id>" }] }]
  }
}
```

- **Write terrain as `terrainRows`, not `terrain`** (Trello [Infra 23]): one string per row, each cell the terrain def's two-letter `code` (`gr`, `sw`, `wf`, ...), spaces between cells optional. `"terrainRows": ["gr gr sw", "gr sw sw"]`. The MCP turns the codes into `_id`s on the server you write to, refuses an unknown code with its row and `x`, and shows `terrainRows` back in its reply. Send `terrainRows` or `terrain`, never both. Read the codes from the terrain defs (`list_collection` on `tile_defs`, the `code` field), and don't make one up: a terrain with no `code` has to be created or given one first. A stored zone still holds `_id`s, and `get_doc` on a zone still returns `terrain` as `_id`s (a redo may send that back as `terrain` unchanged, or write `terrainRows` for the rows it changes).
- **Write runs of the same def as `fills`**, not one placement each: `"fills": [{ "def": "WOODEN_WALL", "from": "0,0", "to": "15,0" }]`. `def` is the def's `id`; `from` and `to` are `"x,y"` corners of a rectangle (inclusive), so a row, a column or a block all work. Each cell gets a new placement on top, after any `placements` you wrote, in the order the fills are listed (a rug fill before the table fill puts the table on the rug). Fills only make new placements: use `placements` for anything with `contents`, `destination` or `customValues`, and on a redo send the existing placements unchanged and use fills only for what you add, so their `uid`s stay.
- `terrain` is `[y][x]`, every row the same width, a terrain def `_id` in every cell. `width` and `height` come from the spec; `dimensions` isn't stored.
- `placements` is keyed `"x,y"` (x first), only for cells with something, each stack ordered bottom to top. `defId` is the def's `_id`; `defKind` is `object`, `item` or `portal`. `uid` is a fresh UUID per placement.
- `startingPosition` must be inside the map. Put it on a walkable cell.
- The same def can't sit directly on top of itself in one stack (DATA-MODEL 3).
- A portal gets **no `destination`** unless the request names one. No destination named means the zone isn't meant to connect: don't ask, and don't list it as a doubt.
- Container contents go in the placement's `contents`, and only for a def with a `container`. A custom-value slot (a sign's text, a chest's reward) is filled in `customValues` keyed by the def's slot id; leave it empty if the spec gives no value.
- Don't use `edgeExits`: the builder doesn't have them yet.

## Writing the document

The terrain is short now (`terrainRows`), but explicit placements (a `uid` and two `_id`s each) are still long, so use `fills` for runs, and for a zone with many one-off placements build the document with a throwaway script instead of by hand: put it in `frontend/.sandbox/` (say that you added it), have it print the JSON, and send that. The MCP validates it with the frontend's zone schema and says what is wrong.

## Redo round

Started by a prompt like "work through the zone redo queue". The owner sends a zone back with a note, from the zone review page (Zones, Review Generated Zones) or the zone's inspector in the zone builder. That sets the **zone's** `status` to `redo` and stores its `reviewNote` (the same fields and idea as a sprite). The zone's spec is not touched: it stays as the base prompt. For each zone with `status: "redo"` (`list_collection` on `zones`, `filters: { status: "redo" }`):

1. **Read the zone's `reviewNote`, and its spec** (`list_collection` on `zone_specs` with `filters: { id }`, the zone's `id`) as the original request. The note says what to change; the spec says what the zone was meant to be. If there is no spec (a hand-built zone), the note and the zone are all there is.
2. **Do what the note asks.** A redo is about **contents and placement**: objects the owner expected and didn't get, a room that feels thin, things badly placed. Create missing defs and sprites through the matching skills, as in a first run. A def the owner thinks is wrong is theirs to fix, and sprites have their own queue: don't redraw or edit existing defs here unless the note asks for it by name.
3. **Change the zone with `replace_doc` and `changes`**, not a whole document: `replace_doc` with the zone's `_id` and `"changes": { "remove": [{ "from": "3,4", "def": "CHAIR" }], "add": { "5,2": [{ "defKind": "object", "defId": "<_id>" }] }, "fills": [...], "status": "review", "reviewNote": null }`. `remove` takes a rectangle (`from`, optional `to`) and an optional def `id` (no `def` clears the cells); `add` is for one-offs with `contents`, `destination` or `customValues` (a `uid` is made if you leave it out); `fills` as above. Order is remove, add, fills, and every placement you don't name keeps its `uid` untouched. You still `get_doc` first to see the layout, but never resend it. Set `status: "review"` and `reviewNote: null` in the changes. (The MCP refuses `redo` with no note, so a zone in the queue always has one.) **Check the reply after the write:** the stored copy must show `"status": "review"` and no `reviewNote`, and there must be no `Warnings:` block naming `status` or `reviewNote` as dropped (a stale MCP that predates the review fields does this, and the zone then falls out of both queues). If either is wrong, fix it before reporting: don't report the redo as done with the zone not in `review`. Never end a redo, or a first build, with a zone that has no status.
4. **Update `LESSONS.md`**: add what was corrected to the zone's entry, and what it suggests.
5. **Report** per zone: the note, what you changed, any new defs and sprites (the sprites are now waiting for review), and doubts. The owner approves from the review page, or sends it back again.

A zone that needs scrapping isn't redone: the owner deletes it and rewrites the spec.

## Fixing one outside the queue

If the owner asks for a change in conversation instead of a note, do steps 2 to 4 above and leave the zone's `status` alone (unless it is `redo`, then step 3 applies as written).
