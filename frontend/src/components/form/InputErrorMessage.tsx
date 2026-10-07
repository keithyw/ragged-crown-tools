interface InputErrorMessageProps {
	errorMessage: string
}

export const InputErrorMessage: React.FC<InputErrorMessageProps> = ({
	errorMessage,
}) => {
	if (!errorMessage) {
		return null
	}
	return <p className='mb-2 text-xs text-red-500 italic'>{errorMessage}</p>
}
