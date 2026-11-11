'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components'

interface CancelSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	cancelUrl: string
	onCancel?: () => void
}

export const CancelSubmitButton = ({
	cancelUrl,
	onCancel,
	...props
}: CancelSubmitButtonProps) => {
	const router = useRouter()

	const handleCancel = () => {
		onCancel?.()
		router.push(cancelUrl)
	}

	return (
		<Button actionType='danger' type='button' onClick={handleCancel} {...props}>
			Cancel
		</Button>
	)
}
