# Zone lessons

A log of how each generated zone was built and what the owner corrected. Its purpose is to inform a future map generator (a rules engine, and extra attributes on anything placeable; see `project-procgen-goal`). Nothing here is a rule yet. A pattern that keeps repeating is the owner's to promote into `SKILL.md`.

Append one entry per run, newest last, in this shape. Keep entries short and factual; record what was *decided*, not a narrative.

```
## <ZONE_ID> (<date>) <size>, difficulty <n>
- Spec: the description, in a line.
- Layout: the approach (walls ring, rooms, focal points, where things went and why).
- Defs: reused / created.
- Spec asked for, model couldn't hold:
- Went wrong / owner corrected:
- Candidate attributes or rules this suggests:
```

## SMALL_HUT (2026-11-07) 8x8, difficulty 0
- Spec: a peasant one-room hut; hay bed, lit cauldron, small box of rags, weak wooden door, dirt floor, plank walls.
- Layout: plank wall ring, door centred on the south wall, player starting just inside it. Bed and cauldron in the two north corners, box against the west wall. The middle was left empty. Composed by hand and built with a script (`frontend/.sandbox/small_hut_zone.mjs`).
- Defs: reused `DOOR`. Created `DIRT_FLOOR`, `WOODEN_WALL`, `HAY_BED`, `CAULDRON`, `SMALL_BOX`, `RAGGED_CLOTHES` (6 new sprites, all in review).
- Spec asked for, model couldn't hold: "weak" door (no durability on a portal).
- Went wrong / owner corrected: (to fill in after review). Process notes: there was no zone skill, so the proposal and layout were improvised; I asked about the door destination when the spec named none (now a rule: it means unconnected).
- Candidate attributes or rules this suggests: a placeable might carry a "belongs against a wall / in a corner / in the open" hint; a focal object (cauldron) wanted a clear approach cell; the player's start next to the door.
- Redo 1 (2026-11-08): note "needs a small table and chair". Reused `TABLE` and `CHAIR` (both already existed, sprites approved), placed table at (5,4) and chair at (4,4) beside it, in the open middle of the room that was left empty. No new defs. Suggests: my first pass left the middle empty because the spec listed no furniture; a hut with a bed and a cauldron but nowhere to sit read as thin. A room-type default of "somewhere to sit and eat" may be a rule worth trying.

## STARTING_TOWN (2026-11-10) 16x16, difficulty 0
- Spec: a small farming community; a few huts leading to SMALL_HUT, one hut to FARM_HOUSE, one tavern to STARTING_TAVERN; farmers/peasants, a wheat field lower right, a well, a chicken; no exit to other zones; and update the doors in those interiors to lead back to the town.
- Layout: ring of trees on the border (blocks every edge, since there are no edge exits). A dirt road crossing at (7,8), one tile wide, so no solid NPC stands on it. Buildings sit one cell off the road with the road cell in front as the arrival spot. Well beside the crossroads, wheat field (on dirt) in the lower right, farmers and peasants on grass beside the roads, chickens near the field and the south road. Start on the road just south of the crossroads. Built with one `create_doc` (`terrainRows`, five explicit portal placements, the rest as `fills`), no script.
- Defs: reused `FARMER`, `CHICKEN`, `DOOR`, and the sprites `TREE` and `WELL` (approved, no def existed). Created `TREE`, `WELL`, `WHEAT_FIELD`, `PEASANT` (objects) and `HUT`, `TAVERN` (portals); 4 new sprites (`HUT`, `TAVERN`, `WHEAT_FIELD`, `PEASANT`, all in review). `PEASANT` says "Good day to you." (my line, the spec gave none).
- Destinations: town doors lead to the interiors' start positions (no `pos`). The interiors' doors were re-added with `replace_doc` `changes` (remove the `DOOR`, add it back with a destination), leaving their status alone: STARTING_TAVERN 7,15 and SMALL_HUT 3,7 now lead to the town, and FARM_HOUSE 8,12 (was the sample STARTING_ZONE) too. The landing cell is the road cell in front of the matching building.
- Spec asked for, model couldn't hold: one SMALL_HUT exit door can lead back to only one of the three huts (Trello Portals 8).
- Went wrong / owner corrected: (to fill in after review). Process note: a fill puts its placements on top of explicit ones, so an NPC and a fill on the same cell would hide the NPC; I kept them on separate cells.
- Candidate attributes or rules this suggests: a building footprint of one portal tile reads thin next to a 16x16 town; a "front cell" (where a door faces) would let a generator place the arrival spot itself; a border of solid objects is the cheapest way to close a zone with no edge exits.

## WINE_CELLAR (2026-11-22) 16x16, difficulty 0 (STARTING_AREAS)
- Spec: a wine cellar of racks (decorative solid objects); stairs from STARTING_TAVERN; a summoning object spawning GOBLIN_ASSISTANT_BOSS and up to 4 RATs, with the GOBLIN_HEAD under it; a SHORT_SWORD and LEATHER_ARMOR; encounter tucked in a corner, surrounded by racks but bumpable; no other encounters.
- Layout: stone-floor terrain, `WALL` ring, stairs centred on the south wall with the start just inside. Four horizontal rows of `WINE_RACK` (y 2, 5, 8, 11, x 5-13) make aisles open at both ends. The summoning circle sits in the NW corner (1,1) behind a one-wide alcove: a rack column at x=2 (y 1-4) on its east, the ring wall on the other sides, open to the south down column x=1. Head under the circle (stack: head, circle). Sword and armor in aisle cells at the east side (13,6), (13,13). Built with one `create_doc`, no script.
- Defs: reused `WALL`, `STAIRS`, `STONE_FLOOR`, `GOBLIN_HEAD`, `SHORT_SWORD`, `LEATHER_ARMOR`, the two monsters. Created `WINE_RACK` and `SUMMONING_CIRCLE` (objects; 2 sprites in review). The circle is the first def with the `SPAWN_MONSTER` action (always custom, [Combat 7]); its placement holds the groups: boss x1, RAT x3 (set, since the rat's rolled 2d6 could pass 4), no `showAs`, so it looks like a circle.
- Spec asked for, model couldn't hold: stairs from STARTING_TAVERN: the tavern has no stairs placement to repoint, and the skill only repoints existing doors, so none was added there. The cellar's own stairs have no destination (none named).
- Went wrong / owner corrected: (to fill in after review).
- Candidate attributes or rules this suggests: "surrounded but reachable" was easiest as a dead-end alcove one cell wide; a generator wants a notion of an approach cell for a focal object.
