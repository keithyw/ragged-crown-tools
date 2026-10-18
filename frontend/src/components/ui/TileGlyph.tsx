'use client'

import { Glyph } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TileGlyphProps {
	// Anything with a glyph: tiles, objects, items.
	tile: { glyph: Glyph }
	className?: string
}
export const TileGlyph = ({ tile, className = '' }: TileGlyphProps) => (
	<span
		className={cn(
			'flex aspect-square w-16 items-center justify-center rounded bg-black',
			className,
		)}
	>
		<span
			className={cn(
				'flex h-full w-full items-center justify-center rounded font-mono text-2xl',
				tile.glyph.bg,
				tile.glyph.color,
			)}
		>
			{tile.glyph.symbol}
		</span>
	</span>
)
