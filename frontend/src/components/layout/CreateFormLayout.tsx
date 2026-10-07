import { Button, CancelSubmitButton } from '@/components'

interface CreateFormLayoutProps {
	title: string
	isSubmitting: boolean
	submitText: string
	submittingText: string
	cancelUrl?: string
	handleSubmit: React.SubmitEventHandler<HTMLFormElement>
	children: React.ReactNode
}

export const CreateFormLayout = ({
	title,
	isSubmitting,
	submitText,
	submittingText,
	cancelUrl,
	handleSubmit,
	children,
}: CreateFormLayoutProps) => {
	return (
		<div className='mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md'>
			<h2 className='mb-6 text-2xl font-bold text-gray-800'>{title}</h2>
			<form onSubmit={handleSubmit} className='space-y-4'>
				{children}
				<div className='mt-6 flex justify-end space-x-3'>
					<Button actionType='submit' disabled={isSubmitting}>
						{isSubmitting ? submittingText : submitText}
					</Button>
					{cancelUrl && <CancelSubmitButton cancelUrl={cancelUrl} />}
				</div>
			</form>
		</div>
	)
}
