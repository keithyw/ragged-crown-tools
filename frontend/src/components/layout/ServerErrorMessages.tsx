interface ServerErrorMessagesProps {
	message: string
}

export const ServerErrorMessages = ({ message }: ServerErrorMessagesProps) => {
	return (
		<div
			className='relative mb-4 rounded border-red-400 bg-red-100 px-4 py-3 text-red-700'
			role='alert'
		>
			<strong className='font-bold'>Errors</strong>
			<span className='block sm:inline'>{message}</span>
		</div>
	)
}
