export type ColorKind = 'text' | 'bg'

export const HUES = [
	'zinc',
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'violet',
	'purple',
	'pink',
	'rose',
] as const

export const SHADES: Record<ColorKind, number[]> = {
	text: [300, 400, 500, 600],
	bg: [700, 800, 900, 950],
}

export const OPACITIES: Record<ColorKind, string[]> = {
	text: ['', '/70'],
	bg: ['', '/60', '/30'],
}

export const NEUTRALS: Record<ColorKind, string[]> = {
	text: ['text-white', 'text-black'],
	bg: ['bg-black', 'bg-white'],
}
