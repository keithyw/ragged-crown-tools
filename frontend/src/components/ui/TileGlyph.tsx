'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { SpriteCanvas, useSprites } from '@/components'
import { type Glyph } from '@/lib/types'
import { cn } from '@/lib/utils'

// The base layer and the glyph layer differ per variant. Everything else
// (symbol, color, bg, the missing-def fallback) is shared.
const baseVariants = cva('flex', {
	variants: {
		variant: {
			// Tile lists and inspectors: rounded, 4rem unless the caller sets a width.
			card: 'aspect-square w-16 items-center justify-center rounded bg-black',
			// A map cell, as the game draws it: square, fixed size.
			cell: 'h-11 w-11 shrink-0 bg-slate-950',
		},
	},
	defaultVariants: { variant: 'card' },
})

const glyphVariants = cva(
	'flex h-full w-full items-center justify-center font-mono',
	{
		variants: {
			variant: {
				card: 'rounded text-2xl',
				cell: 'text-xl',
			},
		},
		defaultVariants: { variant: 'card' },
	},
)

interface TileGlyphProps
	extends
		React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof baseVariants> {
	// Anything with a glyph: a terrain tile, or an object or item. A missing
	// def (deleted, or a bad _id in a saved zone) renders as a red "?".
	tile?: { glyph: Glyph; spriteId?: string }
}

// How a def looks on screen: its sprite if it has one that still exists,
// otherwise its glyph (DATA-MODEL.md 1.2).
export const TileGlyph = ({
	tile,
	variant,
	className,
	...rest
}: TileGlyphProps) => {
	const sprite = useSprites().get(tile?.spriteId ?? '')

	return (
		<span
			aria-hidden='true'
			className={cn(baseVariants({ variant }), className)}
			{...rest}
		>
			{sprite ? (
				<SpriteCanvas art={sprite} className='h-full w-full' />
			) : (
				<span
					className={cn(
						glyphVariants({ variant }),
						tile?.glyph.bg ?? 'bg-red-950/60',
						tile?.glyph.color ?? 'text-red-400',
					)}
				>
					{tile ? tile.glyph.symbol : '?'}
				</span>
			)}
		</span>
	)
}
