export interface Position {
	x: number
	y: number
}
export type TileType =
	| 'GRASS'
	| 'DIRT'
	| 'FOREST'
	| 'MOUNTAIN'
	| 'WATER'
	| 'ROAD'
	| 'CASTLE'
	| 'HUT'
	| 'CHEST'
	| 'TAVERN'
	| 'WELL'
	| 'CROPS'
	| 'BARN'
	| 'DOOR'
	| 'BED'
	| 'CROWD'

export type TileType2 =
	TerrainTile | BuildingTile | CreatureTile | InventoryItemTile | StationaryTile

export type TerrainTile =
	| 'GRASS'
	| 'DESSERT'
	| 'DIRT'
	| 'FOREST'
	| 'HILL'
	| 'MOUNTAIN'
	| 'SNOW'
	| 'SWAMP'
	| 'WATER'

export type BuildingTile =
	'CASTLE' | 'DUNGEON' | 'HUT' | 'TAVERN' | 'BARN' | 'VILLAGE' | 'TOWN'

// keep simple for now
export type CreatureTile = 'MONSTER' | 'PERSON'

export type InventoryItemTile =
	'ARMOR' | 'BAG' | 'BOW' | 'GOLD' | 'QUEST_ITEM' | 'SHIELD' | 'WEAPON'

export type StationaryTile =
	| 'BED'
	| 'CABINET'
	| 'CHAIR'
	| 'CHEST'
	| 'CROPS'
	| 'DOOR'
	| 'FENCE'
	| 'PLANT'
	| 'SIGN'
	| 'TABLE'

export interface TileDef {
	id: string
	type: TileType
	symbol: string
	color: string
	name: string
	bg: string
	moveCost: number
	isWalkable?: boolean
	isConsumable?: boolean
	spriteCoords: Position
	description?: string
	encounterRate?: number
	encounterTableKey?: string
}

export type TileObjectTypes = Record<string, TileDef>

export type InteractionType =
	| 'WALK'
	| 'TALK'
	| 'PICKUP'
	| 'DROP'
	| 'USE'
	| 'OPEN'
	| 'CLOSE'
	| 'BUMP_INTERACT'

export type ActionType =
	| 'GIVE_ITEM'
	| 'PLAY_SOUND'
	| 'SHOW_DIALOG'
	| 'SET_FLAG'
	| 'SPAWN_OBJECT'
	| 'MODIFY_ATTRIBUTE'
	| 'POP_STACK'

export interface ActionPayload {
	amount?: number
	dialogKey?: string
	flagName?: string
	itemId?: string
	popOnComplete?: boolean
	targetZone?: string
	targetPos?: Position
	soundEffect?: string
	spawnTileId?: string
	text?: string
	type: ActionType
	tile: TileType // a spot on a map can be layered
	triggerOn: InteractionType
}

export interface MoveResult {
	canMove: boolean
	nextPos: Position
	targetTile?: TileDef
	blockReason?: string
}

export interface Zone {
	id: string
	name: string
	dimensions?: { width: number; height: number }
	dangerLevel: number
	startingPosition?: Position
	terrain: string[][]
	// key is x, y
	tileEvents?: Record<string, ActionPayload[]>
}
