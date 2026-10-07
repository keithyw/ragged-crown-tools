'use client'

import { useState } from 'react'
import { HUES, NEUTRALS, OPACITIES, SHADES, type ColorKind } from '@/lib/types'
import { cn } from '@/lib/utils'

const Swatch = ({
	kind,
	cls,
	className,
}: {
	kind: ColorKind
	cls?: string
	className?: string
}) => (
	<span
		className={cn(
			'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-400 text-xs font-bold',
			kind === 'bg' ? cls : cn('bg-black', cls),
			!cls && 'border-dashed bg-transparent',
			className,
		)}
	>
		{kind === 'text' && cls ? 'Aa' : null}
	</span>
)

interface ColorPickerProps {
	id: string
	label: string
	kind: ColorKind
	value?: string
	onChange: (v: string) => void
	onBlur?: () => void
}

export const ColorPicker = ({
	id,
	label,
	kind,
	value = '',
	onChange,
	onBlur,
}: ColorPickerProps) => {
	const [open, setOpen] = useState(false)
	const opacity = value.match(/\/\d+$/)?.[0] ?? ''
	const base = value.replace(/\/\d+$/, '')

	const pickBase = (cls: string) =>
		onChange(cls + (cls.includes('-') && /-\d+$/.test(cls) ? opacity : ''))
	const pickOpacity = (o: string) => onChange(base + o)

	return (
		<div className='relative mb-4'>
			<label
				htmlFor={id}
				className='mb-2 block text-sm font-bold text-gray-700'
			>
				{label}
			</label>
			<div className='flex items-center gap-2'>
				<button
					type='button'
					onClick={() => setOpen((o) => !o)}
					aria-label={`Pick ${label}`}
				>
					<Swatch kind={kind} cls={value || undefined} />
				</button>
				<input
					id={id}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onBlur={onBlur}
					placeholder={
						kind === 'text' ? 'text-emerald-400' : 'bg-emerald-950/60'
					}
					className='w-full rounded border px-3 py-2 text-gray-700 shadow focus:border-blue-500 focus:outline-none'
				/>
			</div>

			{open && (
				<div className='mt-2 w-fit rounded border bg-white p-3 shadow'>
					<div className='mb-2 flex gap-1'>
						{NEUTRALS[kind].map((cls) => (
							<button
								key={cls}
								type='button'
								title={cls}
								onClick={() => onChange(cls)}
							>
								<Swatch kind={kind} cls={cls} />
							</button>
						))}
					</div>
					<div
						className='grid gap-1'
						style={{
							gridTemplateColumns: `repeat(${SHADES[kind].length}, 1.75rem)`,
						}}
					>
						{HUES.flatMap((hue) =>
							SHADES[kind].map((shade) => {
								const cls = `${kind}-${hue}-${shade}`
								return (
									<button
										key={cls}
										type='button'
										title={cls}
										onClick={() => pickBase(cls)}
									>
										<Swatch
											kind={kind}
											cls={cls}
											className={cn(base === cls && 'ring-2 ring-blue-500')}
										/>
									</button>
								)
							}),
						)}
					</div>
					<div className='mt-3 flex items-center gap-1 text-xs text-gray-600'>
						Opacity:
						{OPACITIES[kind].map((o) => (
							<button
								key={o || 'full'}
								type='button'
								onClick={() => pickOpacity(o)}
								className={cn(
									'rounded border px-2 py-0.5',
									opacity === o && 'border-blue-500 bg-blue-50',
								)}
							>
								{o ? o.slice(1) + '%' : '100%'}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
