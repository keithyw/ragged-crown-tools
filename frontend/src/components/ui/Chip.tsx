import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ChipType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning'

const CHIP_CLASSES: Record<ChipType, string> = {
	primary: 'bg-blue-100 text-blue-800',
	secondary: 'bg-gray-100 text-gray-800',
	success: 'bg-green-100 text-green-800',
	danger: 'bg-red-100 text-red-800',
	warning: 'bg-yellow-100 text-yellow-800',
}

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
	chipType: ChipType
}

// Ported from pitch-in, minus the unused isActive state.
export const Chip = ({ chipType, className, children, ...rest }: ChipProps) => (
	<span
		className={cn(
			'flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold',
			CHIP_CLASSES[chipType],
			className,
		)}
		{...rest}
	>
		{children}
	</span>
)
