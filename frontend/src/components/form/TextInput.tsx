import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
	'focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-blue-500 focus:outline-none',
	{
		variants: {
			inputWidth: {
				xs: 'w-16',
				sm: 'w-24',
				md: 'w-40',
				lg: 'w-64',
				full: 'w-full',
			},
			readOnly: {
				true: 'cursor-not-allowed bg-gray-100',
				false: '',
			},
		},
		defaultVariants: {
			inputWidth: 'full',
			readOnly: false,
		},
	},
)

export type InputWidth = NonNullable<
	VariantProps<typeof inputVariants>['inputWidth']
>

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	id: string
	label: string
	inputWidth?: InputWidth
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
	(
		{ id, label, type = 'text', inputWidth, className, readOnly, ...rest },
		ref,
	) => {
		return (
			<div className='relative mb-4'>
				<label
					htmlFor={id}
					className='mb-2 block text-sm font-bold text-gray-700'
				>
					{label}
				</label>
				<input
					type={type}
					id={id}
					ref={ref}
					readOnly={readOnly}
					{...rest}
					className={cn(inputVariants({ inputWidth, readOnly }), className)}
				/>
			</div>
		)
	},
)

TextInput.displayName = 'TextInput'
