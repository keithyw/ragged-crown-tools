'use client'

import { Breadcrumbs, CreateItemSection } from '@/components'
import { URLS } from '@/lib/constants'

// TODO: [Sprite 3] visual grid of sprites
const SpritesPage = () => {
	return (
		<>
			<Breadcrumbs items={[{ label: 'Sprites' }]} />
			<CreateItemSection href={`${URLS.SPRITES}/create`}>
				Create Sprite
			</CreateItemSection>
			<p>list</p>
		</>
	)
}

export default SpritesPage
