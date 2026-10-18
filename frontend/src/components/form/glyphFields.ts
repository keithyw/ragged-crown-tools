import type { Path } from 'react-hook-form'
import type { FormField, Glyph } from '@/lib/types'

// The glyph fields every definition form shares (ACS-style: one icon picker
// for every kind). Spread into a form's field config.
export const glyphFields = <T extends { glyph: Glyph }>(): FormField<T>[] => [
	{
		name: 'glyph.symbol' as Path<T>,
		label: 'Symbol',
		placeholder: 'Enter Symbol',
		required: true,
		inputWidth: 'xs',
		inputAttrs: { maxLength: 2 },
	},
	{
		name: 'glyph.color' as Path<T>,
		label: 'Color',
		required: true,
		type: 'color',
		colorKind: 'text',
	},
	{
		name: 'glyph.bg' as Path<T>,
		label: 'Background',
		required: true,
		type: 'color',
		colorKind: 'bg',
	},
]
