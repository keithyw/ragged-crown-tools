'use client'

import { get } from 'react-hook-form'
import { CreateFormLayout, FormInput } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { itemDefinitionSchema } from '@/schemas'
import { fields } from '@/app/item-definitions/fields'

const CreateItemDefinitionPage = () => {
	const {
		control,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'items',
		schema: itemDefinitionSchema,
		defaultValues: {
			kind: 'item', // not a visible field, but submitted with the form
			id: '',
			name: '',
			glyph: { symbol: '', color: '', bg: '' },
			stackable: false,
			container: { capacity: 0, maxDepth: 0 },
			description: '',
		},
		createFn: collectionService.create,
		redirectUrl: URLS.ITEM_DEFINITIONS,
		successMessage: () => {
			return `Item Definition Created`
		},
	})
	return (
		<CreateFormLayout
			title='Create Item Definition'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.ITEM_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Item Definitions', href: URLS.ITEM_DEFINITIONS },
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
			{/* TODO: item use (for example a wand casting a spell) is a separate,
			deferred design. See DATA-MODEL.md, open questions. */}
			<p className='text-sm text-gray-500'>
				Item use (for example a wand casting a spell): coming later.
			</p>
		</CreateFormLayout>
	)
}

export default CreateItemDefinitionPage
