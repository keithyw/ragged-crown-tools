---
name: sprites
description: Make, redo or adjust a Ragged Crown sprite (16x16 EGA pixel art for a terrain, object, item or portal) in the sandbox so the owner can review it. Use when asked to draw, create, fix or tweak a sprite.
---

# Sprites

**Read `.claude/skills/shared/RULES.md` first.** It holds the rules every creation skill follows: the hierarchy and reuse, where you may write, ids, batches (the cap is 10, drawn as a set) and what not to do. This file is only what is particular to sprites, which sit at the bottom of the hierarchy: they depend on nothing, so they have no sprite step of their own.

A sprite is 16x16 pixels in the 16 EGA colours, one tile, no multi-tile objects (DATA-MODEL.md 1.2). The look is Ultima 5 / Magic Candle. The owner judges quality and style; you draw, they review (see Review). The only way a sprite reaches the real database is `make promote-sprites` (see Promoting), and only after the owner approves it.

## The text form

16 rows of 16 characters. `0`-`F` is the palette index, `.` is an empty cell.

`0` Black, `1` Blue, `2` Green, `3` Cyan, `4` Red, `5` Magenta, `6` Brown, `7` Light gray, `8` Dark gray, `9` Light blue, `A` Light green, `B` Light cyan, `C` Light red, `D` Light magenta, `E` Yellow, `F` White.

That is the standard EGA order. If `EGA_PALETTE` in `frontend/src/lib/types/sprite.ts` ever differs, the file wins.

## Document

```json
{ "id": "FARM_HAND", "name": "Farm hand", "category": "object", "background": "transparent", "status": "review", "rows": ["................", "...16 strings of 16 characters..."] }
```

- `category`: `terrain`, `object`, `item` or `portal`.
- `background` is `"transparent"` unless asked otherwise (or a palette index).
- `status` is `"review"` on every sprite you create or redraw (see Review below). Never `"approved"`: only the owner approves.
- `rows` is the text form from above as an array of 16 strings of 16 characters. Send it **instead of** `pixels`: the MCP turns it into the 256-entry array itself, so you never type that array (typing it by hand has failed before, always on the long runs of empty cells). A wrong row count, a short row or a stray character is refused with the row and column. Sending both `rows` and `pixels` is refused.

The MCP validates against `spriteSchema` and returns a readable error for a bad document. Its reply shows the stored sprite as `rows` too, not the 256-entry array.

## Drawing

- Plain and readable at 16x16: a clear silhouette, a few colours, no noise. Centre it with a pixel or two of margin.
- **Fill the tile (owner, 2026-11-05).** A sprite is shown small on the map and doesn't scale up, so it must be visible and discernible to the player at that size. Draw the thing large: it should take up most of the 16x16 area, not a few pixels in the middle (a mug 6 pixels wide gets lost; one about 10 wide and 12 tall reads). Leave the margin only where the silhouette needs it.
- **Walls and floors tile.** A sprite meant to sit beside copies of itself or other walls (a wall, a fireplace set into one) should reach all four edges, with no transparent border, so painted contiguously it reads as one continuous image.
- The palette has no skin tone. Use light red `C` or brown `6`, and say which you used.
- Figures face front. Details that don't survive at this size are left out.
- For a new category, or when the owner asks for consistency, look at one or two existing sprites first (`list_collection` on `sprites`, `filters: { category }`, `limit: 2`; the real server works too) and match their outline, shading and colour use. Don't do this every time: a sprite is large to read.
- When unsure, keep it simple and say what you were unsure about.

## Steps

1. Check the `id` is free.
2. Draw the 16 rows. Check them: 16 rows of 16 characters, only `0-F` and `.`.
3. Look at it: render the rows to a PNG in `frontend/.sandbox/` and open it with Read (see Looking at a sprite). Fix what you can see is wrong (lopsided, stray row, clashing colours) before going on.
4. `create_doc` into `sprites` on the sandbox, with the rows as `rows`.
5. Report to the owner: the `id`s made, the rows in a code block (so they can import them to the real builder if wanted), choices made and doubts. Review is in the sandbox UI: `pnpm dev:sandbox` in `frontend/`, on :3001, next to the normal dev server (ARCHITECTURE.md 6.0, 6.4).

## Review

Sprites carry a review status (Trello [Sprite 12]). You set `review` and leave the rest to the owner, who approves in the sandbox UI (Sprites, "Review Generated Sprites"). Creation runs do **not** stop for sprite approval: a def points at a sprite that is still in review, and the run ends by listing the sprites waiting.

| Status | Meaning | Who sets it |
| --- | --- | --- |
| `review` | Waiting for the owner | You, on create and after a redo |
| `redo` | The owner left a note; queued for you | The owner |
| `approved` | Done; the only status that gets promoted | The owner (hand-drawn sprites are saved as approved) |

## Redo round

When asked to work through the redo queue (or to redo specific sprites from their notes):

1. List them: `list_collection` on the sandbox `sprites` with `filters: { status: "redo" }` (add `id` to narrow). Each has a `reviewNote`: what the owner wants changed. That note is the brief; there is no other feedback.
2. Redraw each from its note, same `id`, following Drawing and the render step. Several at once go to the `sprite-artist` subagent, one line per sprite in its report.
3. `replace_doc` the **whole** document: the same `id`, `name`, `category` and `background`, the new `rows`, `status: "review"`, and **no** `reviewNote` (it is answered; leaving it out clears it, and the owner writes a fresh one if it still isn't right). Keeping the same document means defs and zones already pointing at it show the new art.
4. If a note is unclear or can't be drawn at 16x16, leave that sprite in `redo`, don't replace it, and say why in the report.
5. Report the `id`s redone, one line each on what you changed, and any left in `redo`. The owner reviews them on the review page again.

Never touch a sprite that isn't in `redo` during a round.

## Looking at a sprite

`render-sprite.mjs` turns the text rows into an enlarged PNG you can open with Read. It is your own pre-check; the owner still judges quality and style, and a clean render doesn't replace their review.

```bash
node .claude/skills/sprites/render-sprite.mjs frontend/.sandbox/new.png <<'EOF'
<the 16 rows>
EOF
```

- Put the PNG in `frontend/.sandbox/` (gitignored scratch space), never elsewhere in the repo or in `/tmp`.
- Several sprites separated by a blank line are drawn side by side. Use it for a style check: pass your new rows after the rows of one or two existing sprites of the same category (turn their `pixels` back into rows; don't read the 256 numbers by eye).
- Empty cells show as a light checkerboard. An optional second argument sets the scale (default 16).

## Promoting

Only when the owner has approved specific sprites, and only those `id`s. From the repo root:

1. Dry run: `make promote-sprites IDS="STONE_WALL,GRASS"`. It writes nothing and prints `CREATE`, `UPDATE` (with what differs) or `unchanged` per id.
2. Show the owner that output. An `UPDATE` overwrites a sprite that already exists in the real database (for example one they imported by hand), so say what would change.
3. Wait for an explicit go-ahead on that plan. Then run the same command with `APPLY=1`; it takes a backup first and then writes.
4. Report what was written. If it stops part-way, re-run it: sprites already written show as `unchanged`.

Never run `APPLY=1` without that go-ahead, never promote "everything", and don't try other ways to write to the real server.

## Fixing one

Find it with `list_collection` (`filters: { id }`) to get its `_id`, change the rows, and `replace_doc` with the **whole** document (PUT replaces everything: send `id`, `name`, `category`, `background`, `status` and the changed `rows`; set `status` to `review`, and drop `reviewNote`, as in a redo round). For a redo from the queue use the Redo round above. `list_collection` still returns `pixels`; turn them into rows rather than sending that array back by hand. Keep the same `id`, so the owner is still judging the same sprite.

## Don't

- Don't change existing defs that use a sprite. Linking a new sprite to a new def is the def skill's step, and it needn't wait for the sprite's approval.
