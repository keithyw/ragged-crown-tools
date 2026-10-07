import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import type { InputWidth } from '@/components'
import type { ColorKind } from '@/lib/types'

export interface OptionType {
	value: number | string
	label: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormField<T extends Record<string, any>> {
	inputWidth?: InputWidth
	name: keyof T
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
}
