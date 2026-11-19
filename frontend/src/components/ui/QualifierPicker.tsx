'use client'

import { SelectDropdown } from '@/components'
import type { PlaceableDef } from '@/hooks'
import {
	ARMOR_CATEGORIES_BY_TYPE,
	ARMOR_MATERIALS,
	QUALITIES,
	WEAPON_CATEGORIES_BY_TYPE,
	WEAPON_MATERIALS,
} from '@/lib/constants'
import type {
	ArmorType,
	Material,
	Qualifiers,
	Quality,
	WeaponType,
} from '@/lib/types'

const RANDOM = 'random'

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// The materials a weapon or armor type allows: every material of every
// category the type takes.
const allowedMaterials = (def: PlaceableDef): Material[] => {
	if (!def.gearType) return []
	if (def.kind === 'weapon') {
		return WEAPON_CATEGORIES_BY_TYPE[def.gearType as WeaponType].flatMap(
			(c) => WEAPON_MATERIALS[c],
		)
	}
	return ARMOR_CATEGORIES_BY_TYPE[def.gearType as ArmorType].flatMap(
		(c) => ARMOR_MATERIALS[c],
	)
}

interface QualifierPickerProps {
	id: string
	// The weapon or armor being handed out; anything else shows nothing.
	def: PlaceableDef | undefined
	value: Qualifiers | undefined
	// undefined when both are left to chance.
	onChange: (value: Qualifiers | undefined) => void
}

// Quality and material for one instance ([Inventory 29]). Unset means "roll
// when picked up", which is not the same as Normal, so Random is its own choice.
export const QualifierPicker = ({
	id,
	def,
	value,
	onChange,
}: QualifierPickerProps) => {
	if (!def || (def.kind !== 'weapon' && def.kind !== 'armor')) return null

	const materials = allowedMaterials(def)
	const set = (next: Qualifiers) =>
		onChange(next.quality || next.material ? next : undefined)

	return (
		<div className='flex flex-wrap gap-4'>
			<div className='min-w-40'>
				<SelectDropdown
					id={`${id}-quality`}
					label='Quality'
					options={[
						{ value: RANDOM, label: 'Random (rolled on pickup)' },
						...QUALITIES.map((q) => ({ value: q, label: label(q) })),
					]}
					selectedValue={value?.quality ?? RANDOM}
					onSelect={(v) =>
						set({
							...value,
							quality: v === RANDOM || !v ? undefined : (v as Quality),
						})
					}
				/>
			</div>
			<div className='min-w-40'>
				<SelectDropdown
					id={`${id}-material`}
					label='Material'
					options={[
						{ value: RANDOM, label: 'Random (rolled on pickup)' },
						...materials.map((m) => ({ value: m, label: label(m) })),
					]}
					selectedValue={value?.material ?? RANDOM}
					onSelect={(v) =>
						set({
							...value,
							material: v === RANDOM || !v ? undefined : (v as Material),
						})
					}
				/>
			</div>
		</div>
	)
}
