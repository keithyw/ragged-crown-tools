---
name: sprites
description: Make, redo or adjust a Ragged Crown sprite (16x16 EGA pixel art for a terrain, object, item or portal) in the sandbox so the owner can review it. Use when asked to draw, create, fix or tweak a sprite.
---

# Sprites

A sprite is 16x16 pixels in the 16 EGA colours, one tile, no multi-tile objects (DATA-MODEL.md 1.2). The look is Ultima 5 / Magic Candle. The owner judges quality and style; you draw, they review.

## Where you may write

Sandbox only: `mcp__ragged-crown-sandbox__create_doc` and `replace_doc`. The real server (`mcp__ragged-crown__*`) is read-only. The only way a sprite reaches the real database is `make promote-sprites` (see Promoting), and only after the owner approves it.

## The text form

16 rows of 16 characters. `0`-`F` is the palette index, `.` is an empty cell.

`0` Black, `1` Blue, `2` Green, `3` Cyan, `4` Red, `5` Magenta, `6` Brown, `7` Light gray, `8` Dark gray, `9` Light blue, `A` Light green, `B` Light cyan, `C` Light red, `D` Light magenta, `E` Yellow, `F` White.

That is the standard EGA order. If `EGA_PALETTE` in `frontend/src/lib/types/sprite.ts` ever differs, the file wins.

## Document

```json
{ "id": "FARM_HAND", "name": "Farm hand", "category": "object", "background": "transparent", "pixels": [256 entries] }
```

- `category`: `terrain`, `object`, `item` or `portal`.
- `id` is required and unique in `sprites`. Write it like a constant in code: uppercase full words joined by underscores (`FARM_HAND`, `GOLD_COINS`, never hyphens). It is not copied from the `name`. The `name` is the human label; the `id` only has to be semi-readable and short, because code may eventually refer to it. No abbreviations, no padding. Check it is free first: `list_collection` with `filters: { id: "<id>" }`, `limit: 1`. If it is taken, say so and pick another.
- `background` is `"transparent"` unless asked otherwise (or a palette index).
- `pixels` is the 256 entries row by row, a palette index or `null`. Never type the array by hand: pipe the rows through the helper, which checks the size and characters.

```bash
export PATH="$HOME/.nvm/versions/node/v22.17.0/bin:$PATH"
node .claude/skills/sprites/rows-to-pixels.mjs <<'EOF'
<the 16 rows>
EOF
```

The MCP validates against `spriteSchema` and returns a readable error for a bad document. Ignore the "NOT validated" wording in the write tools' descriptions; it is out of date.

## Drawing

- Plain and readable at 16x16: a clear silhouette, a few colours, no noise. Centre it with a pixel or two of margin.
- The palette has no skin tone. Use light red `C` or brown `6`, and say which you used.
- Figures face front. Details that don't survive at this size are left out.
- For a new category, or when the owner asks for consistency, look at one or two existing sprites first (`list_collection` on `sprites`, `filters: { category }`, `limit: 2`; the real server works too) and match their outline, shading and colour use. Don't do this every time: a sprite is large to read.
- When unsure, keep it simple and say what you were unsure about.

## Steps

1. Check the `id` is free.
2. Draw the 16 rows. Check them: 16 rows of 16 characters, only `0-F` and `.`.
3. Run the helper to get `pixels`.
4. Look at it: render the rows to a PNG in the scratchpad and open it with Read (see Looking at a sprite). Fix what you can see is wrong (lopsided, stray row, clashing colours) before going on.
5. `create_doc` into `sprites` on the sandbox.
6. Report to the owner: the `id`s made, the rows in a code block (so they can import them to the real builder if wanted), choices made and doubts. Review is in the sandbox UI: `pnpm dev:sandbox` in `frontend/`, on :3001, next to the normal dev server (ARCHITECTURE.md 6.0, 6.4).

## Looking at a sprite

`render-sprite.mjs` turns the text rows into an enlarged PNG you can open with Read. It is your own pre-check; the owner still judges quality and style, and a clean render doesn't replace their review.

```bash
node .claude/skills/sprites/render-sprite.mjs <scratchpad>/new.png <<'EOF'
<the 16 rows>
EOF
```

- Put the PNG in the scratchpad, never the repo.
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

Find it with `list_collection` (`filters: { id }`) to get its `_id`, change the rows, and `replace_doc` with the **whole** document (PUT replaces everything: send `id`, `name`, `category`, `background` and `pixels`). Keep the same `id`, so the owner is still judging the same sprite.

## Don't

- Don't create sprites with no `id`, or write to the real server.
- Don't leave test sprites around; use an `id` starting `ZZ_` for tests. There is no delete: cleanup is `make sandbox-reset`, which needs the owner's confirmation.
- Don't touch defs that use a sprite. Picking a sprite on a def is the owner's step in the UI.
