'use client'

import { useWatch, type Control, type FieldValues } from 'react-hook-form'
import { CheckIcon } from '@heroicons/react/20/solid'
import { TileGlyph } from '@/components'
import { useCollection } from '@/hooks'
import type { MonsterDef } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MonsterPoolPickerProps {
	label: string
	// The form's control, to read its `level`: only monsters of a suitable
	// level are shown ([Tools 27]).
	control: Control<FieldValues>
	// Monster _ids.
	value: string[]
	onChange: (next: string[]) => void
}

// Shows every monster a configuration's random encounters could use; click
// one to pick it (a check mark appears) and click again to remove it. The
// level decides what is shown, so the grid stays short: monsters above the
// configuration's level are left out, and unique monsters never appear (set
// encounters only). A picked monster that no longer fits (the level was
// lowered afterwards, or it was deleted) is still shown, flagged, so it can
// be removed.
export const MonsterPoolPicker = ({
	label,
	control,
	value,
	onChange,
}: MonsterPoolPickerProps) => {
	const { items: monsters, isLoading } = useCollection<MonsterDef>('monsters')
	const level = useWatch({ control, name: 'level' }) as number | undefined
	const chosen = new Set(value)
	const fits = (m: MonsterDef) =>
		!m.isUnique && (typeof level !== 'number' || m.level <= level)
	const toggle = (_id: string) =>
		onChange(chosen.has(_id) ? value.filter((x) => x !== _id) : [...value, _id])

	// What fits, plus anything picked that doesn't, so nothing is hidden.
	const shown = monsters
		.filter((m) => fits(m) || chosen.has(m._id))
		.sort((a, b) => a.name.localeCompare(b.name))
	const missing = isLoading
		? []
		: value.filter((_id) => !monsters.some((m) => m._id === _id))

	return (
		<div className='mb-4'>
			<p className='mb-1 block text-sm font-bold text-gray-700'>{label}</p>
			<p className='mb-2 text-xs text-gray-500'>
				Only monsters up to this level are shown, and unique monsters never are.
			</p>
			{isLoading ? (
				<p className='text-sm text-gray-500'>Loading...</p>
			) : shown.length === 0 && missing.length === 0 ? (
				<p className='text-sm text-gray-500'>No monsters fit this level yet.</p>
			) : (
				<div className='flex flex-wrap gap-2'>
					{shown.map((m) => {
						const isChosen = chosen.has(m._id)
						return (
							<button
								key={m._id}
								type='button'
								aria-pressed={isChosen}
								title={fits(m) ? undefined : 'No longer fits this level'}
								onClick={() => toggle(m._id)}
								className={cn(
									'relative flex w-28 flex-col items-center gap-1 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
									isChosen && 'ring-2 ring-blue-500',
									isChosen && !fits(m) && 'ring-amber-500',
								)}
							>
								<TileGlyph tile={m} />
								{isChosen && (
									<span
										className={cn(
											'absolute top-1 right-1 rounded-full p-0.5 text-white',
											fits(m) ? 'bg-blue-500' : 'bg-amber-500',
										)}
									>
										<CheckIcon className='h-4 w-4' />
									</span>
								)}
								<span
									className='max-w-full truncate text-sm text-gray-500'
									title={m.name}
								>
									{m.name}
								</span>
								<span className='text-xs text-gray-500'>
									level {m.level}, {m.rarity}
								</span>
							</button>
						)
					})}
					{missing.map((_id) => (
						<button
							key={_id}
							type='button'
							aria-pressed
							onClick={() => toggle(_id)}
							className='relative flex w-28 flex-col items-center gap-1 rounded p-2 ring-2 ring-red-500 focus-visible:outline-none'
						>
							<TileGlyph />
							<span className='text-sm text-red-600'>(missing)</span>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
