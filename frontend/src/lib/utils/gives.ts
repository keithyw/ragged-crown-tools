// Relative imports only: the schemas use this, and the MCP runs them through
// tsx, which doesn't resolve '@/' (ARCHITECTURE.md 6.1).
import type { GiveEntry, GiveFields } from '../types/interactions'

// What a GIVE_ITEM (an action or a placement's value) hands over. One stored
// before lists ([Interactions 18]) held a single item in its own fields, and
// reads as a list of one with no `uid`.
export const giveEntries = (give: GiveFields): GiveEntry[] => {
	if (give.items) return give.items
	const { itemId, amount, qualifiers, chance, giveLimit, target } = give
	if (!itemId) return []
	return [
		{
			itemId,
			...(amount !== undefined && { amount }),
			...(qualifiers && { qualifiers }),
			...(chance !== undefined && { chance }),
			...(giveLimit !== undefined && { giveLimit }),
			// 'character' is what absent means, so it isn't stored.
			...(target === 'party' && { target }),
		},
	]
}
