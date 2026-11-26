'use client'

import toast from 'react-hot-toast'
import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Controller, get } from 'react-hook-form'
import { CreateFormLayout, FormInput, InteractionsEditor } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { PortalDef } from '@/lib/types'
import { portalDefinitionSchema } from '@/schemas'
import { fields } from '@/app/portal-definitions/fields'

const CreatePortalDefinitionForm = () => {
	// ?from=<_id> pre-fills the form from an existing portal (Duplicate).
	const from = useSearchParams().get('from')
	const {
		control,
		reset,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'entities',
		schema: portalDefinitionSchema,
		defaultValues: {
			kind: 'portal', // not a visible field, but submitted with the form
			id: '',
			name: '',
			twoWay: false,
			// The backfill glyph, so a def can be saved before it has a sprite.
			glyph: { symbol: '??', color: 'text-white', bg: 'bg-black' },
			description: '',
		},
		createFn: collectionService.create,
		redirectUrl: URLS.PORTAL_DEFINITIONS,
		successMessage: () => {
			return `Portal Definition Created`
		},
	})

	useEffect(() => {
		if (!from) return
		let cancelled = false
		collectionService.get<PortalDef>('entities', from).then(
			(p) => {
				if (cancelled) return
				// Never copied: _id, updated_at, and the id (unique index, and
				// the promotion key). Destinations live on placements, not here.
				reset({
					kind: 'portal',
					id: '',
					name: `${p.name} (copy)`,
					description: p.description,
					glyph: p.glyph,
					spriteId: p.spriteId,
					twoWay: p.twoWay ?? false,
					interactions: p.interactions,
				})
			},
			() => {
				if (!cancelled) toast.error('Failed to load the portal to duplicate')
			},
		)
		return () => {
			cancelled = true
		}
	}, [from, reset])

	return (
		<CreateFormLayout
			title='Create Portal Definition'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.PORTAL_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Portal Definitions', href: URLS.PORTAL_DEFINITIONS },
				{ label: 'Create' },
			]}
			handleSubmit={onSubmit}
		>
			{fields.map((f, idx) => (
				<FormInput
					key={idx}
					control={control}
					field={f}
					register={register}
					errorMessage={get(errors, f.name)?.message}
				/>
			))}
			<Controller
				name='interactions'
				control={control}
				render={({ field }) => (
					<InteractionsEditor
						value={field.value}
						onChange={field.onChange}
						defaultTrigger='WALK'
					/>
				)}
			/>
		</CreateFormLayout>
	)
}

const CreatePortalDefinitionPage = () => (
	<Suspense>
		<CreatePortalDefinitionForm />
	</Suspense>
)

export default CreatePortalDefinitionPage
