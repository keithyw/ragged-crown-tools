'use client'

import { useEffect, useState } from 'react'
import { useForm, DefaultValues, FieldValues } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { handleFormErrors } from '@/lib/utils'

interface UseEditRecordProps<T extends z.ZodType<{ id: string }>, TResponse> {
	collectionName: string
	id: string
	defaultValues?: Partial<z.infer<T>>
	getData: (collectionName: string, id: string) => Promise<TResponse>
	updateData: (
		collectionName: string,
		id: string,
		data: z.infer<T>,
	) => Promise<TResponse>
	errorLoadingMessage: string
	redirectUrl: string
	schema: T
	handleFetchCallback: (data: TResponse) => Partial<z.infer<T>>
	transformData: (data: z.infer<T>) => Promise<z.infer<T>>
}

export function useEditRecord<T extends z.ZodType<{ id: string }>, TResponse>({
	collectionName,
	id,
	defaultValues,
	getData,
	updateData,
	errorLoadingMessage,
	redirectUrl,
	schema,
	handleFetchCallback,
	transformData,
}: UseEditRecordProps<T, TResponse>) {
	type TFieldValues = z.infer<T> & FieldValues
	const router = useRouter()
	// Which record has finished loading (or failed to). "Loading" is simply "that
	// isn't the record we're editing yet", so the effect never has to call
	// setState before it awaits.
	const [loaded, setLoaded] = useState<{
		id: string
		error: string | null
	} | null>(null)
	// const [items, setItems] = useState<StoredDoc<TData>[]>([])
	const [data, setData] = useState<TResponse | null>(null)

	const formMethods = useForm<TFieldValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(schema as any),
		defaultValues: defaultValues as DefaultValues<TFieldValues>,
	})

	const { handleSubmit, setError, reset } = formMethods

	const onSubmit = async (data: TFieldValues) => {
		try {
			const payload = await transformData(data)
			const res = await updateData(collectionName, id, payload)
			setData(res)
			toast.success(`Item updated successfully!`)
			router.push(redirectUrl)
		} catch (e: unknown) {
			handleFormErrors<TFieldValues>(
				e,
				setError,
				'Failed to edit item. Please review your input.',
			)
		}
	}

	useEffect(() => {
		let cancelled = false
		getData(collectionName, id).then(
			(res) => {
				if (cancelled) return
				if (res) {
					setData(res)
					reset(handleFetchCallback(res) as DefaultValues<TFieldValues>)
				}
				setLoaded({ id, error: null })
			},
			(e: unknown) => {
				if (cancelled) return
				if (e instanceof Error) {
					toast.error(errorLoadingMessage)
					console.error(e.message)
					router.push(redirectUrl)
				}
				setLoaded({
					id,
					error: e instanceof Error ? errorLoadingMessage : null,
				})
			},
		)
		return () => {
			cancelled = true
		}
	}, [
		collectionName,
		errorLoadingMessage,
		getData,
		handleFetchCallback,
		id,
		redirectUrl,
		reset,
		router,
	])

	const isCurrent = loaded?.id === id

	return {
		data,
		isLoading: !isCurrent,
		fieldErrors: formMethods.formState.errors,
		isSubmitting: formMethods.formState.isSubmitting,
		loadingError: isCurrent ? loaded.error : null,
		register: formMethods.register,
		control: formMethods.control,
		reset,
		onSubmit: handleSubmit(onSubmit),
	}
}
