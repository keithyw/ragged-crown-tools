// Everything in this list is shared with the game, which keeps a hand copy
// (ARCHITECTURE.md 5). Tools-only types (sprite, zoneSpec, zoneReview, ...)
// stay out of it. The MCP maps `@/lib/types` here, so it doesn't pull in the
// UI types.
export * from './core'
export * from './defs'
export * from './interactions'
export * from './map'
