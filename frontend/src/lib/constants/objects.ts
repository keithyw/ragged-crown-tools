// Why an object def can't be saved as it is, or undefined ([Tools 31]). The
// object form and the MCP both ask, as they do for currency items. Relative
// imports only, if any are added: the MCP runs this through tsx.
export function moveWeightProblem(def: {
	isMoveable?: boolean
	weight?: number
}): string | undefined {
	return def.isMoveable && def.weight === undefined
		? 'A moveable object needs a weight'
		: undefined
}
