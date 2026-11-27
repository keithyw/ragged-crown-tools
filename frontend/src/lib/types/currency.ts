// Currency (DATA-MODEL.md 8, [Currency 3]). Shared with the game (listed in
// shared.ts): types only. The rates are in lib/constants/currency.ts. What a
// character holds (`CharacterCurrency`) is the game's own type.

// Lowest to highest. A currency item's `id` names one of these in capitals
// (`GOLD` is 'gold').
export type Currency =
	'bronze' | 'copper' | 'iron' | 'silver' | 'gold' | 'platinum'
