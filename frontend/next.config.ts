import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// The sandbox UI (pnpm dev:sandbox) builds into its own folder, so it can run
	// next to the normal dev server: Next allows one `next dev` per folder.
	distDir: process.env.NEXT_DIST_DIR ?? '.next',
	webpack: (config, { dev }) => {
		if (dev) {
			config.watchOptions = {
				poll: 500, // Check for file changes every 500ms
				aggregateTimeout: 200,
				ignored: ['node_modules', '.next'],
			}
		}
		return config
	},
	turbopack: {},
}

export default nextConfig
