import type { TileDef } from '@/lib/types'
import type { TileDefinitionFormData } from '@/schemas'

// The form is still flat; the stored doc nests the glyph and carries kind.
// Interim bridge until the form edits the glyph directly ([Tools 3]).
export const toTileDef = ({
	symbol,
	color,
	bg,
	...rest
}: TileDefinitionFormData): TileDef => ({
	...rest,
	kind: 'terrain',
	glyph: { symbol, color, bg },
})

export const toTileForm = (t: TileDef): TileDefinitionFormData => ({
	id: t.id ?? '',
	symbol: t.glyph.symbol,
	color: t.glyph.color,
	name: t.name,
	bg: t.glyph.bg,
	moveCost: t.moveCost,
	isWalkable: t.isWalkable,
	description: t.description,
	encounterRate: t.encounterRate,
})
