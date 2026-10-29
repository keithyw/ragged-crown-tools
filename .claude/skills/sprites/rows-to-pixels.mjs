// Reads a sprite's text form from stdin (16 rows of 16 characters: 0-F is the
// palette index, . is empty) and prints the `pixels` array as one line of JSON,
// ready to paste into create_doc. Mirrors parseSpritePixels in
// frontend/src/lib/utils/sprite.ts; keep the two in step.
import { readFileSync } from 'node:fs'

const SIZE = 16
const DIGITS = '0123456789ABCDEF'

const rows = readFileSync(0, 'utf8')
	.split('\n')
	.filter((line) => !line.trim().startsWith('```'))
	.map((line) => line.replace(/\s/g, ''))
	.filter((line) => line.length > 0)

const fail = (message) => {
	console.error(message)
	process.exit(1)
}

if (rows.length !== SIZE) fail(`Expected ${SIZE} rows, found ${rows.length}.`)

const pixels = []
for (const [y, row] of rows.entries()) {
	if (row.length !== SIZE) {
		fail(`Row ${y + 1} has ${row.length} characters, expected ${SIZE}.`)
	}
	for (const [x, char] of [...row].entries()) {
		const index = char === '.' ? null : DIGITS.indexOf(char.toUpperCase())
		if (index === -1) {
			fail(`Row ${y + 1}, column ${x + 1}: "${char}" is not 0-F or ".".`)
		}
		pixels.push(index)
	}
}
console.log(JSON.stringify(pixels))
