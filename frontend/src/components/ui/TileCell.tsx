'use client'

import { type Glyph } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TileCellProps extends React.HTMLAttributes<HTMLSpanElement> {
	// Anything with a glyph: a terrain tile, or an object or item placed on it.
	tile?: { glyph: Glyph }
}

// One cell as the game draws it: symbol, color and background over a dark base.
// A missing def (deleted, or a bad _id in a saved zone) renders as a red "?".
export const TileCell = ({ tile, className, ...rest }: TileCellProps) => (
	<span
		aria-hidden='true'
		className={cn('flex h-11 w-11 shrink-0 bg-slate-950', className)}
		{...rest}
	>
		<span
			className={cn(
				'flex h-full w-full items-center justify-center font-mono text-xl',
				tile?.glyph.bg ?? 'bg-red-950/60',
				tile?.glyph.color ?? 'text-red-400',
			)}
		>
			{tile ? tile.glyph.symbol : '?'}
		</span>
	</span>
)
