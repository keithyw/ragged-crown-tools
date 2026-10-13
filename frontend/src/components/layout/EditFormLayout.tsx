'use client'

import { Control, FieldErrors, UseFormRegister } from 'react-hook-form'
import {
	CreateFormLayout,
	FormInput,
	ServerErrorMessages,
	SpinnerSection,
} from '@/components'
import { FormField } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface EditFormLayoutProps<T extends Record<string, any>> {
	item: T
	title: string
	fields: FormField<T>[]
	isLoading: boolean
	isSubmitting: boolean
	loadingError: string | null
	cancelUrl?: string
	handleSubmit: React.SubmitEventHandler<HTMLFormElement>
	register: UseFormRegister<T>
	control: Control<T>
	errors: FieldErrors
	children?: React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EditFormLayout = <T extends Record<string, any>>({
	item,
	title,
	fields,
	isLoading,
	isSubmitting,
	loadingError,
	cancelUrl,
	handleSubmit,
	register,
	control,
	errors,
	children,
}: EditFormLayoutProps<T>) => {
	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading item...' />
	}

	if (!item) {
		return <ServerErrorMessages message={loadingError as string} />
	}

	return (
		<CreateFormLayout
			title={title}
			isSubmitting={isSubmitting}
			submitText='Save'
			submittingText='Saving...'
			handleSubmit={handleSubmit}
			cancelUrl={cancelUrl}
		>
			{fields.map((f, idx) => (
				<FormInput
					key={idx}
					field={f}
					register={register}
					control={control}
					errorMessage={errors[f.name]?.message as string}
				/>
			))}
			{children}
		</CreateFormLayout>
	)
}
