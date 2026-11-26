// An unsent redo note, kept in the browser per zone `_id` so a reload or a trip
// to another page doesn't lose it (Tools: Zone Specs 6). Per-viewer convenience
// only: storage can throw or be empty (private window, blocked site data), so
// the form must work without it.
const keyFor = (zoneId: string) => `rc:zone-redo-draft:${zoneId}`

export const loadRedoDraft = (zoneId: string): string | null => {
	try {
		return window.localStorage.getItem(keyFor(zoneId))
	} catch {
		return null
	}
}

export const clearRedoDraft = (zoneId: string) => {
	try {
		window.localStorage.removeItem(keyFor(zoneId))
	} catch {
		// Nothing to do: there is no draft to clear.
	}
}

// An empty note is not a draft, so it is removed rather than stored.
export const saveRedoDraft = (zoneId: string, note: string) => {
	try {
		if (note === '') return clearRedoDraft(zoneId)
		window.localStorage.setItem(keyFor(zoneId), note)
	} catch {
		// Storage unavailable or full: the form still works, just without a draft.
	}
}
