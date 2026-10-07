'use client'

import Link from 'next/link'

export interface SubnavBarLink {
	href: string
	label: string
	permission?: string
}

interface SubnavbarProps {
	links: SubnavBarLink[]
}

export const Subnavbar = ({ links }: SubnavbarProps) => {
	return (
		<nav className='flex items-center space-x-6'>
			{links.map((l, idx) => (
				<Link
					key={idx}
					href={`${l.href}`}
					className='font-medium text-blue-600 transition-colors hover:text-blue-600'
				>
					{l.label}
				</Link>
			))}
		</nav>
	)
}
