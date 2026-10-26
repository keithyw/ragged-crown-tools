'use client'

import { Button, TileGlyph } from '@/components'
import { type Glyph } from '@/lib/types'

interface ToolPickerSectionProps {
	title: string
	// The tile, object or item currently chosen for this tool.
	def?: { glyph: Glyph; name: string; id?: string }
	noneLabel: string
	chooseLabel: string
	changeLabel: string
	startLabel: string
	hasMap: boolean
	isActive: boolean
	onChoose: () => void
	onStart: () => void
	onStop: () => void
	activeHint: string
	resumeHint: string
	chooseHint: string
}

// A block in the builder's right panel for a tool that works with a chosen
// def: a preview, Choose / Change, Start / Stop, and a hint. Shared by Paint
// (tiles), Object and Item.
export const ToolPickerSection = ({
	title,
	def,
	noneLabel,
	chooseLabel,
	changeLabel,
	startLabel,
	hasMap,
	isActive,
	onChoose,
	onStart,
	onStop,
	activeHint,
	resumeHint,
	chooseHint,
}: ToolPickerSectionProps) => (
	<section>
		<h3 className='mb-2 text-sm font-bold text-gray-700'>{title}</h3>
		<div className='flex items-center gap-3'>
			{def ? (
				<TileGlyph variant='cell' tile={def} />
			) : (
				<span className='h-11 w-11 shrink-0 rounded border border-dashed border-gray-300' />
			)}
			<div className='min-w-0 text-sm'>
				{def ? (
					<>
						<div className='truncate font-medium'>{def.name}</div>
						<div className='truncate text-xs text-gray-500'>{def.id}</div>
					</>
				) : (
					<span className='text-gray-500'>{noneLabel}</span>
				)}
			</div>
		</div>
		<div className='mt-3 flex gap-2'>
			<Button
				type='button'
				actionType='submit'
				disabled={!hasMap}
				onClick={onChoose}
			>
				{def ? changeLabel : chooseLabel}
			</Button>
			{isActive ? (
				<Button type='button' actionType='neutral' onClick={onStop}>
					Stop
				</Button>
			) : (
				def && (
					<Button type='button' actionType='submit' onClick={onStart}>
						{startLabel}
					</Button>
				)
			)}
		</div>
		<p className='mt-2 text-sm text-gray-500'>
			{isActive
				? activeHint
				: !hasMap
					? 'Draw a map first.'
					: def
						? resumeHint
						: chooseHint}
		</p>
	</section>
)
