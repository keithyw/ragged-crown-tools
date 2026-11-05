---
name: portals
description: Make, redo or adjust Ragged Crown portal definitions (doors, stairs, trapdoors, cave mouths and other spots that take the player to another zone) in the sandbox so the owner can review them. Use when asked to create or tweak portals, doors or stairs that lead somewhere. Does not set destinations or create interactions.
---

# Portals

**Read `.claude/skills/shared/RULES.md` first.** It holds the rules every creation skill follows: the hierarchy and reuse, where you may write, ids, glyphs, sprites, batches, fixing and what not to do. This file is only what is particular to portals.

A portal def is a spot that moves the player to another zone: a door into a building, stairs, a trapdoor, a dungeon entrance, a cave mouth, a castle or village icon on the world map (DATA-MODEL.md 1.3, 2.2). It is its own `kind: "portal"`.

- Collection: `entities`, `kind: "portal"`. The collection also holds objects and creatures; don't touch those here.
- Sprite category: `portal`.
- Batch cap: none.
- Extra proposal columns: `twoWay`, the behaviour you are leaving out if the request implied one.
- Sandbox UI page: portal definitions.

**This skill makes the def only.** Two things are out of scope:

- **Destinations.** Where a portal leads is set **per placement** in the zone builder (`Placement.destination`), not on the def, so one `STAIRS` def serves every staircase. Don't try to set one here.
- **Interactions.** A key requirement, a locked-door message or an effect (the real `LOCKED_DOOR` has a WALK interaction that checks for an item) is not created here. When a request implies one, create the plain portal, say plainly what was left out, and let the owner add it in the UI. Interactions get their own skill later.

## Portal or object?

A portal takes the player to **another zone**. A door that is only scenery, a gate that stays shut, a hatch painted on a wall: those are objects, not portals, and the objects skill makes them. When a request mixes them ("the doors for a house"), ask what the door does only if it isn't clear; otherwise assume doors the player walks through are portals. Portals are always walkable, so they have no `isSolid` and no `moveCost`.

## Document

```json
{
  "id": "TRAPDOOR", "kind": "portal", "name": "Trapdoor",
  "description": "A heavy wooden hatch set into the floor.",
  "glyph": { "symbol": "▣", "color": "text-amber-500", "bg": "bg-black" },
  "spriteId": "<the _id of its sprite>",
  "twoWay": false
}
```

- `twoWay`: **required, always set it**, `true` or `false`. The zone builder doesn't use it yet: every portal is treated as one way (the owner's decision, DATA-MODEL.md 1.3). It is stored for later validation, so use `false` unless the owner says a portal is meant to work both ways.
- Don't send `interactions`, `isSolid`, `moveCost` or a destination.

## Match what exists

Read the existing portals before proposing, with names only (the full documents can be long):

```bash
curl -s "localhost:8080/collection/entities?kind=portal" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(d=>d.id+" ("+d.name+", "+(d.twoWay?"two way":"one way")+")").join(", ")))'
```

A def is needed per **look** (a door and a trapdoor), not per destination: ten doors to ten places are one `DOOR` placed ten times.

## Glyph conventions

A single symbol on `bg-black`, often an emoji, as the existing portals do.
