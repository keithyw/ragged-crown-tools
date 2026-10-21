'use client'

import { TileGlyph } from '@/components'
import { type BaseDef } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TileCardProps {
	// Any definition, not just tiles: objects and items reuse this card.
	tile: Pick<BaseDef, 'id' | 'name' | 'glyph'>
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
		{/* max-w-full lets `truncate` apply: a flex item otherwise grows to fit
		its text. The title shows the whole text on hover. */}
		<span
			className='max-w-full truncate text-sm text-gray-500'
			title={tile.name}
		>
			{tile.name}
		</span>
		<span className='max-w-full truncate text-xs text-gray-500' title={tile.id}>
			{tile.id}
		</span>
	</button>
)
