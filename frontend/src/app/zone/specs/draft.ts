import type { ZoneSpecFormData } from '@/schemas'

// An unsaved zone spec, kept in the browser so it survives a trip to another
// section (Tools: Zone Specs 5). Per-viewer convenience only: storage can throw
// or be empty (private window, blocked site data), so the form must work
// without it.
const KEY = 'rc:zone-spec-draft'

type Key = keyof ZoneSpecFormData

export const loadDraft = (
	defaults: ZoneSpecFormData,
): ZoneSpecFormData | null => {
	try {
		const raw = window.localStorage.getItem(KEY)
		if (!raw) return null
		const parsed: unknown = JSON.parse(raw)
		if (typeof parsed !== 'object' || parsed === null) return null
		const draft = parsed as Record<string, unknown>
		const merged: Record<string, unknown> = { ...defaults }
		// Take a stored value only if its type matches the default's.
		for (const key of Object.keys(defaults) as Key[]) {
			if (typeof draft[key] === typeof defaults[key]) merged[key] = draft[key]
		}
		return merged as ZoneSpecFormData
	} catch {
		return null
	}
}

export const clearDraft = () => {
	try {
		window.localStorage.removeItem(KEY)
	} catch {
		// Nothing to do: there is no draft to clear.
	}
}

// A form that matches its defaults is not a draft, so it is removed rather than
// stored (this also covers the reset that follows a successful create).
export const saveDraft = (
	values: Partial<ZoneSpecFormData>,
	defaults: ZoneSpecFormData,
) => {
	try {
		const untouched = (Object.keys(defaults) as Key[]).every(
			(key) => values[key] === defaults[key],
		)
		if (untouched) return clearDraft()
		window.localStorage.setItem(KEY, JSON.stringify(values))
	} catch {
		// Storage unavailable or full: the form still works, just without a draft.
	}
}
