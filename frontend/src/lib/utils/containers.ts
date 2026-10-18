import type { ContainerSpec, Placement } from '@/lib/types'

// Overall ceiling on container nesting, counting the outermost container.
// The engine enforces the same number.
export const MAX_CONTAINER_DEPTH = 3

// Levels a container def allows, counting itself. Absent, 0 or 1 = no nesting.
export const allowedDepth = (spec: ContainerSpec | undefined) =>
	Math.min(Math.max(spec?.maxDepth ?? 1, 1), MAX_CONTAINER_DEPTH)

// Levels of containers in a placement tree, counting `p` itself; 0 if `p` is
// not a container. Whether something is a container comes from its def, so
// the caller supplies the lookup.
export const containerDepth = (
	p: Placement,
	specOf: (p: Placement) => ContainerSpec | undefined,
): number => {
	if (!specOf(p)) return 0
	const inner = (p.contents ?? []).map((c) => containerDepth(c, specOf))
	return 1 + Math.max(0, ...inner)
}

// True when `p` and every container inside it stay within their allowed depth.
export const isDepthValid = (
	p: Placement,
	specOf: (p: Placement) => ContainerSpec | undefined,
): boolean => {
	const spec = specOf(p)
	if (spec && containerDepth(p, specOf) > allowedDepth(spec)) return false
	return (p.contents ?? []).every((c) => isDepthValid(c, specOf))
}
