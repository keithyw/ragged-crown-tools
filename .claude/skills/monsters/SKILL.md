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
- Extra proposal columns: `level`, `hp`, `defenseValue`, `damage` (`1d4`), `removalChance`, `initiative`, `xp`, `rarity`, `numberAppearing` (`2d4`), `currency` (`2d6 silver`), whether it is unique, and the sprite plan.
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
  "damage": { "count": 1, "die": 4 },
  "removalChance": 85,
  "initiative": 6,
  "xp": 0,
  "rarity": "common",
  "numberAppearing": { "count": 2, "die": 4 }
}
```

- `level`: **required**, a whole number, 0 or more.
- `hp`: **required**, a set number, 1 or more. Not dice.
- `defenseValue`: **required**, a whole number, 0 or more, no ceiling. The same name and kind of number as armor's `defenseValue` (small and progressive: cloth 1, leather 2). **How it is used in a hit, and the scale monsters sit on, is not decided yet ([Combat 10])**, so use the starting values below, say they are placeholders, and don't invent a rule.
- `damage`: **required**, the base damage per hit, dice in the same shape as a weapon's damage: `count` a whole number, 1 or more; `die` one of 4, 6, 8, 10, 12, 20, 100 (1d4 is `{ "count": 1, "die": 4 }`). There is no to-hit roll yet ([Combat 10]), so every attack hits for this roll. The starting values below are guesses; say so. Special attacks (poison, breath, drain) are still not part of a monster.
- `removalChance`: **required**, a whole number from 0 to 100: the percentage chance the monster **leaves** after the party flees. 0 means it never leaves (a quest boss, so a quest can't become unsolvable); about 85 for trivial things (bandits, rats); about 25 for something major (a dragon). Use the starting value, say it is a guess, and always say what 0 does.
- `initiative`: optional whole number, 0 or more; absent reads as 6 in the game. **Send it anyway** (the owner wants every monster to carry one). It is the base of the monster's place in the turn order: each round the game adds 1d6, and a character starts from 6 plus speed and gear. 6 is an average monster, higher acts earlier. The starting values below are all 6 and a guess; say so.
- `xp`: **required**, a set whole number, 0 or more ([Monsters 8]). What beating **one** of this monster is worth; the game sums it over the encounter and divides it among the party. **There is no default**, and it is not flat per zone: a rat is worth less than a goblin, a boss a little more than an average goblin, so it follows the monster's own level, hp, defense and damage and the zone's difficulty. The scale is not settled (owner, 2026-11-24: assigned per monster, not a formula from level or zone; rat 4, goblin 6, a wine cellar boss 10; difficulty and monster level only suggest a range). Propose a value per monster, say it is a guess, and don't copy one monster's number onto another.
- `rarity`: **required**, one of `common`, `uncommon`, `scarce`, `rare`, `very rare`, `ultra rare` ([Monsters 10]); no default. How often it turns up in **random** encounters (the game turns the tier into odds). Set encounters ignore it. The starting values below are guesses; say so. The tier names are provisional.
- `terrainIds`: optional list of terrain `_id`s (`tile_defs`, `kind: terrain`) the monster can turn up on in the open world ([Monsters 11]). Send it only when the owner names terrains: list `tile_defs` and use the `_id`s, never the user-facing `id`. **Absent or empty means it appears on no terrain**, so it is never drawn from the open world (dungeon pools are on the difficulty configuration). Every entry must exist and be a terrain, or the write is refused.
- `numberAppearing`: **required**, dice in the same shape as a weapon's damage: `count` a whole number, 1 or more; `die` one of 4, 6, 8, 10, 12, 20, 100. So 3d6 is `{ "count": 3, "die": 6 }`. This is how many can appear together (rats and goblins come in numbers; a dragon is rare). A placement or encounter group can set its own number instead; that is not stored here.
- `isUnique`: only when the owner says the monster is a one-off (a named boss, a dragon). Send `true` only, **never `false`** (absent means false). A unique monster only ever appears as one, and the game ignores `numberAppearing`, but **the field is still required**: send a small plausible value (`1d4` is fine) and say it is ignored. A unique monster never appears in random encounters, so its rarity is only a placeholder (`rare` or `ultra rare` is fine); there is no boss flag.
- `currency`: optional, what **one** of this monster carries ([Currency 8], DATA-MODEL.md 8): dice per currency, in the same shape as `damage`, keyed `bronze`, `copper`, `iron`, `silver`, `gold` or `platinum`, e.g. `{ "copper": { "count": 2, "die": 6 } }`. Each beaten monster is rolled and the party shares the total. **Leave it out for a monster with no coins**: humanoids usually carry some; animals and vermin (rats, spiders) don't, and a nest's or lair's treasure is not the monster's. Keep it small (a long sword is 12 gold, rations 1 gold); the amounts are guesses, so say so in the proposal.
- Not part of a monster: attributes, gear, interactions, loot, abilities (breath, poison, drain, spells), special attacks, speed. Don't send them and don't hide them in the description.

## What makes two monsters different defs

A def is the **base monster**. Two defs earn their places by differing in something the model holds (level, hp, defense, damage, how many appear, whether it leaves) or by reading differently at tile size. A goblin, an orc and a goblin chieftain are three; a "green goblin" and a "blue goblin" are not. Don't make variants for a title or an equipment loadout ("goblin with a bow"): there is no gear.

### Starting values

Reference, not rules: show them in the proposal for the owner to correct. Level and hp for goblin, giant spider and road bandit come from the game's old `monster.json` (now retired); everything else is a guess.

| Monster | level | hp | defenseValue | damage | removalChance | initiative | xp | rarity | numberAppearing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Rat | 0 | 2 | 0 | 1d4 | 85 | 6 | 4 | common | 2d6 |
| Goblin | 1 | 6 | 1 | 1d6 | 85 | 6 | 6 | common | 2d4 |
| Giant spider | 1 | 8 | 1 | 1d6 | 60 | 6 | 7 | uncommon | 1d4 |
| Orc | 2 | 12 | 2 | 1d8 | 60 | 6 | 10 | uncommon | 2d4 |
| Road bandit | 2 | 14 | 2 | 1d6 | 85 | 6 | 9 | uncommon | 1d6 |

## Never put these in the data

Anything the model doesn't hold: what it carries or drops, how it attacks, what it resists, a spell list, a speed. Create the plain monster and **say what you left out**; don't hide it in the description ("Poisonous bite, drops a fang").

## Match what exists

Before proposing, read what is there, on **both** servers: `list_collection` on `monsters` (it holds nothing but monsters, so no `kind` filter). Check a new `id` with `filters: { id }`.

## Glyph conventions

A single letter on `bg-black`, in the game's current style (`g` goblin, `o` orc, `s` spider, `r` rat), coloured by what the thing is: `text-emerald-400`, `text-green-600`, `text-purple-400`. A dragon or other big thing may use an emoji if it reads better.

## Fixing one

As in RULES: read the whole document, change what is wrong, `replace_doc` with the whole thing. `isUnique` that is on stays; one that is off stays out.
