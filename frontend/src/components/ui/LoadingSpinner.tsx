import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const loadingSpinnerVariants = cva(
	'animate-spin rounded-full border-gray-300 border-t-blue-500',
	{
		variants: {
			size: {
				sm: 'w-5 h-5 border-2',
				md: 'w-8 h-8 border-3',
				lg: 'w-12 h-12 border-4',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	},
)

interface LoadingSpinnerProps
	extends
		React.HTMLAttributes<HTMLElement>,
		VariantProps<typeof loadingSpinnerVariants> {
	message?: string
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

export const LoadingSpinner = ({
	message = 'Loading...',
	size,
	className,
}: LoadingSpinnerProps) => {
	return (
		<div
			className={cn('flex flex-col items-center justify-center p-4', className)}
			role='status'
			aria-label='loading'
		>
			<div className={cn(loadingSpinnerVariants({ size }))}>
				<span className='sr-only'>Loading...</span>
				{message && (
					<p className='mt-3 text-gray-600 dark:text-gray-400'>{message}</p>
				)}
			</div>
		</div>
	)
}
