import { Container, Subnavbar, type SubnavBarLink } from '@/components'

interface CrudLayoutProps {
	children: React.ReactNode
	links?: SubnavBarLink[]
	title: string
}

export const CrudLayout = ({ children, links, title }: CrudLayoutProps) => {
	return (
		<div className='min-h-screen bg-gray-100'>
			<header className='items-centered flex justify-between bg-white px-6 py-4 shadow-sm'>
				<p className='text-2xl font-semibold text-gray-800'>{title}</p>
				{links && <Subnavbar links={links} />}
			</header>
			<Container as='main' className='px-4 py-8 sm:px-6 lg:px-8'>
				{children}
			</Container>
		</div>
	)
}
