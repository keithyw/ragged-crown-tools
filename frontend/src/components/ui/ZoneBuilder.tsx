'use client'

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ComponentProps,
} from 'react'
import { get, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	Breadcrumbs,
	Button,
	CancelSubmitButton,
	FormInput,
	ItemPickerModal,
	NewMapModal,
	ObjectPickerModal,
	PortalPickerModal,
	SelectDropdown,
	ServerErrorMessages,
	SpinnerSection,
	StackDrawer,
	TilePickerModal,
	ToolPickerSection,
	ZoneMapGrid,
	type Crumb,
	type NewMapValues,
	type StackDef,
} from '@/components'
import { useCollection } from '@/hooks'
import type {
	ItemDef,
	ObjectDef,
	PortalDef,
	Position,
	TileDef,
	Zone,
} from '@/lib/types'
import {
	canPlaceOnTop,
	cellKey,
	createGrid,
	defKey,
	gridSize,
	handleFormErrors,
	hasPaintedContent,
	paintCell,
	placementsWithin,
	pushPlacement,
	replaceStack,
	type Placements,
	type ZoneGrid,
} from '@/lib/utils'
import {
	zoneDetailsSchema,
	zoneSchema,
	type ZoneDetailsFormData,
} from '@/schemas'
import { detailFields } from '@/app/zone/fields'

// One tool at a time; a click on the map does exactly one thing.
type Tool = 'paint' | 'start' | 'object' | 'item' | 'portal' | 'stack'
// The tools offered in the tool selector. Start and stack have their own
// sections.
type PlaceTool = Exclude<Tool, 'start' | 'stack'>

const PLACE_TOOLS: { value: PlaceTool; label: string }[] = [
	{ value: 'paint', label: 'Paint terrain' },
	{ value: 'object', label: 'Place object' },
	{ value: 'item', label: 'Place item' },
	{ value: 'portal', label: 'Place portal' },
]

interface ZoneBuilderProps {
	breadcrumbs: Crumb[]
	cancelUrl: string
	// Edit passes the saved zone to start from; Create passes nothing.
	initialZone?: Zone
	// Saves the assembled zone: Create POSTs it, Edit PUTs it. A thrown error is
	// shown on the form.
	onSave: (zone: Zone) => Promise<void>
}

export const ZoneBuilder = ({
	breadcrumbs,
	cancelUrl,
	initialZone,
	onSave,
}: ZoneBuilderProps) => {
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<ZoneDetailsFormData>({
		resolver: zodResolver(zoneDetailsSchema),
		defaultValues: {
			id: initialZone?.id ?? '',
			name: initialZone?.name ?? '',
			dangerLevel: initialZone?.dangerLevel ?? 0,
		},
	})
	const [triedToSave, setTriedToSave] = useState(false)
	const [tool, setTool] = useState<Tool | null>(null)
	// Which tool the selector shows. Always starts at the first one.
	const [selectedTool, setSelectedTool] = useState<PlaceTool>(
		PLACE_TOOLS[0].value,
	)
	const [activeTileId, setActiveTileId] = useState<string | null>(null)
	const [activeObjectId, setActiveObjectId] = useState<string | null>(null)
	const [activeItemId, setActiveItemId] = useState<string | null>(null)
	const [activePortalId, setActivePortalId] = useState<string | null>(null)
	const [placements, setPlacements] = useState<Placements | undefined>(
		initialZone?.placements,
	)
	const [startingPosition, setStartingPosition] = useState<
		Position | undefined
	>(initialZone?.startingPosition)
	const [grid, setGrid] = useState<ZoneGrid | null>(
		initialZone?.terrain ?? null,
	)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isPickerOpen, setIsPickerOpen] = useState(false)
	const [isObjectPickerOpen, setIsObjectPickerOpen] = useState(false)
	const [isItemPickerOpen, setIsItemPickerOpen] = useState(false)
	const [isPortalPickerOpen, setIsPortalPickerOpen] = useState(false)
	// The cell whose stack is open in the drawer.
	const [selectedCell, setSelectedCell] = useState<Position | null>(null)
	const [isStackOpen, setIsStackOpen] = useState(false)
	const {
		items: tiles,
		isLoading: tilesLoading,
		error: tilesError,
	} = useCollection<TileDef>('tile_defs')
	const {
		items: objects,
		isLoading: objectsLoading,
		error: objectsError,
	} = useCollection<ObjectDef>('entities', { filter: { kind: 'object' } })
	const {
		items,
		isLoading: itemsLoading,
		error: itemsError,
	} = useCollection<ItemDef>('items')
	const {
		items: portals,
		isLoading: portalsLoading,
		error: portalsError,
	} = useCollection<PortalDef>('entities', { filter: { kind: 'portal' } })
	const isLoading =
		tilesLoading || objectsLoading || itemsLoading || portalsLoading
	const error = tilesError ?? objectsError ?? itemsError ?? portalsError

	const tilesById = useMemo(
		() => new Map(tiles.map((t) => [t._id, t])),
		[tiles],
	)

	// Defs that can sit on the terrain, keyed like a Placement (kind + _id).
	const placedDefs = useMemo(
		() =>
			new Map<string, StackDef>([
				...objects.map((o) => [defKey('object', o._id), o] as const),
				...items.map((i) => [defKey('item', i._id), i] as const),
				...portals.map((p) => [defKey('portal', p._id), p] as const),
			]),
		[objects, items, portals],
	)

	// The item choices for a placement's custom item slots.
	const itemChoices = useMemo(
		() =>
			items.map((i) => ({
				kind: 'item' as const,
				_id: i._id,
				name: i.name,
				stackable: i.stackable,
			})),
		[items],
	)

	const activeTile = activeTileId ? tilesById.get(activeTileId) : undefined
	const activeObject = objects.find((o) => o._id === activeObjectId)
	const activeItem = items.find((i) => i._id === activeItemId)
	const activePortal = portals.find((p) => p._id === activePortalId)
	const selectedStack = selectedCell
		? (placements?.[cellKey(selectedCell.x, selectedCell.y)] ?? [])
		: []
	const hasPlacements = Object.keys(placements ?? {}).length > 0

	useEffect(() => {
		if (
			!tool ||
			isPickerOpen ||
			isObjectPickerOpen ||
			isItemPickerOpen ||
			isPortalPickerOpen ||
			isStackOpen
		)
			return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setTool(null)
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [
		tool,
		isPickerOpen,
		isObjectPickerOpen,
		isItemPickerOpen,
		isPortalPickerOpen,
		isStackOpen,
	])

	const handleCell = useCallback(
		(x: number, y: number) => {
			if (tool === 'paint' && activeTileId) {
				setGrid((prev) => (prev ? paintCell(prev, x, y, activeTileId) : prev))
			} else if (tool === 'start') {
				// One-shot: pick a tile, then the tool turns off.
				setStartingPosition({ x, y })
				setTool(null)
			} else if (tool === 'object' && activeObject) {
				const key = cellKey(x, y)
				if (!canPlaceOnTop(placements, key, 'object', activeObject._id)) {
					// A fixed id makes a repeat replace this toast instead of piling up.
					toast.error(`${activeObject.name} is already on top of this cell.`, {
						id: 'duplicate-placement',
					})
					return
				}
				setPlacements((prev) =>
					pushPlacement(prev, key, {
						uid: crypto.randomUUID(),
						defKind: 'object',
						defId: activeObject._id,
					}),
				)
			} else if (tool === 'item' && activeItem) {
				// No duplicate check for items: the same item can go on a stack more
				// than once (100 gold and 200 gold). A stackable item starts at
				// quantity 1; changing it is for the stack manager (Tools 12).
				setPlacements((prev) =>
					pushPlacement(prev, cellKey(x, y), {
						uid: crypto.randomUUID(),
						defKind: 'item',
						defId: activeItem._id,
						...(activeItem.stackable ? { quantity: 1 } : {}),
					}),
				)
			} else if (tool === 'portal' && activePortal) {
				const key = cellKey(x, y)
				if (!canPlaceOnTop(placements, key, 'portal', activePortal._id)) {
					toast.error(`${activePortal.name} is already on top of this cell.`, {
						id: 'duplicate-placement',
					})
					return
				}
				// No destination yet: it is set in the stack drawer.
				setPlacements((prev) =>
					pushPlacement(prev, key, {
						uid: crypto.randomUUID(),
						defKind: 'portal',
						defId: activePortal._id,
					}),
				)
			} else if (tool === 'stack') {
				// Stays on after the drawer closes, so the next stack is one click away.
				if (!placements?.[cellKey(x, y)]?.length) {
					toast(`Nothing is placed at x ${x}, y ${y}.`, { id: 'empty-stack' })
					return
				}
				setSelectedCell({ x, y })
				setIsStackOpen(true)
			}
		},
		[tool, activeTileId, activeObject, activeItem, activePortal, placements],
	)

	// What the tool selector shows for each tool.
	const toolSections: Record<
		PlaceTool,
		ComponentProps<typeof ToolPickerSection>
	> = {
		paint: {
			title: 'Paint',
			def: activeTile,
			noneLabel: 'No tile selected',
			chooseLabel: 'Choose tile',
			changeLabel: 'Change tile',
			startLabel: 'Paint',
			hasMap: !!grid,
			isActive: tool === 'paint',
			onChoose: () => setIsPickerOpen(true),
			onStart: () => setTool('paint'),
			onStop: () => setTool(null),
			activeHint: 'Click or drag on the map to paint. Esc to stop.',
			resumeHint: 'Press Paint to continue with this tile.',
			chooseHint: 'Choose a tile to start painting.',
		},
		object: {
			title: 'Object',
			def: activeObject,
			noneLabel: 'No object selected',
			chooseLabel: 'Choose object',
			changeLabel: 'Change object',
			startLabel: 'Place',
			hasMap: !!grid,
			isActive: tool === 'object',
			onChoose: () => setIsObjectPickerOpen(true),
			onStart: () => setTool('object'),
			onStop: () => setTool(null),
			activeHint: 'Click or drag on the map to place. Esc to stop.',
			resumeHint: 'Press Place to continue with this object.',
			chooseHint: 'Choose an object to start placing.',
		},
		item: {
			title: 'Item',
			def: activeItem,
			noneLabel: 'No item selected',
			chooseLabel: 'Choose item',
			changeLabel: 'Change item',
			startLabel: 'Place',
			hasMap: !!grid,
			isActive: tool === 'item',
			onChoose: () => setIsItemPickerOpen(true),
			onStart: () => setTool('item'),
			onStop: () => setTool(null),
			activeHint: 'Click a cell to place the item. Esc to stop.',
			resumeHint: 'Press Place to continue with this item.',
			chooseHint: 'Choose an item to start placing.',
		},
		portal: {
			title: 'Portal',
			def: activePortal,
			noneLabel: 'No portal selected',
			chooseLabel: 'Choose portal',
			changeLabel: 'Change portal',
			startLabel: 'Place',
			hasMap: !!grid,
			isActive: tool === 'portal',
			onChoose: () => setIsPortalPickerOpen(true),
			onStart: () => setTool('portal'),
			onStop: () => setTool(null),
			activeHint: 'Click a cell to place the portal. Esc to stop.',
			resumeHint: 'Press Place to continue with this portal.',
			chooseHint: 'Choose a portal to start placing.',
		},
	}

	const handleDraw = ({ width, height, tileId }: NewMapValues) => {
		setGrid(createGrid(width, height, tileId))
		// Keep the start and the placements only if they still fit on the redrawn
		// map.
		setStartingPosition((p) =>
			p && p.x < width && p.y < height ? p : undefined,
		)
		setPlacements((p) => placementsWithin(p, width, height))
		setSelectedCell(null)
		setIsModalOpen(false)
	}

	// The details come validated from the form; the map and start position are
	// checked here, then the assembled zone gets one last pass through zoneSchema.
	const save = handleSubmit(async (details) => {
		if (!grid || !startingPosition) return
		const parsed = zoneSchema.safeParse({
			...details,
			terrain: grid,
			startingPosition,
			placements,
		})
		if (!parsed.success) {
			toast.error(parsed.error.issues[0].message)
			return
		}
		try {
			await onSave(parsed.data)
		} catch (e: unknown) {
			handleFormErrors<ZoneDetailsFormData>(
				e,
				setError,
				'Failed to save the zone.',
			)
		}
	})

	const sz = grid ? gridSize(grid) : null

	if (isLoading) {
		return (
			<SpinnerSection spinnerMessage='Loading Tiles, Objects, Items and Portals' />
		)
	}

	if (error) {
		return <ServerErrorMessages message={error} />
	}

	return (
		<>
			<Breadcrumbs items={breadcrumbs} />
			<div className='grid items-start gap-6 lg:grid-cols-[1fr_20rem]'>
				<section>
					{grid ? (
						<ZoneMapGrid
							grid={grid}
							tilesById={tilesById}
							placements={placements}
							placedDefs={placedDefs}
							startingPosition={startingPosition}
							selectedCell={selectedCell}
							onCellAction={tool ? handleCell : undefined}
							dragToApply={tool === 'paint' || tool === 'object'}
						/>
					) : (
						<div className='rounded border border-dashed border-gray-300 p-16 text-center text-xl font-medium text-gray-700'>
							Use Draw Map in the panel on the right to get started. You choose
							the size and a default tile.
						</div>
					)}
				</section>
				<aside className='sticky top-4 space-y-4 rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
					<section>
						<h3 className='mb-2 text-sm font-bold text-gray-700'>Map</h3>
						<Button
							type='button'
							actionType='submit'
							onClick={() => setIsModalOpen(true)}
						>
							{grid ? 'Redraw Map' : 'Draw Map'}
						</Button>
						{sz ? (
							<dl className='mt-3 text-sm'>
								<div className='flex justify-between'>
									<dt className='text-gray-500'>Size</dt>
									<dd>
										{sz.width} x {sz.height}
									</dd>
								</div>
							</dl>
						) : (
							<p className='mt-2 text-base font-medium text-gray-700'>
								Start here: choose a size and a default tile.
							</p>
						)}
					</section>
					<section>
						<h3 className='mb-2 text-sm font-bold text-gray-700'>Details</h3>
						{detailFields.map((field) => (
							<FormInput
								key={field.name}
								field={field}
								register={register}
								errorMessage={get(errors, field.name)?.message}
							/>
						))}
					</section>
					<section>
						<SelectDropdown
							id='tool'
							label='Tool'
							options={PLACE_TOOLS}
							selectedValue={selectedTool}
							onSelect={(v) => {
								setSelectedTool(v as PlaceTool)
								// Switching tools stops the one that was running. Start and
								// stack are left alone.
								if (tool !== 'start' && tool !== 'stack') setTool(null)
							}}
						/>
						<ToolPickerSection {...toolSections[selectedTool]} />
					</section>
					<section>
						<h3 className='mb-2 text-sm font-bold text-gray-700'>Stack</h3>
						{tool === 'stack' ? (
							<Button
								type='button'
								actionType='neutral'
								onClick={() => setTool(null)}
							>
								Done
							</Button>
						) : (
							<Button
								type='button'
								actionType='submit'
								disabled={!hasPlacements}
								onClick={() => setTool('stack')}
							>
								Manage stack
							</Button>
						)}
						{tool === 'stack' && (
							<p className='mt-2 text-sm text-gray-500'>
								Click a cell with placements to open its stack. Esc to stop.
							</p>
						)}
					</section>
					<section>
						<h3 className='mb-2 text-sm font-bold text-gray-700'>
							Start Position
						</h3>
						<div className='mb-3 text-sm'>
							{startingPosition ? (
								<span>
									x {startingPosition.x}, y {startingPosition.y}
								</span>
							) : (
								<span className='text-gray-500'>Not set</span>
							)}
						</div>
						{tool === 'start' ? (
							<Button
								type='button'
								actionType='neutral'
								onClick={() => setTool(null)}
							>
								Cancel
							</Button>
						) : (
							<Button
								type='button'
								actionType='submit'
								disabled={!grid}
								onClick={() => setTool('start')}
							>
								{startingPosition ? 'Change start' : 'Choose start'}
							</Button>
						)}
						{tool === 'start' && (
							<p className='mt-2 text-sm text-gray-500'>
								Click a tile on the map to set the start. Esc to cancel.
							</p>
						)}
					</section>
					<section>
						<div className='flex flex-col items-start gap-2'>
							<Button
								type='button'
								actionType='submit'
								disabled={!grid || isSubmitting}
								onClick={() => {
									setTriedToSave(true)
									void save()
								}}
							>
								{isSubmitting ? 'Saving...' : 'Save Zone'}
							</Button>
							<CancelSubmitButton cancelUrl={cancelUrl} />
						</div>
						{triedToSave && grid && !startingPosition && (
							<p className='mt-2 text-sm text-red-600'>
								Choose a start position.
							</p>
						)}
						{errors.root?.serverError && (
							<p className='mt-2 text-sm text-red-600'>
								{errors.root.serverError.message}
							</p>
						)}
					</section>
				</aside>
			</div>
			<TilePickerModal
				isOpen={isPickerOpen}
				tiles={tiles}
				selectedId={activeTileId}
				onClose={() => setIsPickerOpen(false)}
				onSelect={(t) => {
					setActiveTileId(t._id)
					setTool('paint')
					setIsPickerOpen(false)
				}}
			/>

			<ObjectPickerModal
				isOpen={isObjectPickerOpen}
				objects={objects}
				selectedId={activeObjectId}
				onClose={() => setIsObjectPickerOpen(false)}
				onSelect={(o) => {
					setActiveObjectId(o._id)
					setTool('object')
					setIsObjectPickerOpen(false)
				}}
			/>

			<ItemPickerModal
				isOpen={isItemPickerOpen}
				items={items}
				selectedId={activeItemId}
				onClose={() => setIsItemPickerOpen(false)}
				onSelect={(i) => {
					setActiveItemId(i._id)
					setTool('item')
					setIsItemPickerOpen(false)
				}}
			/>

			<PortalPickerModal
				isOpen={isPortalPickerOpen}
				portals={portals}
				selectedId={activePortalId}
				onClose={() => setIsPortalPickerOpen(false)}
				onSelect={(p) => {
					setActivePortalId(p._id)
					setTool('portal')
					setIsPortalPickerOpen(false)
				}}
			/>

			<StackDrawer
				isOpen={isStackOpen}
				cell={selectedCell}
				stack={selectedStack}
				placedDefs={placedDefs}
				items={itemChoices}
				itemsLoading={itemsLoading}
				onChange={(stack) => {
					if (!selectedCell) return
					setPlacements((prev) =>
						replaceStack(prev, cellKey(selectedCell.x, selectedCell.y), stack),
					)
					// Deleting the last one empties the cell; there's nothing left to show.
					if (stack.length === 0) {
						setIsStackOpen(false)
						setSelectedCell(null)
					}
				}}
				onClose={() => {
					setIsStackOpen(false)
					setSelectedCell(null)
				}}
			/>

			<NewMapModal
				isOpen={isModalOpen}
				tiles={tiles}
				initial={
					grid && sz
						? { width: sz.width, height: sz.height, tileId: grid[0][0] }
						: undefined
				}
				replacesPaintedMap={grid ? hasPaintedContent(grid) : false}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleDraw}
			/>
		</>
	)
}
