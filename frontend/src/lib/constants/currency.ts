// The one conversion map ([Currency 3], DATA-MODEL.md 8). The game keeps a copy
// in its src/constants/currency.ts: keep them in step.
//
// The relative import is for the MCP, which runs this through tsx and doesn't
// resolve '@/' (ARCHITECTURE.md 6.1).
import type { Currency } from '../types/currency'

// What one coin is worth in bronze, the smallest, so every value is a whole
// number: in copper, bronze would be 0.2, and sums of it drift in floating
// point. Lowest to highest; `Record` makes tsc fail if a currency is missing.
export const CURRENCY_VALUES: Record<Currency, number> = {
	bronze: 1,
	copper: 5,
	iron: 25,
	silver: 50,
	gold: 500,
	platinum: 1500,
}

// The currencies, lowest to highest.
export const CURRENCIES = Object.keys(CURRENCY_VALUES) as Currency[]

// A currency item's `id` is its currency in capitals (`GOLD` is 'gold'); the
// game matches on it when coins are picked up ([Currency 4]).
const CURRENCY_ITEM_IDS = CURRENCIES.map((c) => c.toUpperCase())

// Why an `isCurrency` item can't have this id, or undefined if it can. Used by
// the item form and the MCP.
export const currencyIdProblem = (id: string | undefined) =>
	id && CURRENCY_ITEM_IDS.includes(id)
		? undefined
		: `A currency item's ID must be one of ${CURRENCY_ITEM_IDS.join(', ')}`
