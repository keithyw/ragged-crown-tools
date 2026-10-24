import { SPRITE_SIZE, type SpritePixels } from '@/lib/types'

// The text form of a sprite's pixels: SPRITE_SIZE rows of SPRITE_SIZE
// characters. 0-F is the palette index (EGA_PALETTE order, 0 black to F white)
// and . is an empty cell.
const DIGITS = '0123456789ABCDEF'

export const spritePixelsToText = (pixels: SpritePixels) =>
	Array.from({ length: SPRITE_SIZE }, (_, y) =>
		pixels
			.slice(y * SPRITE_SIZE, (y + 1) * SPRITE_SIZE)
			.map((p) => (p === null ? '.' : DIGITS[p]))
			.join(''),
	).join('\n')

export type ParsedSpritePixels =
	{ ok: true; pixels: SpritePixels } | { ok: false; error: string }

// Blank lines, ``` fences and spaces inside a row are ignored, so output
// pasted from a chat reply works as is.
export const parseSpritePixels = (text: string): ParsedSpritePixels => {
	const rows = text
		.split('\n')
		.filter((line) => !line.trim().startsWith('```'))
		.map((line) => line.replace(/\s/g, ''))
		.filter((line) => line.length > 0)

	if (rows.length !== SPRITE_SIZE) {
		return {
			ok: false,
			error: `Expected ${SPRITE_SIZE} rows, found ${rows.length}.`,
		}
	}

	const pixels: SpritePixels = []
	for (const [y, row] of rows.entries()) {
		if (row.length !== SPRITE_SIZE) {
			return {
				ok: false,
				error: `Row ${y + 1} has ${row.length} characters, expected ${SPRITE_SIZE}.`,
			}
		}
		for (const [x, char] of [...row].entries()) {
			const index = char === '.' ? null : DIGITS.indexOf(char.toUpperCase())
			if (index === -1) {
				return {
					ok: false,
					error: `Row ${y + 1}, column ${x + 1}: "${char}" is not 0-F or ".".`,
				}
			}
			pixels.push(index)
		}
	}
	return { ok: true, pixels }
}
