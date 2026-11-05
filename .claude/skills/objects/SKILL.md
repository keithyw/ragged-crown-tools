---
name: objects
description: Make, redo or adjust Ragged Crown object definitions (solid objects such as a wall or a bar counter, and spaces such as a rug or fire, placed on the map) in the sandbox so the owner can review them. Use when asked to create or tweak objects, furniture, scenery, spaces or simple talking characters. Creates only simple dialog interactions.
---

# Objects

**Read `.claude/skills/shared/RULES.md` first.** It holds the rules every creation skill follows: the hierarchy and reuse, where you may write, ids, glyphs, sprites, batches, fixing and what not to do. This file is only what is particular to objects.

An object def is something placed on top of the terrain: scenery, furniture, a chest. It is one `kind: "object"`, told apart by `isSolid` (DATA-MODEL.md 1.4, 1.5).

- Collection: `entities`, `kind: "object"`. The collection also holds creatures and portals; don't touch those here.
- Sprite category: `object`.
- Batch cap: the default, 10.
- Extra proposal columns: solid or space (and `moveCost` if set), `container` capacity if any, what it says when bumped (the line, if it has dialog), the behaviour you are leaving out if the request implied one.
- Sandbox UI page: object definitions.

**Interactions: simple dialog only.** An NPC or sign can say a fixed line, or leave the line to each placement; the rules are in "Simple interactions" in `RULES.md` (Trello [Skills 14]). Everything else (keys, items given or taken, conditions, limits, stat effects, quest givers) is **not created here yet**: make the body, say plainly what behaviour was left out, and let the owner add it in the interaction editor in the UI. Other objects get no interactions at all.

## Object, space or item?

- **Solid object** (`isSolid: true`): the player cannot stand there and bumping it costs no movement. A wall, a bar counter, a bookshelf, a barrel.
- **Space** (`isSolid: false`): the player can stand on it, and the player's icon is drawn on top. A rug, a bed, fire, a puddle. Its sprite should look flat, like something on the floor.
- **Item**: carried by the player (a spear, a torch, a key). That is the items skill, not this one. A plate on a shelf is scenery, so an object; a goblin head the player takes is an item.

## Document

```json
{
  "id": "BAR_COUNTER", "kind": "object", "name": "Bar counter",
  "description": "A long oak counter, ringed with old cup marks.",
  "glyph": { "symbol": "=", "color": "text-amber-500", "bg": "bg-black" },
  "spriteId": "<the _id of its sprite>",
  "isSolid": true
}
```

- `isSolid`: required, **always set it**, `true` or `false`.
- `moveCost`: spaces only. Leave it out for a solid object (the forms drop it) and leave it out for an ordinary space too, since it defaults to 1. Set it only when entering should be harder (quicksand, deep mud): a whole number, 0 or more.
- `numberOfUses`: how many times the thing can be used before it disappears; 1 or more; absent is unlimited. Nothing uses an object until it has interactions, so leave it out unless asked.
- `container`: `{ "capacity": n }` for a chest, barrel, cabinet or corpse that holds things, `capacity` 1 or more. `maxDepth` only if it may hold other containers, counting itself (2 holds a bag that holds items); the engine caps it at 3. Leave it out for anything that doesn't hold things.
- `interactions`: only the simple dialog from `RULES.md`, and only on something that talks. A person who says "Howdy!":

```json
{
  "id": "FARMER", "kind": "object", "name": "Farmer",
  "description": "A weathered farmer in a straw hat.",
  "glyph": { "symbol": "👨", "color": "text-yellow-600", "bg": "bg-black" },
  "spriteId": "<the _id of its sprite>",
  "isSolid": true,
  "interactions": [
    { "id": "<uuid>", "on": "BUMP_INTERACT", "actions": [{ "type": "SHOW_DIALOG", "text": "Howdy!" }] }
  ]
}
```

A person is solid (DATA-MODEL 1.3). The sprite is a person, so it follows the sprite steps like any other object.

## Match what exists

Read the existing objects before proposing, with names only (the full documents are long):

```bash
curl -s "localhost:8080/collection/entities?kind=object" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(d=>d.id+" ("+d.name+", "+(d.isSolid?"solid":"space")+")").join(", ")))'
```

Several object sprites exist without a matching def, so look at those before drawing.

## Glyph conventions

A single symbol on `bg-black`, often an emoji, as the existing objects do.

## Fixing one

Many existing objects carry `interactions` far beyond the simple dialog (keys, chests, quest givers), so this is the case the shared rule about sending them back is for. Send them back unchanged, and don't add to them.
