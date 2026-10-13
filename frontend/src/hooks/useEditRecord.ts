'use client'

import { useCallback, useEffect, useState } from 'react'
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

// export function useCollection<TData extends object>(collectionName: string) {
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
	const [isLoading, setIsLoading] = useState(false)
	const [loadingError, setLoadingError] = useState<string | null>(null)
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

	const fetchItem = useCallback(async () => {
		setIsLoading(true)
		setLoadingError(null)
		try {
			const res = await getData(collectionName, id)
			if (res) {
				setData(res)
				const vals = handleFetchCallback(res)
				reset(vals as DefaultValues<TFieldValues>)
			}
		} catch (e: unknown) {
			if (e instanceof Error) {
				setLoadingError(errorLoadingMessage)
				toast.error(errorLoadingMessage)
				console.error(e.message)
				router.push(redirectUrl)
			}
		} finally {
			setIsLoading(false)
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

	useEffect(() => {
		void fetchItem()
	}, [fetchItem])

	return {
		data,
		isLoading,
		fieldErrors: formMethods.formState.errors,
		isSubmitting: formMethods.formState.isSubmitting,
		loadingError,
		register: formMethods.register,
		control: formMethods.control,
		reset,
		onSubmit: handleSubmit(onSubmit),
	}
}
