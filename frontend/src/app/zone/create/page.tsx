'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ZoneBuilder } from '@/components'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import type { ReviewedZone } from '@/lib/types'

const CreateZonePage = () => {
	const router = useRouter()

	return (
		<ZoneBuilder
			breadcrumbs={[{ label: 'Zones', href: URLS.ZONE }, { label: 'Create' }]}
			cancelUrl={URLS.ZONE}
			onSave={async (zone) => {
				// A zone drawn by hand is approved: the owner made it. Not a form
				// field, but always stored, so every zone has a status (a game build
				// can then take only approved ones).
				await collectionService.create<ReviewedZone>('zones', {
					...zone,
					status: 'approved',
				})
				toast.success('Zone created')
				router.push(URLS.ZONE)
			}}
		/>
	)
}

export default CreateZonePage
