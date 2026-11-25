import type { DifficultyConfigFormData } from '@/schemas'

// No groups yet: the designer adds the ones the zone needs.
export const defaultValues: DifficultyConfigFormData = {
	id: '',
	name: '',
	level: 0,
	monsterIds: [],
	description: '',
	materials: { weapon: {}, armor: {} },
}
