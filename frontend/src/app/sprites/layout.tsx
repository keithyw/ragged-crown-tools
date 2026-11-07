import { CrudLayout } from '@/components'
import { URLS } from '@/lib/constants'

const LINKS = [
	{ href: URLS.SPRITES, label: 'Sprites' },
	{ href: URLS.SPRITES_REVIEW, label: 'Review Generated Sprites' },
]

const SpriteLayout = ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return (
		<CrudLayout title='Sprite Dashboard' links={LINKS}>
			{children}
		</CrudLayout>
	)
}

export default SpriteLayout
