'use client'

import { TileGlyph } from '@/components'
import { type TileDef } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TileCardProps {
	tile: TileDef
	selected: boolean
	onSelect: () => void
	onOpen: () => void
}

export const TileCard = ({
	tile,
	selected,
	onSelect,
	onOpen,
}: TileCardProps) => (
	<button
		type='button'
		onClick={onSelect}
		onDoubleClick={onOpen}
		aria-pressed={selected}
		className={cn(
			'flex w-28 flex-col items-center gap-1 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
			selected && 'ring-2 ring-blue-500',
		)}
	>
		<TileGlyph tile={tile} />
		<span className='truncate text-sm text-gray-500'>{tile.name}</span>
		<span className='text-xs text-gray-500'>{tile.id}</span>
	</button>
)
