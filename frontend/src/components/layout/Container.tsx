import { cn } from '@/lib/utils'

interface ContainerProps {
	children: React.ReactNode
	className?: string
	as?: 'div' | 'section' | 'main'
}

export const Container = ({
	children,
	className = '',
	as: Component = 'div',
}: ContainerProps) => {
	return (
		<Component className={cn('container mx-auto', className)}>
			{children}
		</Component>
	)
}
