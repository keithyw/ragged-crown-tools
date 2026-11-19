import type { DifficultyConfigFormData } from '@/schemas'

// No groups yet: the designer adds the ones the zone needs.
export const defaultValues: DifficultyConfigFormData = {
	id: '',
	name: '',
	description: '',
	materials: { weapon: {}, armor: {} },
}
