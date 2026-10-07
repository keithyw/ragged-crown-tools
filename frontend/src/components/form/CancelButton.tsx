'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components'

interface CancelSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	cancelUrl: string
}

export const CancelSubmitButton = ({
	cancelUrl,
	...props
}: CancelSubmitButtonProps) => {
	const router = useRouter()

	const handleCancel = () => {
		router.push(cancelUrl)
	}

	return (
		<Button actionType='danger' type='button' onClick={handleCancel} {...props}>
			Cancel
		</Button>
	)
}
