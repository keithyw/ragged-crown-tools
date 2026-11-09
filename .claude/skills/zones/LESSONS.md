# Zone lessons

A log of how each generated zone was built and what the owner corrected. Its purpose is to inform a future map generator (a rules engine, and extra attributes on anything placeable; see `project-procgen-goal`). Nothing here is a rule yet. A pattern that keeps repeating is the owner's to promote into `SKILL.md`.

Append one entry per run, newest last, in this shape. Keep entries short and factual; record what was *decided*, not a narrative.

```
## <ZONE_ID> (<date>) <size>, danger <n>
- Spec: the description, in a line.
- Layout: the approach (walls ring, rooms, focal points, where things went and why).
- Defs: reused / created.
- Spec asked for, model couldn't hold:
- Went wrong / owner corrected:
- Candidate attributes or rules this suggests:
```

## SMALL_HUT (2026-11-07) 8x8, danger 0
- Spec: a peasant one-room hut; hay bed, lit cauldron, small box of rags, weak wooden door, dirt floor, plank walls.
- Layout: plank wall ring, door centred on the south wall, player starting just inside it. Bed and cauldron in the two north corners, box against the west wall. The middle was left empty. Composed by hand and built with a script (`frontend/.sandbox/small_hut_zone.mjs`).
- Defs: reused `DOOR`. Created `DIRT_FLOOR`, `WOODEN_WALL`, `HAY_BED`, `CAULDRON`, `SMALL_BOX`, `RAGGED_CLOTHES` (6 new sprites, all in review).
- Spec asked for, model couldn't hold: "weak" door (no durability on a portal).
- Went wrong / owner corrected: (to fill in after review). Process notes: there was no zone skill, so the proposal and layout were improvised; I asked about the door destination when the spec named none (now a rule: it means unconnected).
- Candidate attributes or rules this suggests: a placeable might carry a "belongs against a wall / in a corner / in the open" hint; a focal object (cauldron) wanted a clear approach cell; the player's start next to the door.
- Redo 1 (2026-11-08): note "needs a small table and chair". Reused `TABLE` and `CHAIR` (both already existed, sprites approved), placed table at (5,4) and chair at (4,4) beside it, in the open middle of the room that was left empty. No new defs. Suggests: my first pass left the middle empty because the spec listed no furniture; a hut with a bed and a cauldron but nowhere to sit read as thin. A room-type default of "somewhere to sit and eat" may be a rule worth trying.
