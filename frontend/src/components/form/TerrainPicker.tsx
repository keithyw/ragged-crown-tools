'use client'

import { CheckIcon } from '@heroicons/react/20/solid'
import { TileGlyph } from '@/components'
import { useCollection } from '@/hooks'
import type { TileDef } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TerrainPickerProps {
	label: string
	// Terrain _ids.
	value: string[]
	onChange: (next: string[]) => void
}

// Shows every terrain; click one to pick it (a check mark appears) and click
// again to remove it. There are few terrains, so no search is needed.
export const TerrainPicker = ({
	label,
	value,
	onChange,
}: TerrainPickerProps) => {
	const { items: terrains, isLoading } = useCollection<TileDef>('tile_defs')
	const chosen = new Set(value)
	const toggle = (_id: string) =>
		onChange(chosen.has(_id) ? value.filter((x) => x !== _id) : [...value, _id])
	// Picked ids whose terrain is gone: shown so they can still be removed.
	const missing = isLoading
		? []
		: value.filter((_id) => !terrains.some((t) => t._id === _id))

	return (
		<div className='mb-4'>
			<p className='mb-2 block text-sm font-bold text-gray-700'>{label}</p>
			{isLoading ? (
				<p className='text-sm text-gray-500'>Loading...</p>
			) : (
				<div className='flex flex-wrap gap-2'>
					{terrains.map((t) => (
						<button
							key={t._id}
							type='button'
							aria-pressed={chosen.has(t._id)}
							onClick={() => toggle(t._id)}
							className={cn(
								'relative flex w-24 flex-col items-center gap-1 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
								chosen.has(t._id) && 'ring-2 ring-blue-500',
							)}
						>
							<TileGlyph tile={t} />
							{chosen.has(t._id) && (
								<span className='absolute top-1 right-1 rounded-full bg-blue-500 p-0.5 text-white'>
									<CheckIcon className='h-4 w-4' />
								</span>
							)}
							<span
								className='max-w-full truncate text-sm text-gray-500'
								title={t.name}
							>
								{t.name}
							</span>
						</button>
					))}
					{missing.map((_id) => (
						<button
							key={_id}
							type='button'
							aria-pressed
							onClick={() => toggle(_id)}
							className='relative flex w-24 flex-col items-center gap-1 rounded p-2 ring-2 ring-red-500 focus-visible:outline-none'
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
