'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navbarLinkVariants = cva(
	'text-sm font-medium transition-colors hover:text-nav-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
	{
		variants: {
			isActive: {
				true: 'text-nav-link-active font-semibold',
				false: 'text-nav-link',
			},
		},
		defaultVariants: {
			isActive: false,
		},
	},
)

interface NavbarLinkProps
	extends LinkProps, VariantProps<typeof navbarLinkVariants> {
	children: React.ReactNode
	className?: string
}

export const NavbarLink = ({
	href,
	children,
	className,
	...props
}: NavbarLinkProps) => {
	const pathname = usePathname()
	const isActive = pathname === href || pathname.startsWith(`${href}/`)

	return (
		<Link
			href={href}
			className={cn(navbarLinkVariants({ isActive }), className)}
			{...props}
		>
			{children}
		</Link>
	)
}
