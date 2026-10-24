'use client'

import { get } from 'react-hook-form'
import {
	Breadcrumbs,
	Button,
	CancelSubmitButton,
	FormInput,
	SpriteEditor,
} from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { emptySpriteArt } from '@/lib/types'
import { spriteSchema } from '@/schemas'
import { fields } from '@/app/sprites/fields'

const CreateSpritePage = () => {
	const {
		control,
		onSubmit,
		register,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'sprites',
		schema: spriteSchema,
		defaultValues: {
			id: '',
			name: '',
			category: 'terrain',
			...emptySpriteArt(),
		},
		createFn: collectionService.create,
		redirectUrl: URLS.SPRITES,
		successMessage: () => 'Sprite Created',
	})

	return (
		<>
			<Breadcrumbs
				items={[{ label: 'Sprites', href: URLS.SPRITES }, { label: 'Create' }]}
			/>
			<form onSubmit={onSubmit}>
				<SpriteEditor
					value={{ pixels: watch('pixels'), background: watch('background') }}
					onChange={({ pixels, background }) => {
						setValue('pixels', pixels, { shouldDirty: true })
						setValue('background', background, { shouldDirty: true })
					}}
					details={
						<section>
							{fields.map((f, idx) => (
								<FormInput
									key={idx}
									control={control}
									field={f}
									register={register}
									errorMessage={get(errors, f.name)?.message}
								/>
							))}
						</section>
					}
					footer={
						<div className='flex justify-end gap-3'>
							<Button actionType='submit' disabled={isSubmitting}>
								{isSubmitting ? 'Creating...' : 'Create'}
							</Button>
							<CancelSubmitButton cancelUrl={URLS.SPRITES} />
						</div>
					}
				/>
			</form>
		</>
	)
}

export default CreateSpritePage
