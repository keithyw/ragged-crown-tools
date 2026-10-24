'use client'

import { useRef, useState } from 'react'
import {
	Button,
	CHECKERBOARD,
	ConfirmationModal,
	SpriteImage,
} from '@/components'
import {
	EGA_PALETTE,
	emptySpriteArt,
	SPRITE_SIZE,
	type SpriteArt,
	type SpriteBackground,
	type SpritePixels,
} from '@/lib/types'
import { cn, parseSpritePixels, spritePixelsToText } from '@/lib/utils'

const CELL_PX = 24

const backgroundStyle = (bg: SpriteBackground): React.CSSProperties =>
	bg === 'transparent' ? CHECKERBOARD : { backgroundColor: EGA_PALETTE[bg].hex }

const cellAt = (e: React.PointerEvent<HTMLElement>) => {
	const el = document
		.elementFromPoint(e.clientX, e.clientY)
		?.closest<HTMLElement>('[data-i]')
	if (!el || !e.currentTarget.contains(el)) return null
	return Number(el.dataset.i)
}

const Swatch = ({
	label,
	hex,
	selected,
	onClick,
}: {
	label: string
	hex?: string
	selected: boolean
	onClick: () => void
}) => (
	<button
		type='button'
		title={label}
		aria-label={label}
		aria-pressed={selected}
		onClick={onClick}
		className={cn(
			'h-7 w-7 cursor-pointer rounded border border-gray-400',
			selected && 'outline-2 outline-offset-1 outline-blue-500',
		)}
		style={hex ? { backgroundColor: hex } : CHECKERBOARD}
	/>
)

interface SpriteEditorProps {
	value: SpriteArt
	onChange: (value: SpriteArt) => void
	// Shown at the top of the right-hand panel (the sprite's details form)...
	details?: React.ReactNode
	// ...and at the bottom (save and cancel).
	footer?: React.ReactNode
}

export const SpriteEditor = ({
	value,
	onChange,
	details,
	footer,
}: SpriteEditorProps) => {
	// A palette index, or 'delete' to clear the cells painted over.
	const [color, setColor] = useState<number | 'delete'>(0)
	const [isClearOpen, setIsClearOpen] = useState(false)
	// Text typed into the box but not applied yet; null shows the canvas.
	const [draft, setDraft] = useState<string | null>(null)
	const [draftError, setDraftError] = useState<string | null>(null)
	const [panel, setPanel] = useState<'color' | 'text'>('color')
	const [isCopied, setIsCopied] = useState(false)
	// The pixels as of the last paint in the current stroke. Moves can arrive
	// faster than renders, so a stroke edits its own copy instead of `value`.
	const strokePixels = useRef<SpritePixels | null>(null)
	const lastCell = useRef<number | null>(null)

	const text = draft ?? spritePixelsToText(value.pixels)

	const copyText = async () => {
		try {
			await navigator.clipboard.writeText(text)
			setIsCopied(true)
			setTimeout(() => setIsCopied(false), 1500)
		} catch {
			setDraftError('Could not copy to the clipboard.')
		}
	}

	const paintAt = (e: React.PointerEvent<HTMLElement>) => {
		const i = cellAt(e)
		if (i === null || i === lastCell.current || !strokePixels.current) return
		lastCell.current = i
		const next = color === 'delete' ? null : color
		if (strokePixels.current[i] === next) return
		strokePixels.current = strokePixels.current.with(i, next)
		onChange({ ...value, pixels: strokePixels.current })
	}

	const endStroke = () => {
		strokePixels.current = null
		lastCell.current = null
	}

	return (
		<div className='flex flex-wrap items-start gap-8'>
			<div>
				<div className='mb-4'>
					<Button
						type='button'
						actionType='neutral'
						onClick={() => setIsClearOpen(true)}
					>
						Clear Image
					</Button>
				</div>

				<div
					role='img'
					aria-label={`Sprite canvas, ${SPRITE_SIZE} by ${SPRITE_SIZE} pixels`}
					className='grid w-fit cursor-crosshair touch-none border border-gray-400 select-none'
					style={{
						gridTemplateColumns: `repeat(${SPRITE_SIZE}, ${CELL_PX}px)`,
						...backgroundStyle(value.background),
					}}
					onPointerDown={(e) => {
						if (e.button !== 0) return
						setDraft(null)
						setDraftError(null)
						strokePixels.current = value.pixels
						paintAt(e)
					}}
					onPointerMove={(e) => {
						if (strokePixels.current) paintAt(e)
					}}
					onPointerUp={endStroke}
					onPointerLeave={endStroke}
					onPointerCancel={endStroke}
				>
					{value.pixels.map((p, i) => (
						<div
							key={i}
							data-i={i}
							className='shadow-[inset_0_0_0_1px_rgba(128,128,128,0.35)]'
							style={{
								width: CELL_PX,
								height: CELL_PX,
								backgroundColor: p === null ? undefined : EGA_PALETTE[p].hex,
							}}
						/>
					))}
				</div>

				<div className='mt-6'>
					<p className='mb-2 text-sm font-bold text-gray-700'>Preview</p>
					<SpriteImage art={value} scale={3} />
				</div>
			</div>

			<div className='flex w-64 flex-col gap-6'>
				{details}
				<div>
					<div
						role='tablist'
						className='mb-3 flex gap-4 border-b border-gray-300'
					>
						{(
							[
								['color', 'Color'],
								['text', 'Import / Export'],
							] as const
						).map(([id, label]) => (
							<button
								key={id}
								type='button'
								role='tab'
								aria-selected={panel === id}
								onClick={() => setPanel(id)}
								className={cn(
									'-mb-px cursor-pointer border-b-2 pb-1 text-sm font-bold',
									panel === id
										? 'border-blue-500 text-gray-900'
										: 'border-transparent text-gray-500 hover:text-gray-700',
								)}
							>
								{label}
							</button>
						))}
					</div>
					{panel === 'color' ? (
						<>
							<div className='grid w-fit grid-cols-[repeat(4,1.75rem)] gap-2'>
								{EGA_PALETTE.map((c, i) => (
									<Swatch
										key={c.hex}
										label={c.name}
										hex={c.hex}
										selected={color === i}
										onClick={() => setColor(i)}
									/>
								))}
							</div>
							<div className='mt-3 flex items-center gap-2 text-sm text-gray-700'>
								<Swatch
									label='Delete'
									selected={color === 'delete'}
									onClick={() => setColor('delete')}
								/>
								Delete
							</div>

							<div className='mt-6'>
								<p className='mb-2 text-sm font-bold text-gray-700'>
									Background
								</p>
								<div className='mb-2 flex items-center gap-2 text-sm text-gray-700'>
									<Swatch
										label='Transparent'
										selected={value.background === 'transparent'}
										onClick={() =>
											onChange({ ...value, background: 'transparent' })
										}
									/>
									Transparent
								</div>
								<div className='grid w-fit grid-cols-[repeat(4,1.75rem)] gap-2'>
									{EGA_PALETTE.map((c, i) => (
										<Swatch
											key={c.hex}
											label={c.name}
											hex={c.hex}
											selected={value.background === i}
											onClick={() => onChange({ ...value, background: i })}
										/>
									))}
								</div>
							</div>
						</>
					) : (
						<div>
							<div className='group relative mb-2 flex items-center gap-2 text-sm text-gray-700'>
								Sprite data as text
								<button
									type='button'
									aria-label='How import and export work'
									aria-describedby='sprite-text-help'
									className='flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-gray-400 text-xs font-bold text-gray-600 hover:bg-gray-100 focus:outline-2 focus:outline-blue-500'
								>
									?
								</button>
								<div
									id='sprite-text-help'
									role='tooltip'
									className='invisible absolute top-full left-0 z-10 mt-1 w-64 rounded bg-gray-900 p-3 text-xs font-normal text-white shadow-lg group-focus-within:visible group-hover:visible'
								>
									<p className='mb-2'>
										<strong>Export:</strong> press Copy to take the whole sprite
										as text. It is 16 rows of 16 characters, one per pixel.
									</p>
									<p className='mb-2'>
										<strong>Import:</strong> paste rows into the box and press
										Apply. A code block pasted from a chat reply works.
									</p>
									<p>
										0-F is the color in palette order (0 black, F white).
										&quot;.&quot; is an empty cell. The background is not
										included.
									</p>
								</div>
							</div>
							<textarea
								aria-label='Sprite pixels as text'
								rows={SPRITE_SIZE}
								spellCheck={false}
								value={text}
								onChange={(e) => {
									setDraft(e.target.value)
									setDraftError(null)
								}}
								className='w-full rounded border border-gray-400 p-2 font-mono text-sm leading-tight text-gray-700 focus:border-blue-500 focus:outline-none'
							/>
							{draftError && (
								<p className='mt-1 text-sm text-red-600'>{draftError}</p>
							)}
							<div className='mt-2 flex flex-wrap gap-2'>
								<Button
									type='button'
									actionType='neutral'
									className='px-3 py-1 text-sm'
									onClick={copyText}
								>
									{isCopied ? 'Copied' : 'Copy'}
								</Button>
								{draft !== null && (
									<>
										<Button
											type='button'
											actionType='edit'
											className='px-3 py-1 text-sm'
											onClick={() => {
												const result = parseSpritePixels(draft)
												if (!result.ok) {
													setDraftError(result.error)
													return
												}
												onChange({ ...value, pixels: result.pixels })
												setDraft(null)
											}}
										>
											Apply
										</Button>
										<Button
											type='button'
											actionType='neutral'
											className='px-3 py-1 text-sm'
											onClick={() => {
												setDraft(null)
												setDraftError(null)
											}}
										>
											Revert
										</Button>
									</>
								)}
							</div>
						</div>
					)}
				</div>
				{footer}
			</div>
			<ConfirmationModal
				isOpen={isClearOpen}
				onClose={() => setIsClearOpen(false)}
				onConfirm={() => {
					onChange({ ...value, pixels: emptySpriteArt().pixels })
					setIsClearOpen(false)
				}}
				title='Clear Image'
				message='Clear everything you have drawn? The background setting is kept.'
				isDeleting={false}
				confirmButtonText='Clear'
			/>
		</div>
	)
}
