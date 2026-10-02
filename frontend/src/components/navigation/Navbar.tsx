'use client'

import { ReactNode } from 'react'
import { NavbarLink } from '@/components'
import { cn } from '@/lib/utils'

export interface NavLinkItem {
	label: string
	href: string
	permission?: string
}

interface NavbarProps {
	links: NavLinkItem[]
	className?: string
	renderLink: (link: NavLinkItem) => ReactNode
	rightContent?: ReactNode
}

export const Navbar = ({
	links,
	className,
	renderLink,
	rightContent,
}: NavbarProps) => {
	return (
		<nav
			className={cn(
				'bg-nav-bg border-nav-border border-b p-4 shadow-md',
				className,
			)}
		>
			<div className='mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
				<NavbarLink href='/'>Home</NavbarLink>
				<div className='flex items-center gap-6'>
					{links.map((l) => renderLink(l))}
					{rightContent}
				</div>
			</div>
		</nav>
	)
}
