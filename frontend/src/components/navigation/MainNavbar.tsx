'use client'

import { Navbar, NavLinkItem, NavbarLink } from '@/components'
import { URLS } from '@/lib/constants'

const NAV_LINKS: NavLinkItem[] = [
	{ label: 'Dashboard', href: URLS.DASHBOARD },
	{ label: 'Tile Definitions', href: URLS.TILE_DEFINITIONS },
	{ label: 'Test', href: URLS.TEST },
	{ label: 'Zone', href: URLS.ZONE },
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
