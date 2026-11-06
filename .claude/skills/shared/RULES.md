# Creation rules

Every creation skill (sprites, terrain, items, objects, portals, and whatever comes next) follows these. A skill holds only what is particular to its kind: its collection, fields and values. If a skill and this file disagree, tell the owner; don't guess. The owner judges the result; you create, they review.

## The hierarchy

Things are built from other things: a def needs a sprite, a zone needs defs and sprites. **Whatever a thing needs that doesn't exist yet goes through its own creation flow first, from the bottom up, approved at each level, before anything that depends on it is created.** A rejected sprite is a cheap redo; a def or zone already pointing at it is not.

**Reuse before creating.** A new thing has to differ in what it does or in how it reads at tile size. A blue flower when a flower already exists is not a new thing. For each thing needed, the choice is: reuse this one, or create a new one and say why. The owner decides.

## Where you may write

Sandbox only: `mcp__ragged-crown-sandbox__create_doc` and `replace_doc`. The real server (`mcp__ragged-crown__*`) is read-only. Only sprites can be promoted so far (the sprites skill); an approved def is re-created by the owner in the real UI until def promotion exists (Skills 11).

If the sandbox looks stale next to the real database (real documents missing), say so before a big batch: `make sandbox-refresh` rebuilds it. Run it as a dry run only; `APPLY=1` deletes the sandbox volume and needs the owner's go-ahead.

## Ids

Required: the MCP refuses a def without one, and review and promotion depend on it.

- Written like a constant in code: uppercase full words joined by underscores (`DIRT_ROAD`, `BAR_COUNTER`), never hyphens. No abbreviations, no padding. It is not copied from the `name`; it only has to be semi-readable and short.
- Test documents start with `ZZ_`.
- Check it is free on **both** servers (`list_collection`, `filters: { id }`, `limit: 1`), because promotion matches on `id` and the sandbox can be behind the real database. `id` is unique per collection, so in a collection holding several kinds (`entities`) don't filter by `kind`. If it is taken, say so and pick another.

## Fields

- `name`: a short human label. `description`: one plain sentence of flavour, not a place for stats or rules.
- Only send the fields the kind's skill lists. Don't invent fields (category, tags, room type, stats), and don't hide them in the text. When a request asks for something the model doesn't have, create what it can hold and **say what you left out**.
- A misspelt or unknown top-level field is dropped, and the MCP names it in a `Warnings:` block after the stored copy: read it, and fix the spelling.

## Glyph

Required on every def: shown when there is no sprite, and the backfill if the sprite goes missing.

- `symbol`: 1 or 2 characters, counted as characters and not bytes, so an emoji is one and up to two pass.
- `color` and `bg` must come from the palette, because anything else isn't in the safelist and renders uncoloured (in the game for certain). The MCP refuses other classes, so check against this list before writing:
  - `color`: `text-white`, `text-black`, or `text-<hue>-<300|400|500|600>` with an optional `/70`.
  - `bg`: `bg-black`, `bg-white`, or `bg-<hue>-<700|800|900|950>` with an optional `/30` or `/60`.
  - hues: zinc, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, violet, purple, pink, rose, stone.
  - If `frontend/src/lib/types/colorPalette.ts` ever differs, the file wins.

## Sprites

Every new def gets a sprite (owner, 2026-11-04). The MCP checks the sprite exists and is in the def's category, and refuses the def otherwise. For each def:

1. **Look for a suitable existing sprite** first, on both servers (names only; the full documents are long). Replace `<category>` with the skill's sprite category:
   ```bash
   for p in 8080 8081; do curl -s "localhost:$p/collection/sprites?category=<category>" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(d=>d.id+" ("+d.name+")").join(", ")))'; done
   ```
   Suitable means it really is that thing, not merely close (a rake is not a spear). Reusing one is fine, for example one sprite for two defs; say which and why. Use that sprite's `_id` from the server you are writing to (the sandbox).
2. **Otherwise have a new one drawn by the `sprite-artist` subagent** (Agent tool, `subagent_type: "sprite-artist"`), not in the main session, so the drawing and renders stay out of its context (Trello [Skills 15]). Hand it every new sprite in the batch at once, after the owner approves the proposal: for each, the `id`, `name`, category and what it should show. Use the `_id`s from its report. Redraws go to it too: the `id` and the owner's feedback. Only when the owner asks for a sprite to be drawn in the main session, use the sprites skill directly.
3. **Stop and have the owner approve the sprites in the sandbox UI before creating any def.** Redo one that isn't approved (same `id`) and ask again. Only then create the def with `spriteId`.

If the owner says a def needs no sprite, leave `spriteId` out.

## Batches

| Kind | Cap per request |
| --- | --- |
| Sprites, items, objects, and any new kind unless its skill says otherwise | 10 |
| Terrain, portals | none, but the same steps apply |
| Zones | one at a time, always reviewed on their own |

Over the cap, say so and propose the most useful ones up to the cap, or split it into rounds, each reviewed before the next.

1. Read what exists, then **propose first**: a table with `id`, name, the columns the skill lists, the sprite (reuse an existing one, new, or none), and a one-line reason it earns its place. Merge entries that differ only by name. Every entry needs a reason the player would see it or use it; "fills the list" isn't one.
2. Wait for the owner to approve or trim the table. Then follow the Sprites steps: the `sprite-artist` subagent creates the new sprites and checks them as a set, and you stop for the owner's review.
3. After the sprites are approved, create exactly the approved list.
4. Report the `id`s in the same order, with what you left out and any doubts. Review is in the sandbox UI: `pnpm dev:sandbox` in `frontend/`, on :3001, on the page the skill names.

A single thing asked for by name needs no table, but it still goes through the Sprites steps before it is created.

## Simple interactions

Objects can talk (portals use the same shape, but only the objects skill does this so far). The owner's rule (2026-11-05): **start simple, and widen only after a basic interaction has been generated in bulk (about 5) and the owner has checked them.** So far that means one thing:

- **A fixed line of dialog.** One interaction: `{ "id": "<uuid>", "on": "BUMP_INTERACT", "actions": [{ "type": "SHOW_DIALOG", "text": "Howdy!" }] }`.
- **`on`:** `BUMP_INTERACT` for a person or sign the player walks into (the existing `PERSON` and `SIGN` use it). Leave `TALK` to the owner until a talk command exists.
- **`id`:** the editor makes a UUID, so make one the same way: `uuidgen | tr A-Z a-z`. It only has to be unique within the def.
- **The text:** the owner's own words when the request gives them ("only say Howdy!"), verbatim. Otherwise one short line in the character's voice, shown in the proposal for the owner to approve like a name.
- **Different per placement** (a sign that says something else wherever it stands): send `{ "type": "SHOW_DIALOG", "custom": true }` with **no** `text` and **no** `slot` (the schema makes the slot). The owner fills the text in on each placement in the zone builder.
- **Not yet, even when the request implies it:** `conditions`, `hint`, `limit`, and any action other than `SHOW_DIALOG` (`GIVE_ITEM`, `TAKE_ITEM`, `SPAWN`, `MODIFY_ATTRIBUTE`, `REMOVE_SELF` and the rest). Create the object with what is allowed and say what you left out. An object that only needs a body gets no interactions.

When the owner widens this, change this section, not the skills that point at it.

## Fixing one

`list_collection` with `filters: { id }` to get the document, change what is wrong, and `replace_doc` with the **whole** document (PUT replaces everything). If it has `interactions`, **send them back unchanged**, or the replace deletes them. Keep the same `id`, so the owner is still judging the same thing.

## Don't

- Don't write to the real server, or create anything with no `id`.
- Don't leave test documents around; use `ZZ_`. There is no delete: cleanup is `make sandbox-reset`, which needs the owner's confirmation.
- Don't edit other documents that use the thing you are changing.

## Adding a new creation skill

For a new kind (weapons, armor, monsters): add `.claude/skills/<kind>/SKILL.md` that points here and gives only what is particular to it.

- A description saying when to use it, and what kind of thing it makes.
- The collection and `kind`, the sprite category, the batch cap if it isn't the default, the extra proposal-table columns, and the sandbox UI page.
- An example document, and each field with its rule. Check the example against the frontend's schema before relying on it.
- How to tell it from its neighbours (item or object, portal or object), and what is deliberately out of scope.
- Its conventions: glyph background, and how to read what already exists.

A new kind also needs its sprite category and, if it has a new collection, the steps in ARCHITECTURE.md section 7. If a rule starts appearing in a second skill, move it here.
