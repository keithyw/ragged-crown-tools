import type { DifficultyConfigFormData } from '@/schemas'

// The first listed material is a placeholder default; the designer picks.
export const defaultValues: DifficultyConfigFormData = {
	id: '',
	name: '',
	description: '',
	materials: {
		weapon: { default: 'wood', chances: {} },
		armor: { default: 'cloth', chances: {} },
	},
}
