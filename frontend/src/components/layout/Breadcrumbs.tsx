import Link from 'next/link'
import { Fragment } from 'react'

export interface Crumb {
	label: string
	href?: string // last crumb has none
}

export const Breadcrumbs = ({ items }: { items: Crumb[] }) => (
	<nav aria-label='Breadcrumb' className='mb-4 text-sm text-gray-500'>
		<ol className='flex flex-wrap items-center gap-2'>
			{items.map((c, i) => (
				<Fragment key={i}>
					{i > 0 && <li aria-hidden='true'>/</li>}
					<li>
						{c.href ? (
							<Link href={c.href} className='text-link hover:text-link-hover'>
								{c.label}
							</Link>
						) : (
							<span aria-current='page' className='text-gray-800'>
								{c.label}
							</span>
						)}
					</li>
				</Fragment>
			))}
		</ol>
	</nav>
)
