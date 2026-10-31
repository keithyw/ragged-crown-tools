'use client'

import { useCallback, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import type { Referrer } from '@/lib/services/collection'

interface UseDeleteRecordProps<T> {
	collectionName: string
	deleteFn: (collectionName: string, id: string) => Promise<void>
	referrerFn: (collectionName: string, id: string) => Promise<Referrer | null>
	onSuccess?: () => void
	itemNameProp: keyof T
}

export function useDeleteRecord<T extends { _id: string }>({
	collectionName,
	deleteFn,
	referrerFn,
	onSuccess,
	itemNameProp,
}: UseDeleteRecordProps<T>) {
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	const [isDeleting, setIsDeleting] = useState<boolean>(false)
	const [deleteItem, setDeleteItem] = useState<T | null>(null)
	const [isChecking, setIsChecking] = useState<boolean>(false)
	const [referrer, setReferrer] = useState<Referrer | null>(null)
	const [checkFailed, setCheckFailed] = useState<boolean>(false)
	// Only the latest check may set state: closing or reopening the modal
	// must not let a slow earlier answer land on a different item.
	const checkId = useRef(0)

	const openDeleteModal = useCallback(
		async (item: T) => {
			const thisCheck = ++checkId.current
			setDeleteItem(item)
			setReferrer(null)
			setCheckFailed(false)
			setIsChecking(true)
			setIsModalOpen(true)
			try {
				const found = await referrerFn(collectionName, item._id)
				if (thisCheck === checkId.current) setReferrer(found)
			} catch (e: unknown) {
				console.error('Failed checking references: ', e)
				if (thisCheck === checkId.current) setCheckFailed(true)
			} finally {
				if (thisCheck === checkId.current) setIsChecking(false)
			}
		},
		[collectionName, referrerFn],
	)

	const closeDeleteModal = useCallback(() => {
		checkId.current++
		setIsModalOpen(false)
		setDeleteItem(null)
		setReferrer(null)
		setCheckFailed(false)
		setIsChecking(false)
	}, [])

	// Deleting is allowed only once the check came back clean. A failed check
	// blocks too, since it can't say the item is unused.
	const canDelete = !isChecking && !checkFailed && !referrer

	let blockedMessage: string | null = null
	if (referrer) {
		const label = referrer.id
			? `${referrer.name} (${referrer.id})`
			: referrer.name
		blockedMessage = `Used by ${label}. Remove that reference first, then delete this.`
	} else if (checkFailed) {
		blockedMessage =
			"Couldn't check whether this is still in use. Close this and try again."
	}

	const handleDelete = useCallback(async () => {
		if (!deleteItem || !canDelete) return
		setIsDeleting(true)
		try {
			await deleteFn(collectionName, deleteItem._id)
			toast.success(`${String(deleteItem[itemNameProp])} has been deleted`)
			if (onSuccess) onSuccess()
			closeDeleteModal()
		} catch (e: unknown) {
			console.error('Failed deleting item: ', e)
			toast.error('Failed to deletee item')
		} finally {
			setIsDeleting(false)
		}
	}, [
		canDelete,
		closeDeleteModal,
		collectionName,
		deleteFn,
		deleteItem,
		itemNameProp,
		onSuccess,
	])

	return {
		isModalOpen,
		deleteItem,
		isDeleting,
		canDelete,
		blockedMessage,
		openDeleteModal,
		closeDeleteModal,
		handleDelete,
	}
}
