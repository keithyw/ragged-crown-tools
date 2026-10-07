import React, { forwardRef } from 'react'

interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	id: string
	label: string
	className?: string
	readOnly?: boolean
}

export const TextareaInput = forwardRef<
	HTMLTextAreaElement,
	TextareaInputProps
>(({ id, label, className = '', readOnly, ...rest }, ref) => {
	return (
		<div className='mb-4'>
			<label
				htmlFor={id}
				className='mb-2 block text-sm font-bold text-gray-700'
			>
				{label}
			</label>
			<textarea
				id={id}
				ref={ref}
				readOnly={readOnly}
				{...rest}
				className={`focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-blue-500 focus:outline-none ${readOnly ? 'cursor-not-allowed bg-gray-100' : ''} ${className || ''} `}
			/>
		</div>
	)
})

TextareaInput.displayName = 'TextareaInput'
