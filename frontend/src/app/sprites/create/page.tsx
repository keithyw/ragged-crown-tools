'use client'

import { Breadcrumbs } from '@/components'
import { URLS } from '@/lib/constants'

// TODO: [Sprite 4] sprite editor and details form
const CreateSpritePage = () => {
	return (
		<>
			<Breadcrumbs
				items={[{ label: 'Sprites', href: URLS.SPRITES }, { label: 'Create' }]}
			/>
			<p>create</p>
		</>
	)
}

export default CreateSpritePage
