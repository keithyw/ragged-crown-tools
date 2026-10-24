'use client'

import { useState } from 'react'
import { Breadcrumbs, SpriteEditor } from '@/components'
import { URLS } from '@/lib/constants'
import { emptySpriteArt } from '@/lib/types'

// TODO: [Sprite 4] details form and save; the editor's state moves into the form
const CreateSpritePage = () => {
	const [art, setArt] = useState(emptySpriteArt)

	return (
		<>
			<Breadcrumbs
				items={[{ label: 'Sprites', href: URLS.SPRITES }, { label: 'Create' }]}
			/>
			<SpriteEditor value={art} onChange={setArt} />
		</>
	)
}

export default CreateSpritePage
