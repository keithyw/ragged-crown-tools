// Renders sprites from their text form to a PNG that Claude can open (Read tool)
// to check a drawing before asking the owner to review it. A pre-check only: the
// owner judges quality and style.
//
//   node render-sprite.mjs <out.png> [scale] <<'EOF'
//   <16 rows>
//   <blank line, then another 16 rows to put it beside the first>
//   EOF
//
// Reads the same text form as rows-to-pixels.mjs (0-F is the palette index, .
// is empty). Several sprites separated by a blank line are drawn side by side,
// for a style comparison. Empty cells show as a light checkerboard. Scale
// defaults to 16 (one sprite pixel = 16 image pixels). Needs Node 22.2+
// (zlib.crc32), no dependencies. The hex values are EGA_PALETTE in
// frontend/src/lib/types/sprite.ts; keep the two in step.
import { readFileSync, writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'

const SIZE = 16
const DIGITS = '0123456789ABCDEF'
const PALETTE = [
	'000000',
	'0000AA',
	'00AA00',
	'00AAAA',
	'AA0000',
	'AA00AA',
	'AA5500',
	'AAAAAA',
	'555555',
	'5555FF',
	'55FF55',
	'55FFFF',
	'FF5555',
	'FF55FF',
	'FFFF55',
	'FFFFFF',
].map((hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)))
const CHECKER = [
	[0xd0, 0xd0, 0xd0],
	[0xe8, 0xe8, 0xe8],
]
const GAP = [0x88, 0x88, 0x88]

const fail = (message) => {
	console.error(message)
	process.exit(1)
}

const [out, scaleArg = '16'] = process.argv.slice(2)
if (!out) fail('Usage: render-sprite.mjs <out.png> [scale] < rows')
const scale = Number(scaleArg)
if (!Number.isInteger(scale) || scale < 1 || scale > 64) {
	fail(`Scale must be a whole number from 1 to 64, got "${scaleArg}".`)
}

// Groups of rows, split on blank lines; code fences are ignored.
const groups = [[]]
for (const line of readFileSync(0, 'utf8').split('\n')) {
	if (line.trim().startsWith('```')) continue
	const row = line.replace(/\s/g, '')
	if (row.length > 0) groups.at(-1).push(row)
	else if (groups.at(-1).length > 0) groups.push([])
}
if (groups.at(-1).length === 0) groups.pop()
if (groups.length === 0) fail('No rows on stdin.')

const sprites = groups.map((rows, n) => {
	const label = groups.length > 1 ? `Sprite ${n + 1}: ` : ''
	if (rows.length !== SIZE) {
		fail(`${label}expected ${SIZE} rows, found ${rows.length}.`)
	}
	return rows.map((row, y) => {
		if (row.length !== SIZE) {
			fail(
				`${label}row ${y + 1} has ${row.length} characters, expected ${SIZE}.`,
			)
		}
		return [...row].map((char, x) => {
			const index = char === '.' ? null : DIGITS.indexOf(char.toUpperCase())
			if (index === -1) {
				fail(
					`${label}row ${y + 1}, column ${x + 1}: "${char}" is not 0-F or ".".`,
				)
			}
			return index
		})
	})
})

// One sprite pixel per cell, with a one-cell gap between sprites.
const cols = sprites.length * SIZE + (sprites.length - 1)
const cell = (x, y) => {
	const n = Math.floor(x / (SIZE + 1))
	const sx = x - n * (SIZE + 1)
	if (sx === SIZE) return GAP
	const index = sprites[n][y][sx]
	return index === null ? CHECKER[(sx + y) % 2] : PALETTE[index]
}

const width = cols * scale
const height = SIZE * scale
const raw = Buffer.alloc((width * 3 + 1) * height) // each row starts with filter 0
for (let py = 0; py < height; py++) {
	const rowStart = py * (width * 3 + 1) + 1
	for (let px = 0; px < width; px++) {
		const rgb = cell(Math.floor(px / scale), Math.floor(py / scale))
		raw.set(rgb, rowStart + px * 3)
	}
}

const chunk = (type, data) => {
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
	const length = Buffer.alloc(4)
	length.writeUInt32BE(data.length)
	const crc = Buffer.alloc(4)
	crc.writeUInt32BE(crc32(body))
	return Buffer.concat([length, body, crc])
}
const header = Buffer.alloc(13)
header.writeUInt32BE(width, 0)
header.writeUInt32BE(height, 4)
header.set([8, 2, 0, 0, 0], 8) // 8-bit RGB, no interlace

writeFileSync(
	out,
	Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0)),
	]),
)
console.log(`Wrote ${out} (${width}x${height}, ${sprites.length} sprite(s)).`)
