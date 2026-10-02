import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	webpack: (config, { dev }) => {
		if (dev) {
			config.watchOptions = {
				poll: 500, // Check for file changes every 500ms
				aggregateTimeout: 300,
			}
		}
		return config
	},
	turbopack: {},
}

export default nextConfig
