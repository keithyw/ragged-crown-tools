'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ServerErrorMessages, SpinnerSection, ZoneBuilder } from '@/components'
import { URLS } from '@/lib/constants'
import { collectionService, type StoredDoc } from '@/lib/services'
import type { Zone } from '@/lib/types'

const EditZonePage = () => {
	const params = useParams()
	const router = useRouter()
	const id = params.id as string
	const [zone, setZone] = useState<StoredDoc<Zone> | null>(null)
	const [loadError, setLoadError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		collectionService
			.get<Zone>('zones', id)
			.then((z) => {
				if (!cancelled) setZone(z)
			})
			.catch(() => {
				if (!cancelled) setLoadError('Failed to load the zone.')
			})
		return () => {
			cancelled = true
		}
	}, [id])

	if (loadError) {
		return <ServerErrorMessages message={loadError} />
	}

	if (!zone) {
		return <SpinnerSection spinnerMessage='Loading Zone' />
	}

	return (
		<ZoneBuilder
			breadcrumbs={[{ label: 'Zones', href: URLS.ZONE }, { label: zone.name }]}
			cancelUrl={URLS.ZONE}
			initialZone={zone}
			onSave={async (edited) => {
				// PUT replaces the whole document, so start from the loaded one and
				// overwrite only what the builder owns. edgeExits and any other fields
				// survive. placements is sent explicitly: a plain spread can't remove
				// a key the builder left out.
				await collectionService.put<Zone>('zones', zone._id, {
					...zone,
					...edited,
					placements: edited.placements,
				})
				toast.success('Zone updated')
				router.push(URLS.ZONE)
			}}
		/>
	)
}

export default EditZonePage
