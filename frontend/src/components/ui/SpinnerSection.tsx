import { LoadingSpinner } from '@/components'

interface SpinnerSectionProps {
	spinnerMessage: string
}

export const SpinnerSection: React.FC<SpinnerSectionProps> = ({
	spinnerMessage,
}) => {
	return (
		<div className='flex min-h-[50vh] items-center justify-center'>
			<LoadingSpinner message={spinnerMessage} size='lg' />
		</div>
	)
}
