'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { get, useController } from 'react-hook-form'
import {
	Breadcrumbs,
	Button,
	CancelSubmitButton,
	FormInput,
	ServerErrorMessages,
	SpinnerSection,
	SpriteEditor,
} from '@/components'
import { useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { emptySpriteArt, Sprite } from '@/lib/types'
import { spriteSchema, type SpriteFormData } from '@/schemas'
import { fields } from '@/app/sprites/fields'

const EditSpritePage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'sprites',
		id: params.id as string,
		defaultValues: {
			id: '',
			name: '',
			category: 'terrain',
			...emptySpriteArt(),
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load sprite',
		redirectUrl: URLS.SPRITES,
		schema: spriteSchema,
		// Every field of a sprite is in the form, so the full-replace PUT drops
		// nothing.
		handleFetchCallback: useCallback(
			(s: Sprite) => ({
				id: s.id ?? '',
				name: s.name,
				category: s.category,
				background: s.background,
				pixels: s.pixels,
			}),
			[],
		),
		transformData: async (data: SpriteFormData) => data,
	})

	const pixels = useController({
		control: editController.control,
		name: 'pixels',
	}).field
	const background = useController({
		control: editController.control,
		name: 'background',
	}).field

	if (editController.isLoading) {
		return <SpinnerSection spinnerMessage='Loading sprite...' />
	}

	if (!editController.data) {
		return (
			<ServerErrorMessages message={editController.loadingError as string} />
		)
	}

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: 'Sprites', href: URLS.SPRITES },
					{ label: editController.data.name ?? 'Edit' },
				]}
			/>
			<form onSubmit={editController.onSubmit}>
				<SpriteEditor
					value={{ pixels: pixels.value, background: background.value }}
					onChange={(art) => {
						pixels.onChange(art.pixels)
						background.onChange(art.background)
					}}
					details={
						<section>
							{fields.map((f, idx) => (
								<FormInput
									key={idx}
									control={editController.control}
									field={f}
									register={editController.register}
									errorMessage={
										get(editController.fieldErrors, f.name)?.message
									}
								/>
							))}
						</section>
					}
					footer={
						<div className='flex justify-end gap-3'>
							<Button
								actionType='submit'
								disabled={editController.isSubmitting}
							>
								{editController.isSubmitting ? 'Saving...' : 'Save'}
							</Button>
							<CancelSubmitButton cancelUrl={URLS.SPRITES} />
						</div>
					}
				/>
			</form>
		</>
	)
}

export default EditSpritePage
