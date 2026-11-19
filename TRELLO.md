# Trello conventions

How cards on the "Ragged Crown Tools" board are written and tracked. Decided by the owner on 2026-11-19. These apply to every card from now on; older cards are brought in line when they are touched, not in bulk.

## Where a card goes

- **Design cards belong on the Design list.** They hold the high-level thinking and should be easy to review there. A design card is finished when its decisions are written down (the card, and `DATA-MODEL.md` when the model changes). The build work it leads to is separate cards on the working lists.

## What a card contains

- **Acceptance Criteria** is the "done" definition: a section of the description, written as a checklist the owner can eyeball. A card is done when every criterion is met.
- **Related stories and tasks are criteria.** A card that depends on other cards lists them as acceptance criteria, so it can't be finished while they are open.
- **Blockers** is its own subsection, next to Acceptance Criteria. A blocker is any unresolved ticket or any question still open. When a card has none, the section says so or is left out.
- **No "As a user..." stories.** Write what must be true or what gets built, in plain words.

## Mini-epics

Anything that affects many cards is an epic. Trello has no epic type, so:

- The card name has `EPIC:` after its number: `[Inventory 17] EPIC: Qualifiers on given or placed gear`.
- The card carries the `Epic` label.
- Its related cards are the checklist named **Acceptance Criteria**, one item per card, so the epic can't be finished while any is open. Any other criteria go in the description's Acceptance Criteria section.
- The cards are the source of truth for done; the checklist mirrors them.
