---
name: objects
description: Make, redo or adjust Ragged Crown object definitions (solid objects such as a wall or a bar counter, and spaces such as a rug or fire, placed on the map) in the sandbox so the owner can review them. Use when asked to create or tweak objects, furniture, scenery or spaces. Does not create interactions.
---

# Objects

**Read `.claude/skills/shared/RULES.md` first.** It holds the rules every creation skill follows: the hierarchy and reuse, where you may write, ids, glyphs, sprites, batches, fixing and what not to do. This file is only what is particular to objects.

An object def is something placed on top of the terrain: scenery, furniture, a chest. It is one `kind: "object"`, told apart by `isSolid` (DATA-MODEL.md 1.4, 1.5).

- Collection: `entities`, `kind: "object"`. The collection also holds creatures and portals; don't touch those here.
- Sprite category: `object`.
- Batch cap: the default, 10.
- Extra proposal columns: solid or space (and `moveCost` if set), `container` capacity if any, the behaviour you are leaving out if the request implied one.
- Sandbox UI page: object definitions.

**This skill does not create interactions** (dialogue, keys, effects, quest givers). A def made here is a body: it blocks, decorates or holds things, and does nothing when the player bumps it. When a request needs behaviour, create the body, say plainly what behaviour was left out, and let the owner add it in the interaction editor in the UI. Interactions get their own skill later (Trello [Skills 9], v2).

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
- Don't send `interactions`.

## Match what exists

Read the existing objects before proposing, with names only (the full documents are long):

```bash
curl -s "localhost:8080/collection/entities?kind=object" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(d=>d.id+" ("+d.name+", "+(d.isSolid?"solid":"space")+")").join(", ")))'
```

Several object sprites exist without a matching def, so look at those before drawing.

## Glyph conventions

A single symbol on `bg-black`, often an emoji, as the existing objects do.

## Fixing one

Many existing objects carry `interactions`, so this is the case the shared rule about sending them back is for. Don't change them.
