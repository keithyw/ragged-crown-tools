---
name: monsters
description: Make, redo or adjust Ragged Crown monster definitions (goblins, rats, spiders, dragons and other things the party fights) in the sandbox so the owner can review them. Use when asked to create or tweak monsters, including a whole group at once ("the wine cellar's monsters").
---

# Monsters

**Read `.claude/skills/shared/RULES.md` first.** It holds the rules every creation skill follows: the hierarchy and reuse, where you may write, ids, glyphs, sprites, batches, fixing and what not to do. This file is only what is particular to monsters.

A monster is something the party fights. It is placed on the map like other defs (or spawned at runtime), it is solid, and bumping it starts combat. The decisions are in DATA-MODEL.md 1.3 and Trello [Monsters 1] and [Monsters 2].

- Collection: **`monsters`**, `kind: "monster"`. It is its own collection, not `entities`.
- Sprite category: `monster`.
- Batch cap: the default, 10.
- Extra proposal columns: `level`, `hp`, `defenseValue`, `removalChance`, `numberAppearing` (`2d4`), whether it is unique, and the sprite plan.
- Sandbox UI page: Monster Definitions.

## Monster, object or item?

A monster is what the party **fights**. A townsperson, a guard who only talks, or a friendly dragon who gives a quest is **not** a monster: it is a solid object with a dialog (the objects skill). A dead goblin's head, a dragon's tooth or a sword is an item. If a request mixes them ("a goblin and its loot"), make the monster here and say the rest belongs to the other skills.

## Document

```json
{
  "id": "GOBLIN", "kind": "monster", "name": "Goblin",
  "description": "A small, wiry raider with yellow eyes and a rusty knife.",
  "glyph": { "symbol": "g", "color": "text-emerald-400", "bg": "bg-black" },
  "spriteId": "<the _id of its sprite>",
  "level": 1,
  "hp": 6,
  "defenseValue": 1,
  "removalChance": 85,
  "numberAppearing": { "count": 2, "die": 4 }
}
```

- `level`: **required**, a whole number, 0 or more.
- `hp`: **required**, a set number, 1 or more. Not dice.
- `defenseValue`: **required**, a whole number, 0 or more, no ceiling. The same name and kind of number as armor's `defenseValue` (small and progressive: cloth 1, leather 2). **How it is used in a hit, and the scale monsters sit on, is not decided yet ([Combat 10])**, so use the starting values below, say they are placeholders, and don't invent a rule.
- `removalChance`: **required**, a whole number from 0 to 100: the percentage chance the monster **leaves** after the party flees. 0 means it never leaves (a quest boss, so a quest can't become unsolvable); about 85 for trivial things (bandits, rats); about 25 for something major (a dragon). Use the starting value, say it is a guess, and always say what 0 does.
- `numberAppearing`: **required**, dice in the same shape as a weapon's damage: `count` a whole number, 1 or more; `die` one of 4, 6, 8, 10, 12, 20, 100. So 3d6 is `{ "count": 3, "die": 6 }`. This is how many can appear together (rats and goblins come in numbers; a dragon is rare). A placement or encounter group can set its own number instead; that is not stored here.
- `isUnique`: only when the owner says the monster is a one-off (a named boss, a dragon). Send `true` only, **never `false`** (absent means false). A unique monster only ever appears as one, and the game ignores `numberAppearing`, but **the field is still required**: send a small plausible value (`1d4` is fine) and say it is ignored. There is no rarity field and no boss flag.
- Not part of a monster: attributes, gear, interactions, XP, currency, loot, abilities (breath, poison, drain, spells), damage or attack values, speed. Don't send them and don't hide them in the description.

## What makes two monsters different defs

A def is the **base monster**. Two defs earn their places by differing in something the model holds (level, hp, defense, how many appear, whether it leaves) or by reading differently at tile size. A goblin, an orc and a goblin chieftain are three; a "green goblin" and a "blue goblin" are not. Don't make variants for a title or an equipment loadout ("goblin with a bow"): there is no gear.

### Starting values

Reference, not rules: show them in the proposal for the owner to correct. The first four match the game's `monster.json` today (level and hp); the rest are guesses.

| Monster | level | hp | defenseValue | removalChance | numberAppearing |
| --- | --- | --- | --- | --- | --- |
| Rat | 0 | 2 | 0 | 85 | 2d6 |
| Goblin | 1 | 6 | 1 | 85 | 2d4 |
| Giant spider | 1 | 8 | 1 | 60 | 1d4 |
| Orc | 2 | 12 | 2 | 60 | 2d4 |
| Road bandit | 2 | 14 | 2 | 85 | 1d6 |

## Never put these in the data

Anything the model doesn't hold: what it carries or drops, how it attacks, what it resists, a spell list, a speed. Create the plain monster and **say what you left out**; don't hide it in the description ("Poisonous bite, drops a fang").

## Match what exists

Before proposing, read what is there, on **both** servers: `list_collection` on `monsters` (it holds nothing but monsters, so no `kind` filter). Check a new `id` with `filters: { id }`. The game also has `monster.json` (`ragged-crown/public/data/monster.json`) with its own list; if a request names one of those, use its level and hp so the numbers carry over, and say so.

## Glyph conventions

A single letter on `bg-black`, in the game's current style (`g` goblin, `o` orc, `s` spider, `r` rat), coloured by what the thing is: `text-emerald-400`, `text-green-600`, `text-purple-400`. A dragon or other big thing may use an emoji if it reads better.

## Fixing one

As in RULES: read the whole document, change what is wrong, `replace_doc` with the whole thing. `isUnique` that is on stays; one that is off stays out.
