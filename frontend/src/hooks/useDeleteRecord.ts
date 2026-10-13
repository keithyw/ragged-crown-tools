'use client'

import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

interface UseDeleteRecordProps<T> {
	collectionName: string
	deleteFn: (collectionName: string, id: string) => Promise<void>
	onSuccess?: () => void
	itemNameProp: keyof T
}

export function useDeleteRecord<T extends { _id: string }>({
	collectionName,
	deleteFn,
	onSuccess,
	itemNameProp,
}: UseDeleteRecordProps<T>) {
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	const [isDeleting, setIsDeleting] = useState<boolean>(false)
	const [deleteItem, setDeleteItem] = useState<T | null>(null)

	const openDeleteModal = useCallback((item: T) => {
		setDeleteItem(item)
		setIsModalOpen(true)
	}, [])

	const closeDeleteModal = useCallback(() => {
		setIsModalOpen(false)
		setDeleteItem(null)
	}, [])

	const handleDelete = useCallback(async () => {
		if (!deleteItem) return
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
		openDeleteModal,
		closeDeleteModal,
		handleDelete,
	}
}
