'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ZoneBuilder } from '@/components'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import type { Zone } from '@/lib/types'

const CreateZonePage = () => {
	const router = useRouter()

	return (
		<ZoneBuilder
			breadcrumbs={[{ label: 'Zones', href: URLS.ZONE }, { label: 'Create' }]}
			cancelUrl={URLS.ZONE}
			onSave={async (zone) => {
				await collectionService.create<Zone>('zones', zone)
				toast.success('Zone created')
				router.push(URLS.ZONE)
			}}
		/>
	)
}

export default CreateZonePage
