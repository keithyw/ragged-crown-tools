'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { get, useController } from 'react-hook-form'
import {
	Breadcrumbs,
	Button,
	CancelSubmitButton,
	FormInput,
	SelectDropdown,
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

const STATUS_LABELS: Record<string, string> = {
	review: 'Review',
	redo: 'Redo',
	approved: 'Approved',
}
// No `redo`: it needs a note, so it is set by sending a sprite back for redo
// (review page, [Sprite 18]), not by hand.
const STATUS_CHOICES = [
	{ value: 'review', label: 'Review' },
	{ value: 'approved', label: 'Approved' },
]

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
		// Every field of a sprite is in the form (the review note is carried as a
		// hidden value), so the full-replace PUT drops nothing.
		handleFetchCallback: useCallback(
			(s: Sprite) => ({
				id: s.id ?? '',
				name: s.name,
				category: s.category,
				background: s.background,
				pixels: s.pixels,
				status: s.status,
				reviewNote: s.reviewNote,
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

	// Not a select showing the stored value: `redo` isn't one of the options, so
	// a select would show (and save) something else. The text is the value that
	// will be saved; the select only changes it.
	const status = useController({
		control: editController.control,
		name: 'status',
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
							<p className='mb-2 text-sm font-bold text-gray-700'>
								Review status:{' '}
								<span className='font-normal'>
									{STATUS_LABELS[status.value ?? ''] ?? 'None'}
								</span>
							</p>
							<SelectDropdown
								label='Change review status'
								options={STATUS_CHOICES}
								selectedValue={null}
								placeholder='Keep current'
								onSelect={(v) => v && status.onChange(v)}
							/>
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
