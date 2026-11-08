'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ServerErrorMessages, SpinnerSection, ZoneBuilder } from '@/components'
import { URLS } from '@/lib/constants'
import { collectionService, type StoredDoc } from '@/lib/services'
import type { ReviewedZone } from '@/lib/types'

const EditZonePage = () => {
	const params = useParams()
	const router = useRouter()
	const id = params.id as string
	const [zone, setZone] = useState<StoredDoc<ReviewedZone> | null>(null)
	const [loadError, setLoadError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		collectionService
			.get<ReviewedZone>('zones', id)
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
			zoneId={zone._id}
			review={zone}
			onSendForRedo={async (note) => {
				// Saves the zone as last loaded or saved, not the builder's unsaved
				// edits. PUT replaces the whole document, so send all of it. The new
				// state is kept so a later save doesn't put the old one back.
				try {
					const saved = await collectionService.put<ReviewedZone>(
						'zones',
						zone._id,
						{ ...zone, status: 'redo', reviewNote: note },
					)
					setZone(saved)
					toast.success('Queued for redo')
				} catch {
					toast.error('Could not save the note')
					throw new Error('redo not saved')
				}
			}}
			onSave={async (edited) => {
				// PUT replaces the whole document, so start from the loaded one and
				// overwrite only what the builder owns. edgeExits, the review state
				// and any other fields survive. placements is sent explicitly: a plain
				// spread can't remove a key the builder left out.
				await collectionService.put<ReviewedZone>('zones', zone._id, {
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
