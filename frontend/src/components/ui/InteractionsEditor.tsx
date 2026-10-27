'use client'

import { useState } from 'react'
import { Button, InteractionModal } from '@/components'
import { usePlaceableDefs } from '@/hooks'
import type { Interaction, InteractionType } from '@/lib/types'
import { blankInteraction, summarizeInteraction } from '@/lib/utils'

interface InteractionsEditorProps {
	value: Interaction[] | undefined
	onChange: (next: Interaction[]) => void
	defaultTrigger?: InteractionType // what a new interaction starts on
}

// The list of an object's interactions, with a modal to add and edit one.
// It knows nothing about the form around it, so a placement's own interactions
// can reuse it later.
export const InteractionsEditor = ({
	value,
	onChange,
	defaultTrigger,
}: InteractionsEditorProps) => {
	const list = value ?? []
	const { defs, isLoading, defName } = usePlaceableDefs()
	const names = { defName }
	// index is null while adding a new one.
	const [editing, setEditing] = useState<{
		index: number | null
		interaction: Interaction
	} | null>(null)

	return (
		<section>
			<h3 className='mb-2 text-sm font-bold text-gray-700'>Interactions</h3>
			{list.length === 0 ? (
				<p className='mb-3 text-sm text-gray-500'>No interactions.</p>
			) : (
				<ul className='mb-3 space-y-2'>
					{list.map((it, index) => (
						<li
							key={it.id}
							className='flex items-center justify-between gap-3 rounded border border-gray-200 p-3 text-sm text-gray-900'
						>
							<span className='min-w-0'>{summarizeInteraction(it, names)}</span>
							<span className='flex shrink-0 gap-2'>
								<Button
									type='button'
									actionType='edit'
									onClick={() => setEditing({ index, interaction: it })}
								>
									Edit
								</Button>
								<Button
									type='button'
									actionType='delete'
									onClick={() => onChange(list.filter((_, i) => i !== index))}
								>
									Remove
								</Button>
							</span>
						</li>
					))}
				</ul>
			)}
			<Button
				type='button'
				actionType='submit'
				onClick={() =>
					setEditing({
						index: null,
						interaction: blankInteraction(defaultTrigger),
					})
				}
			>
				Add interaction
			</Button>

			<InteractionModal
				isOpen={editing !== null}
				initial={editing?.interaction ?? null}
				defs={defs}
				defsLoading={isLoading}
				onClose={() => setEditing(null)}
				onSave={(saved) => {
					if (!editing) return
					onChange(
						editing.index === null
							? [...list, saved]
							: list.map((it, i) => (i === editing.index ? saved : it)),
					)
					setEditing(null)
				}}
			/>
		</section>
	)
}
