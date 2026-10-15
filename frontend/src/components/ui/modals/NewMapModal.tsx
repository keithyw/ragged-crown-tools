'use client'

import { useState } from 'react'
import { DialogTitle } from '@headlessui/react'
import { BaseModal, Button, SelectDropdown, TextInput } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type TileDef } from '@/lib/types'
import { MAX_ZONE_SIZE, MIN_ZONE_SIZE } from '@/lib/utils'

export interface NewMapValues {
	width: number
	height: number
	tileId: string // the default tile's _id
}

const parseSize = (v: string): number | null => {
	const n = Number(v)
	return Number.isInteger(n) && n >= MIN_ZONE_SIZE && n <= MAX_ZONE_SIZE
		? n
		: null
}

const sizeError = `Whole number from ${MIN_ZONE_SIZE} to ${MAX_ZONE_SIZE}`

interface NewMapFormProps {
	tiles: StoredDoc<TileDef>[]
	initial: Partial<NewMapValues>
	replacesPaintedMap: boolean
	onClose: () => void
	onSubmit: (v: NewMapValues) => void
}

// Lives inside the modal, so it unmounts on close and its state resets
// each time the modal opens.
const NewMapForm = ({
	tiles,
	initial,
	replacesPaintedMap,
	onClose,
	onSubmit,
}: NewMapFormProps) => {
	const [width, setWidth] = useState(String(initial.width ?? 8))
	const [height, setHeight] = useState(String(initial.height ?? 8))
	const [tileId, setTileId] = useState(initial.tileId ?? '')

	const w = parseSize(width)
	const h = parseSize(height)
	const canSubmit = w !== null && h !== null && tileId !== ''

	const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (w === null || h === null || !tileId) return
		onSubmit({ width: w, height: h, tileId })
	}

	return (
		<form onSubmit={handleSubmit}>
			<DialogTitle
				as='h3'
				className='text-lg leading-6 font-medium text-gray-900'
			>
				Draw a base map
			</DialogTitle>

			<div className='mt-4 flex gap-4'>
				<div>
					<TextInput
						id='map-width'
						label='Width'
						type='number'
						inputWidth='sm'
						min={MIN_ZONE_SIZE}
						max={MAX_ZONE_SIZE}
						value={width}
						onChange={(e) => setWidth(e.target.value)}
					/>
					{w === null && (
						<p className='-mt-3 text-xs text-red-600'>{sizeError}</p>
					)}
				</div>
				<div>
					<TextInput
						id='map-height'
						label='Height'
						type='number'
						inputWidth='sm'
						min={MIN_ZONE_SIZE}
						max={MAX_ZONE_SIZE}
						value={height}
						onChange={(e) => setHeight(e.target.value)}
					/>
					{h === null && (
						<p className='-mt-3 text-xs text-red-600'>{sizeError}</p>
					)}
				</div>
			</div>

			<SelectDropdown
				id='map-default-tile'
				name='defaultTile'
				label='Default tile'
				placeholder='Select a tile'
				options={tiles.map((t) => ({
					value: t._id,
					label: `${t.name} (${t.id})`,
				}))}
				selectedValue={tileId || null}
				onSelect={(v) => setTileId(v === null ? '' : String(v))}
			/>

			{replacesPaintedMap && (
				<p className='mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900'>
					This map has painted tiles. Drawing a new map replaces them.
				</p>
			)}

			<div className='mt-4 flex justify-end space-x-3'>
				<Button type='button' actionType='neutral' onClick={onClose}>
					Cancel
				</Button>
				<Button
					type='submit'
					actionType={replacesPaintedMap ? 'danger' : 'submit'}
					disabled={!canSubmit}
				>
					{replacesPaintedMap ? 'Replace map' : 'Draw map'}
				</Button>
			</div>
		</form>
	)
}

interface NewMapModalProps {
	isOpen: boolean
	tiles: StoredDoc<TileDef>[]
	initial?: Partial<NewMapValues>
	replacesPaintedMap?: boolean
	onClose: () => void
	onSubmit: (v: NewMapValues) => void
}

export const NewMapModal = ({
	isOpen,
	tiles,
	initial = {},
	replacesPaintedMap = false,
	onClose,
	onSubmit,
}: NewMapModalProps) => (
	<BaseModal isOpen={isOpen} onClose={onClose}>
		<NewMapForm
			tiles={tiles}
			initial={initial}
			replacesPaintedMap={replacesPaintedMap}
			onClose={onClose}
			onSubmit={onSubmit}
		/>
	</BaseModal>
)
