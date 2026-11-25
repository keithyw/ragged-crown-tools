// The rarity tiers behind `MonsterRarity` (lib/types/defs.ts), most common
// first. Only the list lives here: what each tier is worth as odds is the
// game's to tune ([Monsters 10], [Combat 24]).
//
// The schema file imports this one by a relative path (not '@/'), because the
// MCP runs it through tsx (ARCHITECTURE.md 6.1).
import type { MonsterRarity } from '../types/defs'

type AllListed<U, L extends readonly U[]> = [Exclude<U, L[number]>] extends [
	never,
]
	? true
	: false

export const MONSTER_RARITIES = [
	'common',
	'uncommon',
	'scarce',
	'rare',
	'very rare',
	'ultra rare',
] as const satisfies readonly MonsterRarity[]
export const monsterRaritiesComplete: AllListed<
	MonsterRarity,
	typeof MONSTER_RARITIES
> = true
