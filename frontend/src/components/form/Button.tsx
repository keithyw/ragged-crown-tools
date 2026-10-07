import { cva, type VariantProps } from 'class-variance-authority'
import { LoadingSpinner } from '@/components'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
	'px-4 py-2 text-white rounded font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-opacity',
	{
		variants: {
			actionType: {
				submit:
					'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 border border-transparent',
				edit: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
				delete: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
				danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-600',
				view: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500',
				dataTableControl:
					'bg-slate-700 hover:bg-slate-600 focus:ring-slate-500',
				neutral:
					'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
			},
			defaultVariants: {
				actionType: 'view',
			},
		},
	},
)

export interface ButtonProps
	extends
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	isLoading?: boolean
	spinnerSize?: 'sm' | 'md' | 'lg'
	icon?: React.ReactNode
}

export const Button = ({
	actionType,
	children,
	isLoading = false,
	spinnerSize = 'sm',
	icon,
	className,
	disabled,
	...props
}: ButtonProps) => {
	const isDisabled = disabled || isLoading

	return (
		<button
			className={cn(buttonVariants({ actionType }), className)}
			disabled={isDisabled}
			{...props}
		>
			{isLoading ? (
				<LoadingSpinner size={spinnerSize} message='' className='!p-0' />
			) : (
				<span className='flex items-center justify-center gap-2'>
					{icon && <span>{icon}</span>}
					<span>{children}</span>
				</span>
			)}
		</button>
	)
}
