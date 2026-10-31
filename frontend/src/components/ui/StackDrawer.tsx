'use client'

import { useState } from 'react'
import {
	Button,
	ConfirmationModal,
	CustomValueInput,
	DestinationPickerModal,
	ReorderableList,
	SlideOverDrawer,
	TileGlyph,
	type DestinationPickerData,
} from '@/components'
import type { PlaceableDef } from '@/hooks'
import {
	type CustomValue,
	type Destination,
	type Glyph,
	type Interaction,
	type Placement,
	type Position,
} from '@/lib/types'
import {
	cellKey,
	customSlotsOf,
	defKey,
	summarizeInteraction,
	type SummaryContext,
} from '@/lib/utils'

export interface StackDef {
	glyph: Glyph
	name: string
	interactions?: Interaction[]
}

interface StackDrawerProps {
	isOpen: boolean
	cell: Position | null
	// Bottom to top, as stored.
	stack: Placement[]
	placedDefs: ReadonlyMap<string, StackDef>
	items: PlaceableDef[] // for item slots
	itemsLoading: boolean
	// Zones and map data for naming a portal's destination and picking one.
	destinationPicker: DestinationPickerData
	// Gets the cell's whole stack after an edit, bottom to top.
	onChange: (stack: Placement[]) => void
	onClose: () => void
}

// One cell's placements, top first. Rows are reordered by dragging or with the
// selected row's arrows, and the selected one can be deleted or have its def's
// custom slots filled in. Every edit goes straight to the zone through
// onChange.
export const StackDrawer = ({
	isOpen,
	cell,
	stack,
	placedDefs,
	items,
	itemsLoading,
	destinationPicker,
	onChange,
	onClose,
}: StackDrawerProps) => {
	const topFirst = [...stack].reverse()
	const [selectedUid, setSelectedUid] = useState<string | null>(null)
	const [isConfirmOpen, setIsConfirmOpen] = useState(false)
	const [isDestinationOpen, setIsDestinationOpen] = useState(false)
	// Opening another cell, or reopening this one, starts with nothing selected.
	const cellId = cell ? cellKey(cell.x, cell.y) : null
	const [shownCell, setShownCell] = useState(cellId)
	if (cellId !== shownCell) {
		setShownCell(cellId)
		setSelectedUid(null)
	}

	const selected = stack.find((p) => p.uid === selectedUid)
	const selectedDef = selected
		? placedDefs.get(defKey(selected.defKind, selected.defId))
		: undefined
	const selectedName = selectedDef?.name ?? 'this placement'
	// Only interactions with something to fill in are shown.
	const slotGroups = (selectedDef?.interactions ?? [])
		.map((i) => ({ interaction: i, slots: customSlotsOf(i) }))
		.filter((g) => g.slots.length > 0)
	const names: SummaryContext = {
		defName: (kind, id) => placedDefs.get(defKey(kind, id))?.name ?? id,
	}

	// The value belongs to the placement, so it moves with it in the stack.
	const setCustomValue = (slotId: string, value: CustomValue) =>
		onChange(
			stack.map((p) =>
				p.uid === selectedUid
					? { ...p, customValues: { ...p.customValues, [slotId]: value } }
					: p,
			),
		)

	// Clearing removes the key, so an unset destination is never stored as null.
	const setDestination = (destination: Destination | undefined) =>
		onChange(
			stack.map((p) => {
				if (p.uid !== selectedUid) return p
				const next = { ...p, destination }
				if (!destination) delete next.destination
				return next
			}),
		)

	const describeDestination = (d: Destination) => {
		const z =
			destinationPicker.zones.find((z) => z._id === d.zoneId) ??
			(d.zoneId === destinationPicker.thisZone._id
				? destinationPicker.thisZone
				: undefined)
		const zone = z ? z.name : '(missing zone)'
		return d.pos
			? `${zone}, x ${d.pos.x}, y ${d.pos.y}`
			: `${zone}, at its start position`
	}

	const deleteSelected = () => {
		onChange(stack.filter((p) => p.uid !== selectedUid))
		setSelectedUid(null)
		setIsConfirmOpen(false)
	}

	return (
		<SlideOverDrawer
			title={cell ? `Stack at x ${cell.x}, y ${cell.y}` : 'Stack'}
			isOpen={isOpen}
			onClose={onClose}
			size='lg'
		>
			{topFirst.length === 0 ? (
				<p className='text-sm text-gray-500'>Nothing placed here.</p>
			) : (
				<>
					<ReorderableList
						items={topFirst}
						getKey={(p) => p.uid}
						onReorder={(items) => onChange([...items].reverse())}
						selectedKey={selectedUid}
						onSelect={setSelectedUid}
						renderItem={(p, idx) => {
							// A missing def gives undefined, which TileGlyph draws as "?".
							const def = placedDefs.get(defKey(p.defKind, p.defId))
							return (
								<div className='flex items-center gap-3'>
									<TileGlyph variant='cell' tile={def} />
									<div className='min-w-0 flex-1'>
										<div className='truncate text-sm font-medium text-gray-900'>
											{def?.name ?? 'Missing definition'}
										</div>
										<div className='text-xs text-gray-500'>
											{p.defKind}
											{p.quantity !== undefined && ` · x${p.quantity}`}
											{p.defKind === 'portal' && !p.destination && (
												<span className='text-amber-700'>
													{' '}
													· No destination
												</span>
											)}
										</div>
									</div>
									{idx === 0 && (
										<span className='text-xs text-gray-500'>Top</span>
									)}
								</div>
							)
						}}
					/>
					<div className='mt-4'>
						<Button
							type='button'
							actionType='delete'
							disabled={!selected}
							onClick={() => setIsConfirmOpen(true)}
						>
							Delete
						</Button>
					</div>
					{selected?.defKind === 'portal' && (
						<section className='mt-6 border-t border-gray-200 pt-4'>
							<h3 className='mb-3 text-sm font-bold text-gray-900'>
								Destination for {selectedName}
							</h3>
							<p className='mb-3 text-sm text-gray-700'>
								{selected.destination
									? describeDestination(selected.destination)
									: 'Not set'}
							</p>
							<div className='flex gap-2'>
								<Button
									type='button'
									actionType='edit'
									onClick={() => setIsDestinationOpen(true)}
								>
									{selected.destination
										? 'Change destination'
										: 'Set destination'}
								</Button>
								<Button
									type='button'
									actionType='neutral'
									disabled={!selected.destination}
									onClick={() => setDestination(undefined)}
								>
									Clear
								</Button>
							</div>
						</section>
					)}
					{selected && (
						<section className='mt-6 border-t border-gray-200 pt-4'>
							<h3 className='mb-3 text-sm font-bold text-gray-900'>
								Custom values for {selectedName}
							</h3>
							{slotGroups.length === 0 ? (
								<p className='text-sm text-gray-500'>
									Nothing on this definition is set per placement.
								</p>
							) : (
								slotGroups.map(({ interaction, slots }) => (
									<div key={interaction.id} className='mb-4'>
										<p className='mb-2 text-xs text-gray-500'>
											{summarizeInteraction(interaction, names)}
										</p>
										{slots.map((slot, idx) =>
											// Stored before slots existed: no key to save a value under.
											slot.slot ? (
												<CustomValueInput
													key={slot.slot}
													id={`custom-${slot.slot}`}
													slot={slot}
													value={selected.customValues?.[slot.slot]}
													onChange={(v) => setCustomValue(slot.slot, v)}
													items={items}
													itemsLoading={itemsLoading}
												/>
											) : (
												<p key={idx} className='mb-4 text-sm text-amber-700'>
													Save {selectedName} again in its editor to fill this
													in.
												</p>
											),
										)}
									</div>
								))
							)}
						</section>
					)}
				</>
			)}
			<ConfirmationModal
				isOpen={isConfirmOpen}
				title='Delete placement'
				message={`Delete ${selectedName} from this stack? Anything set on this placement (a custom message, contents, a destination) is deleted with it.`}
				confirmButtonText='Delete'
				// Nothing to wait for: the delete is in memory until Save Zone.
				isDeleting={false}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={deleteSelected}
			/>
			<DestinationPickerModal
				{...destinationPicker}
				isOpen={isDestinationOpen}
				initial={selected?.destination}
				onClose={() => setIsDestinationOpen(false)}
				onConfirm={(destination) => {
					setDestination(destination)
					setIsDestinationOpen(false)
				}}
			/>
		</SlideOverDrawer>
	)
}
