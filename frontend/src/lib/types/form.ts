import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import type { Path } from 'react-hook-form'
import type { InputWidth } from '@/components'
import type { ColorKind, SpriteCategory } from '@/lib/types'

export interface OptionType {
	value: number | string
	label: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormField<T extends Record<string, any>> {
	inputWidth?: InputWidth
	name: Path<T> // a top-level key or a dotted path such as 'glyph.symbol'
	label: string
	type?: string
	required?: boolean
	placeholder?: string
	readOnly?: boolean
	options?: OptionType[]
	defaultValue?: string | number | boolean | null
	inputAttrs?: Omit<
		InputHTMLAttributes<HTMLInputElement>,
		'id' | 'name' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'
	>
	textAreaAttrs?: Omit<
		TextareaHTMLAttributes<HTMLTextAreaElement>,
		'id' | 'name' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'
	>
	colorKind?: ColorKind
	spriteCategory?: SpriteCategory // for type 'sprite': which sprites to offer
	switchLabels?: [off: string, on: string] // for type 'switch': a boolean as two buttons
}
