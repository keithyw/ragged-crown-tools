import { forwardRef } from 'react'

interface CheckboxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	id: string
	label: string
	className?: string
}

export const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
	({ id, label, className = '', ...rest }, ref) => {
		return (
			<div className='mb-4'>
				<label
					htmlFor={id}
					className='mb-2 block text-sm font-bold text-gray-700'
				>
					{label}
				</label>
				<input
					id={id}
					type='checkbox'
					ref={ref}
					{...rest}
					className={`form-checkbox h-5 w-5 text-blue-600 ${className} `}
				/>
			</div>
		)
	},
)

CheckboxInput.displayName = 'CheckboxInput'
