'use client'

import { Breadcrumbs, CreateItemSection } from '@/components'
import { URLS } from '@/lib/constants'

const ZonePage = () => {
	return (
		<>
			<Breadcrumbs items={[{ label: 'Zones' }]} />
			<CreateItemSection href={`${URLS.ZONE}/create`}>
				Create Tile Definition
			</CreateItemSection>
		</>
	)
}

export default ZonePage
