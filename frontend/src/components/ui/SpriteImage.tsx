'use client'

import { useEffect, useRef } from 'react'
import { EGA_PALETTE, SPRITE_SIZE, type SpriteArt } from '@/lib/types'

// Shows through wherever the sprite is transparent.
export const CHECKERBOARD: React.CSSProperties = {
	backgroundColor: '#ffffff',
	backgroundImage:
		'conic-gradient(#cbd5e1 25%, transparent 0 50%, #cbd5e1 0 75%, transparent 0)',
	backgroundSize: '8px 8px',
}

// Draws a sprite on a canvas, one canvas pixel per sprite pixel. The caller
// sizes it (scaled up crisp). Transparent cells show whatever is behind.
export const SpriteCanvas = ({
	art,
	style,
	...rest
}: { art: SpriteArt } & React.CanvasHTMLAttributes<HTMLCanvasElement>) => {
	const canvas = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const ctx = canvas.current?.getContext('2d')
		if (!ctx) return
		ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
		art.pixels.forEach((p, i) => {
			const index =
				p ?? (art.background === 'transparent' ? null : art.background)
			if (index === null) return
			ctx.fillStyle = EGA_PALETTE[index].hex
			ctx.fillRect(i % SPRITE_SIZE, Math.floor(i / SPRITE_SIZE), 1, 1)
		})
	}, [art])

	return (
		<canvas
			ref={canvas}
			width={SPRITE_SIZE}
			height={SPRITE_SIZE}
			style={{ imageRendering: 'pixelated', ...style }}
			{...rest}
		/>
	)
}

interface SpriteImageProps {
	art: SpriteArt
	// Screen pixels per sprite pixel.
	scale: number
}

// A sprite on a checkerboard, for the editor's preview and the sprite list.
export const SpriteImage = ({ art, scale }: SpriteImageProps) => (
	<div className='w-fit' style={CHECKERBOARD}>
		<SpriteCanvas
			art={art}
			aria-label='Sprite'
			style={{ width: SPRITE_SIZE * scale, height: SPRITE_SIZE * scale }}
			className='border border-gray-400'
		/>
	</div>
)
