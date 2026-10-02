'use client'

import { Navbar, NavLinkItem, NavbarLink } from '@/components'
import { DASHBOARD_URL } from '@/lib/constants'

const NAV_LINKS: NavLinkItem[] = [
	{ label: 'Dashboard', href: DASHBOARD_URL },
	{ label: 'Test', href: '' },
]

export const MainNavbar = () => {
	return (
		<Navbar
			links={NAV_LINKS}
			renderLink={(l) => (
				<NavbarLink key={l.href} href={l.href}>
					{l.label}
				</NavbarLink>
			)}
		/>
	)
}
