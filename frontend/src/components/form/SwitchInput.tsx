interface SwitchInputProps {
	id: string
	label: string
	value: boolean
	onChange: (next: boolean) => void
	offLabel: string // shown on the left; selected when value is false
	onLabel: string // shown on the right; selected when value is true
}

// A two-button switch for a boolean that is really a choice between two named
// options ("One way" / "Two way"), where a lone checkbox would be unclear.
export const SwitchInput = ({
	id,
	label,
	value,
	onChange,
	offLabel,
	onLabel,
}: SwitchInputProps) => {
	const button = (selected: boolean, text: string, next: boolean) => (
		<button
			type='button'
			aria-pressed={selected}
			onClick={() => onChange(next)}
			className={`px-4 py-2 text-sm font-bold ${
				selected
					? 'bg-blue-600 text-white'
					: 'bg-white text-gray-700 hover:bg-gray-100'
			}`}
		>
			{text}
		</button>
	)
	return (
		<div className='mb-4'>
			<span id={id} className='mb-2 block text-sm font-bold text-gray-700'>
				{label}
			</span>
			<div
				role='group'
				aria-labelledby={id}
				className='inline-flex divide-x divide-gray-300 overflow-hidden rounded border border-gray-300'
			>
				{button(!value, offLabel, false)}
				{button(value, onLabel, true)}
			</div>
		</div>
	)
}
