import Link from 'next/link'
import { Button } from '@/components'

interface CreateItemSectionProps {
	href: string
	children: React.ReactNode
}

export const CreateItemSection = ({
	href,
	children,
}: CreateItemSectionProps) => {
	return (
		<>
			<div className='mb-4 flex justify-end'>
				<Link href={href} passHref>
					<Button actionType='edit' type='button'>
						{children}
					</Button>
				</Link>
			</div>
		</>
	)
}
