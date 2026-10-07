'use client'

import { UseFormRegister, Path, Control, Controller } from 'react-hook-form'
import {
	CheckboxInput,
	ColorPicker,
	InputErrorMessage,
	SelectDropdown,
	TextareaInput,
	TextInput,
} from '@/components'
import { FormField } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface FormInputProps<T extends Record<string, any>> {
	field: FormField<T>
	register: UseFormRegister<T>
	errorMessage?: string
	control?: Control<T>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value?: any
	onChange?: (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => void
	onBlur?: (
		e: React.FocusEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => void
}

export const FormInput = <
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Record<string, any>,
>({
	field,
	register,
	errorMessage,
	control,
	value,
	onChange,
	onBlur,
}: FormInputProps<T>) => {
	const inputProps = {
		id: field.name as string,
		label: field.label,
		readOnly: field.readOnly,
	}

	const numberOpts = {
		setValueAs: (v: string) => (v === '' || v == null ? undefined : Number(v)),
	}

	const dynamicInputProps = register
		? register(
				field.name as Path<T>,
				field.type === 'number' ? numberOpts : undefined,
			)
		: { value, onChange, onBlur }

	const dynamicCheckboxProps = register
		? register(field.name as Path<T>)
		: { checked: !!value, onChange, onBlur }

	switch (field.type) {
		case 'checkbox':
			return (
				<>
					<CheckboxInput {...inputProps} {...dynamicCheckboxProps} />
					<InputErrorMessage errorMessage={errorMessage as string} />
				</>
			)
		case 'color':
			if (!control) {
				console.error('Control is required')
				return null
			}
			return (
				<Controller
					name={field.name as Path<T>}
					control={control}
					render={({ field: cf }) => (
						<>
							<ColorPicker
								id={inputProps.id}
								label={field.label}
								kind={field.colorKind ?? 'text'}
								value={cf.value as string | undefined}
								onChange={cf.onChange}
								onBlur={cf.onBlur}
							/>
							<InputErrorMessage errorMessage={errorMessage as string} />
						</>
					)}
				/>
			)
		case 'select':
			if (!control) {
				console.error('Control is required')
				return null
			}
			return (
				<Controller
					name={field.name as Path<T>}
					control={control}
					rules={{ required: field.required }}
					render={({ field: controllerField }) => (
						<>
							<SelectDropdown
								{...inputProps}
								name={controllerField.name}
								options={field.options || []}
								selectedValue={controllerField.value as number | string | null}
								onSelect={(v) => {
									controllerField.onChange(v)
								}}
								onBlur={controllerField.onBlur}
								disabled={controllerField.disabled}
								placeholder={field.placeholder}
							/>
							<InputErrorMessage errorMessage={errorMessage as string} />
						</>
					)}
				/>
			)
		case 'textarea':
			return (
				<>
					<TextareaInput {...inputProps} {...dynamicInputProps} />
					<InputErrorMessage errorMessage={errorMessage as string} />
				</>
			)
		case 'password':
		case 'email':
		case 'number':
		case 'text':
		default:
			return (
				<>
					<TextInput
						type={field.type}
						placeholder={field.placeholder}
						required={field.required}
						inputWidth={field.inputWidth}
						{...field.inputAttrs}
						{...inputProps}
						{...dynamicInputProps}
					/>
					<InputErrorMessage errorMessage={errorMessage as string} />
				</>
			)
	}
}
