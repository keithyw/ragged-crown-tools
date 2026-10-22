# Data Model

The content model shared by the tools and the game. The tools define it; the game conforms to it. Hand-editing JSON does not scale to the content needed to test the game, so this model is designed from the tools' side, and the game engine (a prototype) is expected to change to match.

Names marked _provisional_ may change while the types are written ([Model 2]). Record final names here when they settle. Anything not decided is listed under **Open questions**, not guessed.

This replaces the `tileEvents` / `ActionPayload` design.

---

## 1. Definitions

A **definition** ("def") is a reusable kind of thing: a grass tile, a chest, a spear, a townsperson. Defs live in Mongo; zones place them on the map.

### 1.1 Base definition and `kind`

Every def shares a base:

| Field          | Type     | Notes                                                       |
| -------------- | -------- | ----------------------------------------------------------- |
| `_id`          | string   | Mongo ObjectID, server-generated. The only key.             |
| `id`           | string?  | Legacy, user-facing label (e.g. `T001`). Display only.      |
| `kind`         | `Kind`   | Discriminator, see below.                                   |
| `name`         | string   |                                                             |
| `description`  | string?  |                                                             |
| `glyph`        | `Glyph`  | What it looks like on the map (1.2).                        |

```ts
type Kind = 'terrain' | 'object' | 'item' | 'creature' | 'portal'
```

JSON has no inheritance, so the kinds are modelled as a base type extended per kind (TS `extends`, zod `.extend`) plus a discriminated union on `kind`.

`kind` is required. Existing `tile_defs` documents (flat `symbol`/`color`/`bg`, no `kind`) are **not** supported: there are only three, and they are recreated by hand under this model. Clearing them is done by the owner.

### 1.2 Glyph (composition)

Anything that can appear on the map has a glyph. It is **composed** into the def as a nested object, not inherited:

```ts
interface Glyph {
	symbol: string // 1-2 characters
	color: string // Tailwind text-* class
	bg: string // Tailwind bg-* class
}
```

There is no separate "invisible" concept: a thing meant to go unnoticed uses a glyph that blends in (section 2.1). Two defs may share the same glyph values: quicksand terrain and a deep-quicksand space look identical to the player.

**Sprites are deferred.** The eventual plan is a simple sprite editor with a limited palette (Ultima 3-5 / ACS style) that saves into one large sprite sheet; a sprite then replaces the glyph in the game and the editor. Until that work starts, the glyph is the only appearance.

The legacy category types that used to be in `map.ts` (`TileType`, `TileType2`, `TerrainTile`, `BuildingTile`, `CreatureTile`, `InventoryItemTile`, `StationaryTile`) were glyph and category information mixed into `TileDef`. They are removed (still in git history and the game repo): appearance is the `glyph`, and the category is the `kind` (item categories come later, see Open questions).

### 1.3 Kinds

| Kind       | Collection  | Kind-specific fields                                                                 |
| ---------- | ----------- | ------------------------------------------------------------------------------------ |
| `terrain`  | `tile_defs` | Today's `TileDef` fields minus the glyph and `isConsumable`: `moveCost`, `isWalkable?`, `encounterRate?`, `encounterTableKey?` |
| `object`   | `entities`  | `isSolid`, `moveCost?` (spaces only, default 1), `numberOfUses?`, `container?`, `interactions?` |
| `item`     | `items`     | `stackable`, `numberOfUses?`, `container?`, `interactions?` (reserved for item use, deferred). More as the inventory design settles; `category` is deferred |
| `creature` | `entities`  | Stub for now. Used by random encounters, not placed on the map                       |
| `portal`   | `entities`  | None beyond the base: always walkable; its destination is set per placement          |

`entities` holds several kinds and is filtered by `kind` on the server ([Backend 2]).

**Items** are things the player can pick up and keep in their inventory, which is what separates them from objects. The expected groups are weapons, armor, and usable items such as torches, keys, maps and magic items, but the item model is deliberately minimal for now (see Open questions). Nothing special happens to an item on the map: bumping into one picks it up if the player can carry it. That is engine behavior, not an interaction. A special **use** (a wand casting a spell, as with the single use option in Baldur's Gate, Ultima 5-6, Wizardry 6 and The Bard's Tale) is a separate piece of work that is deferred (see Open questions).

**Portals** are spaces with one specific job: moving the player to a `Destination`. They are their own kind because they are placed and validated differently from ordinary spaces.

```ts
interface Destination {
	zoneId: string // the target zone's _id
	pos?: Position // where the player arrives; absent = the zone's startingPosition
}
```

Entering a town, castle or dungeon normally lands the player on its `startingPosition`, so `pos` is usually left out. It is set when the arrival point is specific: leaving a town onto its icon on the world map, or a staircase arriving next to another staircase.

- **Entrances** sit on the world map with their own glyph, placed over the terrain: a cave mouth in the mountains, an elven village icon in the forest, a castle. The player enters by standing on one and pressing an **enter key** (`E`, as in Ultima 3-5), not by stepping onto it, so nobody walks into a town by accident. This is engine logic, not an interaction.
- **Exits** inside that zone lead back the other way and need not look like the entrance: a door or a cave mouth.
- Portals are for **narrow, explicit links** where one spot clearly leads to another: a dungeon entrance, a staircase, a trapdoor. Leaving across a zone's open edge is not a portal (section 2.2).
- Walking into a portal has its **own rules** (one-way, needs an item, single use). They are designed with the portals ([Tools 11]), not with object interactions.
- **The destination is per placement**, not per def. One "Staircase" def is placed many times, each placement with its own destination, instead of a def per staircase. As in Heroes of Might and Magic's editor, the tools **validate** the map and warn about any portal placement without a destination.

**Creatures do not move on the map and do not chase the player** (unlike Ultima 3-5). They appear only in random encounters. A non-combat NPC, such as a townsperson or a friendly gold dragon quest giver, is not a creature: it is a solid **object** with interactions (dialog when bumped). An interaction can still turn it hostile, for example an action that replaces the object with an encounter.

**Terrain has no interactions.** Its only behavior beyond movement is the chance of a random encounter, from its `encounterRate` and an encounter table chosen by the region's difficulty (zone `dangerLevel`) and the terrain. A dirt road in a low-level zone gives rats, deer or goblins; the same road in Hell gives demons.

**Uses (`numberOfUses`, name provisional).** Replaces `isConsumable`. How many times an object or item can be used before it disappears; absent means unlimited. Examples: a wheat field (Ultima 5) is used once, disappears, and gives 1 food; a torch is consumed when used; a wand has charges; a healing fountain has N uses. This is the lifetime of the **thing**; an interaction's `limit` (section 4.2) is the lifetime of one **interaction**. Remaining uses are runtime/save state, never zone data.

### 1.4 Spaces and objects (ACS mapping)

Adventure Construction Set had spaces, custom spaces, objects and custom objects. Here:

Spaces and objects are one `kind: 'object'`, told apart by `isSolid`:

- `isSolid: true` is an **object**: the player cannot occupy its cell (a wall, a bookshelf). The player bumps into it, which **costs no movement**.
- `isSolid: false` is a **space**: the player can stand on it, and the player's icon is drawn on top (a carpet, fire, quicksand). Entering it costs the space's `moveCost`, which defaults to 1; a def overrides it when something special is needed (quicksand costs more to get out of). Ultima 4's fire in the Tinker's forge is the model: several fire spaces, each costing extra movement and burning the player on the way to the Rune of Sacrifice.
- A **static effect** (fire burns N, a magic carpet that levitates the player) is an interaction on the def, triggered when the player enters the cell.
- **"Custom" is not a separate type.** A custom object or space is a placement that carries its own overrides (section 3). A fountain's def can carry one fixed interaction (restore 10 stamina). A townsperson's def carries a generic greeting, and a custom NPC's placement adds the dynamic part: its own dialog.

A cell is **blocked** if its terrain is not walkable or any placement in its stack is solid.

### 1.5 Terrain vs objects and spaces

Terrain and objects/spaces are distinct for the designer: terrain is **painted** onto the ground layer, objects and spaces are **placed** on top, each from its own palette.

Terrain is the ground layer and does not change. It is where **random encounters** live (`encounterRate`, `encounterTableKey`), so it dominates the open world. Objects and spaces are things placed on top, mostly decoration, so they dominate towns and buildings.

Some things could be either. A tree is normally terrain (it can carry an encounter rate), but it can also be an object when placed as decoration. A dangerous town that needs encounters uses special objects or spaces that start a set or random encounter, rather than encounter-bearing terrain.

### 1.6 Containers

Object and item defs may have the `container` capability. A chest is an object and a container; a bag is an item and a container.

```ts
interface ContainerSpec {
	capacity: number
	maxDepth?: number // total nesting levels, counting itself; absent, 0 or 1 = no nesting
}
```

- Containers may contain containers: a corpse holding a treasure chest holding a bag of reagents.
- Depth is a size question, so **each container def sets its own `maxDepth`**, counting itself. The corpse above needs 3 (corpse, chest, bag). `maxDepth` absent, 0 or 1 means it cannot hold other containers; there is no separate `allowNested` flag.
- `MAX_CONTAINER_DEPTH = 3` is the overall ceiling, enforced by both the tools and the engine. Raise it if a real case needs more.
- A Bag of Holding style container is just one with its own capacity.
- When the player uses a container, its contents are shown in stack order, with identical stackable items grouped ("4 spears").

---

## 2. Zones

```ts
interface Zone {
	id: string
	name: string
	dimensions?: { width: number; height: number }
	dangerLevel: number
	startingPosition?: Position
	terrain: string[][] // terrain def _ids, indexed [y][x]
	placements?: Record<CellKey, Placement[]>
	edgeExits?: Partial<Record<Direction, Destination>> // provisional, section 2.2
}
```

- **`terrain`** is unchanged: rows of terrain `_id`s, indexed `[y][x]`.
- **`placements`** is the layer of things on top of terrain. It is sparse (only cells that have something) and each cell's array is ordered **bottom to top**.
- **`CellKey`** is `"x,y"` (x first, no spaces). It is only ever built with the `cellKey(x, y)` helper, so `"x, y"` / `"y,x"` drift cannot happen.

### 2.1 Top of the stack

Only the **top** placement in a cell's stack is what the player interacts with. To hide something (a trap covering treasure, a mound covering a chest), the top placement must carry the interaction that reveals or triggers it.

The top placement's glyph is always what is drawn; there is no special "invisible" rule. Disguise is done by the designer choosing the top glyph:

- **Poisoned treasure:** the top is a poison object/space whose glyph looks like a chest or gold, so it seems safe.
- **Pirate cache:** the top is a mound whose glyph matches the surrounding ground. Moving onto or bumping it with a `HAS_ITEM pirate map` condition runs a list of `GIVE_ITEM` actions.

### 2.2 Edge exits

Leaving across a zone's edge needs no portal. When the player stands on an edge cell and moves off the map, the engine checks the zone's exit for that direction (`'north' | 'south' | 'east' | 'west'`). If there is one, the player moves to its destination. **If there is none, the move is blocked**: there is no automatic exit and no wraparound to the opposite side of the grid (unlike The Bard's Tale).

- **Open world** (Might and Magic 2 style: an overworld split into connected zones). Walking off an open edge loads the neighbouring zone. The player arrives at that zone's `startingPosition`, not at the matching spot on its edge. That can look odd, but it avoids lining positions up between zones.
- **Towns and castles** (Ultima 3-5 style). Walking off the edge leaves the town, and the edge exit's `pos` puts the player on top of the town's icon in the world zone. Since entering takes the enter key, landing on the icon does not send the player straight back in.
- **Dungeons** are walled all round, with a single portal as the entry and exit.

To stop players leaving anywhere, the designer walls most of the edge off and leaves narrow gaps. Rows of portals along an edge are the wrong tool.

---

## 3. Placements

A placement is one instance of a def on the map.

```ts
interface Placement {
	uid: string // generated; stable id for this instance
	defKind: Kind // with defId, a composite key: kind says which collection
	defId: string // the def's _id
	quantity?: number // for stackable items: "4 spears", not four rows
	interactions?: Interaction[] // per-instance overrides (section 4)
	contents?: Placement[] // for containers; nested, depth-limited
	destination?: Destination // portals only; required for a valid map
}
```

`uid` exists so runtime state (an interaction fired once, a placement removed) can refer to this instance without mutating zone data.

A stack may hold the same **stackable item** more than once, each its own placement with its own `quantity` (for example 100 gold and 200 gold, which random amounts will produce). The tools place a stackable item with `quantity: 1` and change it afterwards in the stack manager, not while placing. Objects and spaces are different: the same def can't go directly on top of itself.

---

## 4. Interactions

**Interactions belong to objects and spaces** (NPCs and chests included): on the def, and for the custom part on a placement. Terrain has none. Items have none on the map (bumping one picks it up). Special **item use** and **portal rules** are separate designs, deferred (see Open questions).

`ActionPayload` is retired. Its replacement (names _provisional_):

```ts
interface Interaction {
	id: string
	on: InteractionType // was ActionPayload.triggerOn
	conditions?: Condition[]
	hint?: string // shown when the conditions fail (section 4.7)
	actions: Action[]
	limit?: number // times it can fire; absent = unlimited, 1 = once
}
```

`Action` and `Condition` are **discriminated unions on `type`**, each type carrying only its own fields, not one bag of optionals. The old `tile` field is gone (appearance is the placement's def glyph).

`InteractionType` keeps today's values: `WALK`, `TALK`, `PICKUP`, `DROP`, `USE`, `OPEN`, `CLOSE`, `BUMP_INTERACT`. Stepping onto a space is `WALK` (one movement point), so fire and the pirate mound trigger `on: WALK`.

### 4.1 Precedence (which interaction runs)

For a trigger on the top placement of a cell:

1. Gather the **placement's** interactions first, then the **def's**.
2. Evaluate them in order. The **first** interaction whose conditions pass runs; the rest are skipped.

So a generic townsperson ("Hello good sirs! Welcome to X!") is an unconditional interaction on the def. A custom NPC adds its own interaction on the placement, which wins. A conditional custom interaction that fails falls through to the def's default.

### 4.2 Repetition

Interactions can be **unlimited** (a generic NPC's "Hello and welcome to town X"), **once** (the quest payout), or **limited to N** (a fishing spot that yields fish 10 times). That is `limit`: absent, `1`, or `N`.

- An interaction's count goes down only when it **runs**. If its conditions fail, it stays and nothing is used up: a player with 9 of 10 bones gets the "bring me more" dialog, and the payout is still there for later.
- Once an interaction has used up its `limit`, it is removed from that placement's runtime copy and is skipped from then on.
- The count is tracked in runtime/save state per (placement `uid`, interaction `id`), never in the authored zone data.
- Richer rules (a WoW-style daily quest, which needs a notion of time) are future work. The model only needs conditions plus limits for the basic cases now, and grows as interactions and objects are designed.
- The engine never re-queues actions. This replaces `popOnComplete` and removes its infinite-loop design.
- Interacting with something never removes it. Removal is an explicit `REMOVE_SELF` action.

### 4.3 Initial conditions

| Type           | Fields             |
| -------------- | ------------------ |
| `HAS_ITEM`     | `itemId`, `amount` |
| `FLAG_SET`     | `flag`             |
| `FLAG_NOT_SET` | `flag`             |

- **All of an interaction's conditions must pass.** There is no "or" yet (see Open questions).
- `HAS_ITEM` only **checks**: the item stays with the player. A reusable password item that several guards ask for uses `HAS_ITEM` alone. A key that is used up pairs it with a `TAKE_ITEM` action.
- `amount` defaults to 1. The editor only offers it when the chosen item is `stackable` (keys, arrows, torches), since a non-stackable item is always 1.

### 4.4 Initial actions

`SHOW_DIALOG`, `GIVE_ITEM`, `TAKE_ITEM`, `GIVE_CURRENCY`, `SET_FLAG`, `SPAWN { defKind, defId, quantity? }` (adds to this cell's stack at runtime), `REMOVE_SELF`, `TELEPORT { destination }`, `PLAY_SOUND`, `MODIFY_ATTRIBUTE`.

The engine implements them incrementally ([Game 2]). Fields not listed here are decided when each type is written.

**Stat changes (`MODIFY_ATTRIBUTE`).** One action changes any numeric stat of a character. `GIVE_XP` is not a separate type: experience is just another stat.

```ts
{
	type: 'MODIFY_ATTRIBUTE'
	attribute: CharacterStat // 'strength' | 'dexterity' | 'intelligence' | 'wisdom' | 'personality' | 'speed' | 'constitution' | 'hp' | 'sp' | 'xp' | 'level'
	amount: number // negative allowed
	bar?: 'current' | 'max' // hp and sp only; absent = current
	target?: 'character' | 'party' // absent = character
}
```

- **Permanent changes only.** The amount changes the character's stored value. Timed buffs and penalties are not designed yet (see Open questions).
- **`bar`** only means something for `hp` and `sp`, which are bars with a current and a max. `current` is healing or damage (a fountain, fire). `max` is a permanent boost (a Might and Magic barrel); the engine raises the current value by the same amount.
- **`target`** is `character` or `party`. A fountain that cures poison is `character` (the engine asks the player which one); a quest reward or Lord British's party heal is `party`. Fire in Ultima 4 hurts everyone, so it is `party`. Who "the character" is when nobody chooses is the engine's decision.
- **`xp`** is flat and additive. **`level`** grants (or, if negative, drains) levels, and the engine works out the XP that implies.
- The name `MODIFY_ATTRIBUTE` and its `attribute` key are historical (they predate hp, sp and xp being included). The editor labels the action "Change a stat". Names are provisional.
- Existing documents with no `bar` or `target` keep working (they read as `current` and `character`). An `attribute` value that is not in the list, such as the old free text "stamina", is shown as unknown in the editor until it is re-selected.
- When an attribute rises or falls, the engine recomputes whatever depends on it (carry weight from strength, and so on). That is engine behavior, not authored.

### 4.5 Worked example: quest giver

"Bring me 10 vulture bones." Three interactions on the NPC, all `on: TALK`:

1. `limit: 1`, conditions `[HAS_ITEM bones x10]`, actions `[TAKE_ITEM bones x10, MODIFY_ATTRIBUTE xp +150 (party), GIVE_CURRENCY 20 silver, GIVE_ITEM <reward>, SET_FLAG quest_done, SHOW_DIALOG "Thanks"]`.
2. Conditions `[FLAG_NOT_SET quest_done]`, actions `[SHOW_DIALOG "Bring me 10 bones"]`.
3. No conditions, actions `[SHOW_DIALOG "Thanks again"]`.

The NPC never despawns.

### 4.6 Custom values

An action's (or condition's) value can be left for each placement to fill in, so one def serves many instances: a generic townsperson greets everyone the same way, while a custom NPC (or a chest) gets its own dialog (or contents) on its placement, and one quest giver def asks for a different item on each NPC. It is marked `custom: true`.

**The general rule: custom means the value, the amount and any other properties are decided at placement.**

```ts
{ type: 'SHOW_DIALOG'; text: string } | { type: 'SHOW_DIALOG'; custom: true }
{ type: 'SPAWN'; defKind; defId; quantity? } | { type: 'SPAWN'; custom: true }
{ type: 'GIVE_ITEM'; itemId; amount? } | { type: 'GIVE_ITEM'; custom: true }
{ type: 'TAKE_ITEM'; itemId; amount? } | { type: 'TAKE_ITEM'; custom: true }
{ type: 'HAS_ITEM'; itemId; amount } | { type: 'HAS_ITEM'; custom: true } // a condition
```

Rules:

- **A custom action or condition carries no value.** `text`, or `defKind`/`defId`/`quantity`, or `itemId`/`amount`, are absent. The tools do not validate them and do not save them: checking the box in the interaction editor clears them, and the schema strips them if they arrive anyway. A custom item reference's **amount** is set on the placement too.
- **A non-custom action is unchanged:** its value is required and `custom` is not stored (never `custom: false`).
- **Only some types can be custom:** the actions `SHOW_DIALOG`, `SPAWN`, `GIVE_ITEM` and `TAKE_ITEM`, and the condition `HAS_ITEM`. Every item reference gets the checkbox. A type opts in with `customizable` in the editor's action or condition registry (`lib/utils/interactions.ts`).
- **The def only says "a value goes here."** The value itself is set on the placement, in the zone editor's stack manager ([Tools 12]). A placement's interaction carries the real value, normally as the same action type with its value filled in and no `custom` flag.
- **Not decided yet:** how the stack manager lists the custom slots of a def and how a placement fills them; and what the engine does at runtime when a custom value is still empty (the working assumption: a custom **action** is skipped; a custom **condition fails**, so the interaction doesn't run and the fallback takes over).
- **Making sure placements fill custom values in.** When a zone is saved, the zone builder validates it (including empty custom values and portals with no destination). The zone is still saved, since the designer must not lose work, but it is marked as a draft, and the game does not treat a draft zone as complete or playable until it has been validated. The shape of that state is designed in [Tools 16].

### 4.7 Feedback (engine behavior and hints)

- **Interacting with an object always tells the player something.** There is no "look" command yet, so at minimum the object's `name` and `description` go to the game log when the player interacts with it. This is game-side behavior, not authored per interaction.
- **When an interaction's conditions fail, the player gets a message saying what is missing.** By default the engine builds it from the conditions ("The chest requires Rusty Key"). An interaction may carry an optional `hint` that **replaces** the default, so a puzzle doesn't give its answer away ("The lock has a dragon's head on it").
- The tools only store `hint`. It is offered in the editor only when the interaction has conditions.
- **Which message is shown when nothing passes:**
  - If **one** conditional interaction applies and fails, the player sees its `hint`, else the default message. The default lists only the requirements still **missing** (a door that needs two ruby eyes, with one held, says it needs one).
  - If **several** conditional interactions fail (the same locked door can be opened with a key or a crowbar), the engine does not pick one. It shows the object's `description` and ignores their hints. The author uses the description to say what is needed, or to hint at it ("A dragon's head is carved above the lock").
  - An unconditional fallback interaction (a "locked" dialog) makes all of this moot.
- **Not designed, on purpose:** evolving flavor text (the door's text changes after one of two gems is inserted) and per-object interfaces (Wizardry 6's door and chest menus, where the player picks a method). Both are more than the current milestones need. Evolving text would probably become a kind of interaction later.

---

## 5. Authored vs runtime

Zone JSON is the **initial state only**. When a game starts, the player gets a runtime copy of the zones, and that copy is what changes as the player interacts with the world. Spawns, removals, interaction counts and remaining uses live in runtime state and the save file. Zone data is never mutated.

---

## 6. Storage and cross-repo

**Collections:**

| Collection  | Holds                                                    |
| ----------- | -------------------------------------------------------- |
| `tile_defs` | Terrain defs                                             |
| `items`     | Item defs                                                |
| `entities`  | Object, creature and portal defs (by `kind`)             |
| `zones`     | Zones                                                    |
| `events`    | Reserved, unused (kept in case reusable interaction templates are ever saved) |

`maps` is redundant with `zones` and is removed from the allow-list ([Backend 4]).

**Backend:** stays a schema-less generic store with one entry point. `GetAll` gains string equality filters, sort, and limit/offset ([Backend 2]). It knows nothing about `kind`.

**Shared types:** `frontend/src/lib/types/map.ts` stays hand-copied to the game repo (no shared package, on purpose), so it must not import tools-only code. The game resolves everything by `_id`.

---

## Open questions

- **Content delivery.** Does the game fetch from the backend or load an export in `public/data`? Decided in [Game 1].
- **Item category and the item model.** Deferred on purpose; expect the item schema to change often while the inventory is designed one item type at a time. Leanings so far:
  - Categories live in the DB, not as a code enum, so adding one is data rather than a release. That would need a new allow-listed collection (the backend currently has no categories collection).
  - No subcategories and no recursive category logic.
  - Variants (sword vs long sword, chain mail vs elven chain mail +5) are extra attributes on an item, not an inheritance hierarchy. An armor item might carry a location (helmet, boots, ...) while staying in the armor category.
  - The item builder may grow one form per category, with shared fields (weight, sale value) in common.
  - Character skills (a "swords" skill covering all swords) come later; AD&D-style specialization is not decided.
- **Gold and currency.** Deferred. Undecided whether currency is a pooled resource, a per-character stat, or an inventory item with weight, and whether the party can split across locations. `GIVE_CURRENCY` is a placeholder action until then, and gold can be a plain stackable item meanwhile.
- **Item use.** What using an item does (a wand casting a spell; thieves' tools used on an NPC to get gold) and how it is described. Probably the same Interaction shape with `on: USE`, with conditions (a pickpocket check against the character's skill percentage) and a limit on uses (99, or 1d100). That is why `ItemDef.interactions` stays. Deferred; not part of the object interactions work.
- **Portal rules.** One-way, needs an item, single use, and where they live in the data. Designed with the portals ([Tools 11]) when the first interior building is built.
- **Boolean logic and branching in conditions.** Today all conditions must pass (AND). Out of scope for the current milestones, so nothing is implemented:
  - **NOT is the first operator wanted**, as a general operator rather than a negated twin per condition (`FLAG_NOT_SET` is the only twin so far, and a `NOT_HAS_ITEM` would be the next). Use cases so far: a quest giver that only offers the quest to a player who does **not** carry the quest item; a reminder dialog that stops once a quest flag is set; a guard who only admits someone not carrying a weapon. When it is designed, decide what happens to `FLAG_NOT_SET` (kept, or replaced by NOT around `FLAG_SET`). Tracked by [Interactions 9].
  - A simple `or`/`and` grouping is the likeliest next step if it's needed.
  - Much of "either/or" is already covered by precedence (section 4.1): a first interaction that needs the thing, then a fallback. A toll-bridge troll that takes 5000 gold, otherwise fights, is that: pay (conditions: has gold) then a fallback that spawns an encounter.
  - What is not covered is a **player's choice** (Wizardry 6's troll asks "pay or fight?"). That needs dialog with choices, which is a tree. No trees for now.
  - A quest giver with several quests, each unlocking the next, is the same class of problem. The first quest giver is a single happy path.
- **Temporary stat effects.** Timed buffs and penalties (a potion of strength for ten minutes, a curse that wears off) need a duration and a way to undo them. The use case exists but is not needed for the current milestones, so `MODIFY_ATTRIBUTE` only makes permanent changes for now.
- **XP and level.** Which is the source of truth is the engine's decision: either the game knows the XP each level needs and XP decides the level, or the level decides and XP is derived. The tools allow both a flat `xp` grant and a `level` grant. Level drain by monsters (vampires, wraiths, as in AD&D, taking 1-2 levels a hit) is combat, not an interaction, but the engine will need to convert levels back to XP the same way.
- **Skill checks.** A locked chest opened by a character's lock picking (a thief's skill percentage) is a different object from one that needs a specific key (the dragon's key), though they look alike. It needs a condition type that reads a character skill, so it waits for character skills (deferred). Probably a new condition type, not a variant of `HAS_ITEM`. Bashing a door (a strength check) and a Knock spell are the same kind of thing. In Wizardry 6 these are methods the player picks from a menu on the door; here, until there is such a menu, each method would be a separate interaction (section 4.7 covers what the player sees when all of them fail).
