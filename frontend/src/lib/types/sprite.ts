// Sprites are 16x16 pixel art drawn with the 16 EGA colours. See [Sprite 1].
export const SPRITE_SIZE = 16

export const EGA_PALETTE = [
	{ name: 'Black', hex: '#000000' },
	{ name: 'Blue', hex: '#0000AA' },
	{ name: 'Green', hex: '#00AA00' },
	{ name: 'Cyan', hex: '#00AAAA' },
	{ name: 'Red', hex: '#AA0000' },
	{ name: 'Magenta', hex: '#AA00AA' },
	{ name: 'Brown', hex: '#AA5500' },
	{ name: 'Light gray', hex: '#AAAAAA' },
	{ name: 'Dark gray', hex: '#555555' },
	{ name: 'Light blue', hex: '#5555FF' },
	{ name: 'Light green', hex: '#55FF55' },
	{ name: 'Light cyan', hex: '#55FFFF' },
	{ name: 'Light red', hex: '#FF5555' },
	{ name: 'Light magenta', hex: '#FF55FF' },
	{ name: 'Yellow', hex: '#FFFF55' },
	{ name: 'White', hex: '#FFFFFF' },
] as const

// What a sprite is for: the def kinds that can have one (creature and
// portraits come later, see [Sprite 2]).
export const SPRITE_CATEGORIES = [
	'terrain',
	'object',
	'item',
	'portal',
] as const
export type SpriteCategory = (typeof SPRITE_CATEGORIES)[number]

// Row-major, SPRITE_SIZE * SPRITE_SIZE entries: a palette index, or null for
// an empty cell (which shows the background).
export type SpritePixels = (number | null)[]

// A palette index, or 'transparent'.
export type SpriteBackground = number | 'transparent'

export interface SpriteArt {
	pixels: SpritePixels
	background: SpriteBackground
}

export const emptySpriteArt = (): SpriteArt => ({
	pixels: Array<number | null>(SPRITE_SIZE * SPRITE_SIZE).fill(null),
	background: 'transparent',
})
