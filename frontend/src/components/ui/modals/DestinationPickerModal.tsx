'use client'

import { useState } from 'react'
import { DialogTitle } from '@headlessui/react'
import { BaseModal, Button, SelectDropdown, ZoneMapGrid } from '@/components'
import { type StoredDoc } from '@/lib/services'
import {
	type Destination,
	type Glyph,
	type Position,
	type TileDef,
	type Zone,
} from '@/lib/types'
import { type ZoneGrid } from '@/lib/utils'

// What the picker needs to draw a zone's map.
interface MapSource {
	grid: ZoneGrid
	placements?: Zone['placements']
	startingPosition?: Position
}

// The zone being edited, as it is right now, unsaved changes included. `_id`
// is absent until the zone has been saved once; grid is null before a map is
// drawn.
export interface ThisZone {
	_id?: string
	name: string
	grid: ZoneGrid | null
	placements?: Zone['placements']
	startingPosition?: Position
}

// The part of the picker's props that does not change per portal.
export interface DestinationPickerData {
	zones: StoredDoc<Zone>[]
	thisZone: ThisZone
	tilesById: ReadonlyMap<string, StoredDoc<TileDef>>
	placedDefs: ReadonlyMap<string, { glyph: Glyph }>
}

type Mode = 'other' | 'this'

interface DestinationFormProps extends DestinationPickerData {
	initial?: Destination
	onClose: () => void
	onConfirm: (destination: Destination) => void
}

// Lives inside the modal, so it unmounts on close and its state resets each
// time the modal opens.
const DestinationForm = ({
	zones,
	thisZone,
	tilesById,
	placedDefs,
	initial,
	onClose,
	onConfirm,
}: DestinationFormProps) => {
	const canPickThis = Boolean(thisZone._id && thisZone.grid)
	const [mode, setMode] = useState<Mode>(
		initial && thisZone._id && initial.zoneId === thisZone._id
			? 'this'
			: 'other',
	)
	const [zoneId, setZoneId] = useState(
		initial && initial.zoneId !== thisZone._id ? initial.zoneId : '',
	)
	const [pos, setPos] = useState<Position | null>(initial?.pos ?? null)
	const [useStart, setUseStart] = useState(!initial?.pos)

	const otherZone = zones.find((z) => z._id === zoneId)
	const source: MapSource | null =
		mode === 'this'
			? thisZone.grid
				? { ...thisZone, grid: thisZone.grid }
				: null
			: otherZone
				? { grid: otherZone.terrain, ...otherZone }
				: null
	const targetId = mode === 'this' ? thisZone._id : otherZone?._id
	const hasMap = Boolean(source && source.grid.length > 0)
	const canConfirm = Boolean(targetId && hasMap && (useStart || pos))

	// A different map means the old landing cell means nothing.
	const resetLanding = () => {
		setPos(null)
		setUseStart(true)
	}

	const confirm = () => {
		if (!targetId) return
		onConfirm(
			useStart || !pos ? { zoneId: targetId } : { zoneId: targetId, pos },
		)
	}

	return (
		<>
			<DialogTitle
				as='h3'
				className='text-lg leading-6 font-medium text-gray-900'
			>
				Choose a destination
			</DialogTitle>

			<div className='mt-4 space-y-2 text-sm text-gray-900'>
				<label className='flex items-center gap-2'>
					<input
						type='radio'
						name='destination-mode'
						checked={mode === 'other'}
						onChange={() => {
							setMode('other')
							resetLanding()
						}}
					/>
					Another zone
				</label>
				<label
					className={`flex items-center gap-2 ${canPickThis ? '' : 'text-gray-400'}`}
				>
					<input
						type='radio'
						name='destination-mode'
						checked={mode === 'this'}
						disabled={!canPickThis}
						onChange={() => {
							setMode('this')
							resetLanding()
						}}
					/>
					This zone (a teleport square)
				</label>
				{!canPickThis && (
					<p className='text-xs text-gray-500'>
						{thisZone._id
							? 'Draw a map first to pick a spot on this zone.'
							: 'Save this zone first: a new zone has no id to point at yet.'}
					</p>
				)}
			</div>

			{mode === 'other' && (
				<div className='mt-4'>
					<SelectDropdown
						id='destination-zone'
						name='destinationZone'
						label='Zone'
						placeholder='Select a zone'
						options={zones
							.filter((z) => z._id !== thisZone._id)
							.map((z) => ({ value: z._id, label: `${z.name} (${z.id})` }))}
						selectedValue={zoneId || null}
						onSelect={(v) => {
							setZoneId(v === null ? '' : String(v))
							resetLanding()
						}}
					/>
				</div>
			)}

			{source && hasMap ? (
				<div className='mt-4'>
					<label className='mb-2 flex items-center gap-2 text-sm text-gray-900'>
						<input
							type='checkbox'
							checked={useStart}
							onChange={(e) => {
								setUseStart(e.target.checked)
								if (e.target.checked) setPos(null)
							}}
						/>
						Arrive at the zone&apos;s start position
					</label>
					{!source.startingPosition && useStart && (
						<p className='mb-2 text-xs text-amber-700'>
							This zone has no start position set yet.
						</p>
					)}
					<p className='mb-2 text-xs text-gray-500'>
						Or click the cell where the player lands. Blue outline: start
						position. Pink outline: landing cell.
					</p>
					<div className='max-h-[55vh] overflow-auto'>
						<ZoneMapGrid
							grid={source.grid}
							tilesById={tilesById}
							placements={source.placements}
							placedDefs={placedDefs}
							startingPosition={source.startingPosition}
							selectedCell={useStart ? null : pos}
							onCellAction={(x, y) => {
								setPos({ x, y })
								setUseStart(false)
							}}
							dragToApply={false}
						/>
					</div>
				</div>
			) : (
				mode === 'other' &&
				zoneId && (
					<p className='mt-4 text-sm text-gray-500'>
						This zone has no map yet.
					</p>
				)
			)}

			<div className='mt-4 flex justify-end space-x-3'>
				<Button type='button' actionType='neutral' onClick={onClose}>
					Cancel
				</Button>
				<Button
					type='button'
					actionType='submit'
					disabled={!canConfirm}
					onClick={confirm}
				>
					Confirm
				</Button>
			</div>
		</>
	)
}

interface DestinationPickerModalProps extends DestinationPickerData {
	isOpen: boolean
	initial?: Destination
	onClose: () => void
	onConfirm: (destination: Destination) => void
}

export const DestinationPickerModal = ({
	isOpen,
	onClose,
	...rest
}: DestinationPickerModalProps) => (
	<BaseModal isOpen={isOpen} onClose={onClose} panelClassName='max-w-5xl'>
		<DestinationForm onClose={onClose} {...rest} />
	</BaseModal>
)
