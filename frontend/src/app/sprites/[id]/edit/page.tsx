'use client'

import { Breadcrumbs } from '@/components'
import { URLS } from '@/lib/constants'

// TODO: [Sprite 5] load the sprite (the [id] segment is its _id) into the editor
const EditSpritePage = () => {
	return (
		<>
			<Breadcrumbs
				items={[{ label: 'Sprites', href: URLS.SPRITES }, { label: 'Edit' }]}
			/>
			<p>edit</p>
		</>
	)
}

export default EditSpritePage
