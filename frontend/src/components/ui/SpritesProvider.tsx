'use client'

import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useCollection } from '@/hooks'
import { type Sprite } from '@/lib/types'

const SpritesContext = createContext<ReadonlyMap<string, Sprite>>(new Map())

// Loads the sprites once for the whole app, so TileGlyph can look one up by a
// def's spriteId without every call site fetching or passing them down.
export const SpritesProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const { items, refresh } = useCollection<Sprite>('sprites')
	const pathname = usePathname()

	// Sprites change on the sprite pages, and a navigation follows each save or
	// delete, so refetch then. The old list stays in place while it loads.
	const firstPath = useRef(pathname)
	useEffect(() => {
		if (pathname !== firstPath.current) refresh()
	}, [pathname, refresh])

	const sprites = useMemo(() => new Map(items.map((s) => [s._id, s])), [items])

	return (
		<SpritesContext.Provider value={sprites}>
			{children}
		</SpritesContext.Provider>
	)
}

// Sprites by _id. Empty until loaded, which draws the glyph meanwhile.
export const useSprites = () => useContext(SpritesContext)
